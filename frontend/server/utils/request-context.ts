import { isIP } from 'node:net'

import type { H3Event } from 'h3'
import { getMethod, getRequestHeader } from 'h3'

type HomepageEventContext = H3Event['context'] & {
  homepageClientIp?: string
  homepageRootMethod?: string
  homepageProtocol?: 'http' | 'https'
  homepageHost?: string
  homepageUserAgent?: string
  homepageReferer?: string
  homepageEffects?: Set<string>
}

/** 将 IPv4-mapped IPv6、带端口 IPv4 和方括号 IPv6 统一为可比较的 IP 字面量。 */
function normalizeIp(rawValue: string | undefined): string | null {
  let value = String(rawValue || '').trim()
  if (!value) return null

  if (value.startsWith('[')) {
    const closing = value.indexOf(']')
    if (closing < 0) return null
    value = value.slice(1, closing)
  } else if (!isIP(value) && /^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.slice(0, value.lastIndexOf(':'))
  }

  // zone id 只在链路本地 IPv6 中有意义，转发时不应继续携带。
  value = value.split('%', 1)[0] || ''
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
  if (mapped?.[1] && isIP(mapped[1]) === 4) return mapped[1]
  return isIP(value) ? value.toLowerCase() : null
}

function isTrustedIpv4(value: string): boolean {
  const parts = value.split('.').map(Number)
  const [a, b] = parts
  return a === 127
    || (a === 10)
    || (a === 172 && b! >= 16 && b! <= 31)
    || (a === 192 && b === 168)
    || (a === 169 && b === 254)
}

/** 与旧 Express 的 loopback/linklocal/uniquelocal 信任范围保持一致。 */
export function isTrustedProxyIp(value: string): boolean {
  const normalized = normalizeIp(value)
  if (!normalized) return false
  if (isIP(normalized) === 4) return isTrustedIpv4(normalized)
  if (normalized === '::1') return true

  const firstHextet = Number.parseInt(normalized.split(':', 1)[0] || '0', 16)
  return (firstHextet & 0xffc0) === 0xfe80 // fe80::/10，link-local
    || (firstHextet & 0xfe00) === 0xfc00 // fc00::/7，unique-local
}

function peerIp(event: H3Event): string {
  return normalizeIp(event.node.req.socket.remoteAddress) || 'unknown'
}

/**
 * 只有直连 peer 可信时才读取 X-Forwarded-For，并从右向左停在第一个不可信地址。
 * 这样客户端无法通过伪造最左侧 XFF 绕过 Spring/OG 的 IP 限速。
 */
export function getClientIp(event: H3Event): string {
  const context = event.context as HomepageEventContext
  if (context.homepageClientIp) return context.homepageClientIp

  const peer = peerIp(event)
  let client = peer
  if (isTrustedProxyIp(peer)) {
    const chain = String(getRequestHeader(event, 'x-forwarded-for') || '').split(',')
    for (let index = chain.length - 1; index >= 0; index--) {
      const candidate = normalizeIp(chain[index])
      if (!candidate) break
      client = candidate
      if (!isTrustedProxyIp(candidate)) break
    }
  }

  context.homepageClientIp = client
  return client
}

function getForwardedProtocol(event: H3Event): 'http' | 'https' {
  const socket = event.node.req.socket as typeof event.node.req.socket & { encrypted?: boolean }
  const fallback = socket.encrypted ? 'https' : 'http'
  if (!isTrustedProxyIp(peerIp(event))) return fallback

  const forwarded = String(getRequestHeader(event, 'x-forwarded-proto') || '')
    .split(',', 1)[0]?.trim().toLowerCase()
  return forwarded === 'http' || forwarded === 'https' ? forwarded : fallback
}

/** 构造访问 Spring 的最小请求头白名单，绝不透传 Cookie 或原始代理链。 */
export function buildBackendHeaders(event: H3Event): Record<string, string> {
  const context = event.context as HomepageEventContext
  const headers: Record<string, string> = {
    accept: getRequestHeader(event, 'accept') || 'application/json',
    'user-agent': context.homepageUserAgent ?? getRequestHeader(event, 'user-agent') ?? '',
    'x-forwarded-for': getClientIp(event),
    'x-forwarded-proto': context.homepageProtocol ?? getForwardedProtocol(event),
    'x-forwarded-host': context.homepageHost ?? getRequestHeader(event, 'host') ?? '',
  }

  for (const name of ['authorization', 'content-type'] as const) {
    const value = getRequestHeader(event, name)
    if (value) headers[name] = value
  }
  const referer = context.homepageReferer ?? getRequestHeader(event, 'referer')
  if (referer) headers.referer = referer
  return headers
}

export function initializeRequestContext(event: H3Event): void {
  const context = event.context as HomepageEventContext
  // Nitro 内部 $fetch 没有 socket peer；仅这种请求可继承根请求已校验的私有上下文头。
  const isInternalSubrequest = peerIp(event) === 'unknown'
  const inheritedIp = isInternalSubrequest
    ? normalizeIp(getRequestHeader(event, 'x-homepage-client-ip'))
    : null
  if (inheritedIp) context.homepageClientIp ??= inheritedIp

  const inheritedRootMethod = isInternalSubrequest
    ? getRequestHeader(event, 'x-homepage-root-method')?.toUpperCase()
    : undefined
  context.homepageRootMethod ||= inheritedRootMethod === 'HEAD'
    ? 'HEAD'
    : getMethod(event).toUpperCase()

  const inheritedProtocol = isInternalSubrequest
    ? getRequestHeader(event, 'x-homepage-protocol')?.toLowerCase()
    : undefined
  context.homepageProtocol ??= inheritedProtocol === 'http' || inheritedProtocol === 'https'
    ? inheritedProtocol
    : getForwardedProtocol(event)
  context.homepageHost ??= isInternalSubrequest
    ? getRequestHeader(event, 'x-homepage-host') || getRequestHeader(event, 'host') || ''
    : getRequestHeader(event, 'host') || ''
  context.homepageUserAgent ??= isInternalSubrequest
    ? getRequestHeader(event, 'x-homepage-user-agent') || ''
    : getRequestHeader(event, 'user-agent') || ''
  context.homepageReferer ??= isInternalSubrequest
    ? getRequestHeader(event, 'x-homepage-referer') || ''
    : getRequestHeader(event, 'referer') || ''
  getClientIp(event)
}

export function isHeadRequest(event: H3Event): boolean {
  const context = event.context as HomepageEventContext
  return context.homepageRootMethod === 'HEAD' || getMethod(event).toUpperCase() === 'HEAD'
}

/**
 * Nitro 的内部 $fetch 会传递 event.context；同一次 SSR 中重复取数只允许领取一次副作用。
 * Nuxt payload 随后负责 hydration 复用，客户端不会再次调用 page API。
 */
export function claimRequestEffect(event: H3Event, effect: string): boolean {
  if (isHeadRequest(event)) return false
  const context = event.context as HomepageEventContext
  const effects = context.homepageEffects ||= new Set<string>()
  if (effects.has(effect)) return false
  effects.add(effect)
  return true
}
