import type { H3Event } from 'h3'
import { setResponseHeader } from 'h3'

import type { NoteSummary, PublicHome } from '#server/types/site'
import { backendJson } from '#server/utils/backend'
import { absoluteUrl, escapeXml } from '#server/utils/seo'

/** RSS 与 feed.xml 共用同一构造器，且只读取摘要，绝不增加笔记阅读数。 */
export async function sendRssFeed(event: H3Event) {
  const [home, notes] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<NoteSummary[]>(event, '/api/public/notes'),
  ])
  const items = notes.map(note => {
    const url = absoluteUrl(event, `/notes/${note.slug}`)
    return `<item><title>${escapeXml(note.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(note.summary)}</description><pubDate>${new Date(note.publishedAt).toUTCString()}</pubDate></item>`
  }).join('')
  const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(home.profile.name)}的技术笔记</title><link>${escapeXml(absoluteUrl(event, '/notes'))}</link><description>${escapeXml(home.profile.description || '')}</description><language>zh-CN</language>${items}</channel></rss>`

  setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=900')
  return rss
}
