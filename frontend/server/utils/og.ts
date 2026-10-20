import { Resvg } from '@resvg/resvg-js'
import type { H3Event } from 'h3'
import { setResponseHeader, setResponseStatus } from 'h3'

import { getErrorStatus } from '#server/utils/backend'
import { escapeXml } from '#server/utils/seo'
import { getClientIp, isHeadRequest } from '#server/utils/request-context'

const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX_ITEMS = 100
const RATE_LIMIT_PER_MINUTE = 30

type OgContent = { title: string, description: string, kicker?: string }
type CacheEntry = { png: Uint8Array, expiresAt: number }
type RateState = { startedAt: number, count: number }

const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<Uint8Array>>()
const rateStates = new Map<string, RateState>()

function consumeRateLimit(event: H3Event): boolean {
  const now = Date.now()
  const ip = getClientIp(event)
  let state = rateStates.get(ip)
  if (!state || now - state.startedAt >= 60_000) {
    state = { startedAt: now, count: 0 }
    rateStates.set(ip, state)
  }
  state.count++

  if (state.count > RATE_LIMIT_PER_MINUTE) {
    const retryAfter = Math.max(1, Math.ceil((60_000 - (now - state.startedAt)) / 1000))
    setResponseHeader(event, 'Retry-After', retryAfter)
    return false
  }

  // 避免大量一次性 IP 永久占据进程内存。
  if (rateStates.size > 10_000) {
    for (const [key, value] of rateStates) {
      if (now - value.startedAt >= 60_000) rateStates.delete(key)
    }
  }
  return true
}

/** 每 IP 30/min；HEAD 计入限额但在任何后端读取和 PNG 渲染之前快速返回。 */
export async function sendOgImage(
  event: H3Event,
  cacheKey: string,
  contentLoader: () => Promise<OgContent> | OgContent,
) {
  if (!consumeRateLimit(event)) {
    setResponseStatus(event, 429)
    event.node.res.end()
    return
  }

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  if (isHeadRequest(event)) {
    event.node.res.end()
    return
  }

  try {
    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      // 删除后重新插入，以 Map 的顺序维护轻量 LRU。
      cache.delete(cacheKey)
      cache.set(cacheKey, cached)
      return cached.png
    }
    if (cached) cache.delete(cacheKey)

    let rendering = inFlight.get(cacheKey)
    if (!rendering) {
      rendering = Promise.resolve(contentLoader()).then(createOgImage)
      inFlight.set(cacheKey, rendering)
    }

    try {
      const png = await rendering
      cache.set(cacheKey, { png, expiresAt: Date.now() + CACHE_TTL_MS })
      while (cache.size > CACHE_MAX_ITEMS) {
        const oldest = cache.keys().next().value as string | undefined
        if (oldest === undefined) break
        cache.delete(oldest)
      }
      return png
    } finally {
      if (inFlight.get(cacheKey) === rendering) inFlight.delete(cacheKey)
    }
  } catch (error) {
    if (getErrorStatus(error) === 404) {
      setResponseStatus(event, 404)
      event.node.res.end()
      return
    }
    throw error
  }
}

/** 使用容器内 Noto CJK 字体生成 1200×630 PNG，不调用任何第三方图像服务。 */
export function createOgImage({ title, description, kicker = 'HUANGXIN.WORK' }: OgContent): Uint8Array {
  const lines = wrapText(String(title || ''), 16, 3)
  const subtitle = truncate(String(description || ''), 48)
  if (lines.length > 1 && [...lines.at(-1)!].length < 4) {
    const previous = [...lines.at(-2)!]
    const move = Math.min(4 - [...lines.at(-1)!].length, Math.max(0, previous.length - 8))
    if (move > 0) {
      lines[lines.length - 1] = previous.splice(previous.length - move).join('') + lines.at(-1)!
      lines[lines.length - 2] = previous.join('')
    }
  }

  const titleSpans = lines.map((line, index) =>
    `<tspan x="78" dy="${index === 0 ? 0 : 84}">${escapeXml(line)}</tspan>`).join('')
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
        <path d="M42 0H0V42" fill="none" stroke="#303638" stroke-width="1"/>
      </pattern>
      <radialGradient id="glow" cx="85%" cy="15%" r="70%">
        <stop offset="0" stop-color="#c9ff4a" stop-opacity=".17"/><stop offset="1" stop-color="#0b0d0f" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" rx="32" fill="#0b0d0f"/>
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="#171b1d" stroke="#363d3f"/>
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="url(#grid)" opacity=".45"/>
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="url(#glow)"/>
    <rect x="78" y="70" width="68" height="68" rx="18" fill="#c9ff4a"/>
    <text x="112" y="113" text-anchor="middle" font-family="Noto Sans CJK SC, sans-serif" font-size="21" font-weight="900" fill="#172000">HX</text>
    <text x="166" y="98" font-family="Noto Sans CJK SC, sans-serif" font-size="16" font-weight="700" letter-spacing="3" fill="#98a19e">${escapeXml(kicker)}</text>
    <text x="78" y="240" font-family="Noto Sans CJK SC, sans-serif" font-size="68" font-weight="800" fill="#f2efe8">${titleSpans}</text>
    <text x="78" y="530" font-family="Noto Sans CJK SC, sans-serif" font-size="22" fill="#98a19e">${escapeXml(subtitle)}</text>
    <circle cx="1082" cy="112" r="42" fill="none" stroke="#c9ff4a" stroke-width="2"/>
    <circle cx="1082" cy="112" r="10" fill="#c9ff4a"/>
    <text x="1082" y="570" text-anchor="end" font-family="monospace" font-size="15" letter-spacing="2" fill="#c9ff4a">BUILD · SHIP · LEARN</text>
  </svg>`

  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans CJK SC' },
  })
  return renderer.render().asPng()
}

function wrapText(value: string, maxUnits: number, maxLines: number): string[] {
  const characters = [...value.trim()]
  const lines: string[] = []
  let current = ''
  let units = 0
  for (const character of characters) {
    const weight = /[\u0000-\u00ff]/.test(character) ? 0.58 : 1
    if (units + weight > maxUnits && current) {
      lines.push(current)
      current = ''
      units = 0
      if (lines.length === maxLines - 1) break
    }
    current += character
    units += weight
  }
  const consumed = lines.join('').length + current.length
  if (consumed < characters.length) current = current.replace(/[，。；：、,.!?\s]*$/, '') + '…'
  if (current) lines.push(current)
  return lines.length ? lines : ['HUANGXIN.WORK']
}

function truncate(value: string, maxLength: number): string {
  const characters = [...value.replace(/\s+/g, ' ').trim()]
  return characters.length > maxLength
    ? characters.slice(0, maxLength).join('') + '…'
    : characters.join('')
}
