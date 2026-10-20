import { getRouterParam } from 'h3'

import type { AiProjectDetail } from '#server/types/site'
import { backendJson } from '#server/utils/backend'
import { sendOgImage } from '#server/utils/og'

export default defineEventHandler((event) => {
  // Nitro 可能把 `:slug.png` 注册为参数键 `slug.png`，同时兼容两种解析结果。
  const slug = (
    getRouterParam(event, 'slug')
    || getRouterParam(event, 'slug.png')
    || ''
  ).replace(/\.png$/i, '')
  return sendOgImage(event, `ai:${slug}`, async () => {
    const project = await backendJson<AiProjectDetail>(
      event,
      `/api/public/ai-projects/${encodeURIComponent(slug)}`,
    )
    return {
      title: project.title,
      description: project.summary,
      kicker: 'AI LAB · EXPERIMENT',
    }
  })
})
