import { getRouterParam } from 'h3'

import type { NoteDetail } from '#server/types/site'
import { backendJson } from '#server/utils/backend'
import { sendOgImage } from '#server/utils/og'

export default defineEventHandler((event) => {
  // Nitro 可能把 `:slug.png` 注册为参数键 `slug.png`，同时兼容两种解析结果。
  const slug = (
    getRouterParam(event, 'slug')
    || getRouterParam(event, 'slug.png')
    || ''
  ).replace(/\.png$/i, '')
  return sendOgImage(event, `note:${slug}`, async () => {
    // OG 抓取永远不增加文章阅读数。
    const note = await backendJson<NoteDetail>(
      event,
      `/api/public/notes/${encodeURIComponent(slug)}?count=false`,
    )
    return {
      title: note.title,
      description: note.summary,
      kicker: 'ENGINEERING NOTE',
    }
  })
})
