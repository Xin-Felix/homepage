import type { H3Event } from 'h3'

import type { SeoData } from '#server/types/site'

interface SeoInput {
  title: string
  description?: string | null
  path: string
  imagePath: string
  type?: string
  jsonLd: Record<string, unknown>
  publishedTime?: string
  modifiedTime?: string
}

function siteUrl(event: H3Event): string {
  const config = useRuntimeConfig(event) as { siteUrl?: string }
  // 保留旧 SITE_URL 环境变量，同时允许 NUXT_SITE_URL 覆盖 runtimeConfig。
  const raw = process.env.NUXT_SITE_URL
    || process.env.SITE_URL
    || config.siteUrl
    || 'http://localhost:8080'
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('SITE_URL 必须是有效 URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('SITE_URL 必须是 http/https 地址')
  }
  return parsed.toString().replace(/\/$/, '')
}

/** canonical 一律来自部署配置，不使用可能被伪造的 Host header。 */
export function absoluteUrl(event: H3Event, path: string): string {
  return new URL(path, `${siteUrl(event)}/`).toString()
}

export function buildSeo(event: H3Event, input: SeoInput): SeoData {
  return {
    title: input.title,
    description: input.description || '',
    type: input.type || 'website',
    canonical: absoluteUrl(event, input.path),
    image: absoluteUrl(event, input.imagePath),
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
    // 防止 JSON-LD 中的内容提前闭合 script 标签。
    jsonLd: JSON.stringify(input.jsonLd).replace(/</g, '\\u003c'),
  }
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function escapeXml(value: unknown): string {
  return String(value ?? '').replace(/[<>&"']/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] || character)
}

export function sitemapEntry(
  event: H3Event,
  entry: { path: string, lastmod?: string, changefreq: string, priority: string },
): string {
  const lastmod = entry.lastmod
    ? `<lastmod>${escapeXml(String(entry.lastmod).slice(0, 10))}</lastmod>`
    : ''
  return `<url><loc>${escapeXml(absoluteUrl(event, entry.path))}</loc>${lastmod}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
}
