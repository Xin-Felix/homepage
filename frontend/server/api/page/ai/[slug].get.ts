import { getRouterParam, setResponseHeader } from 'h3'

import { loadAiDetailPage } from '#server/utils/page'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const page = await loadAiDetailPage(event, getRouterParam(event, 'slug'))
  const { contentMarkdown: _contentMarkdown, ...project } = page.project
  return { ...page, project }
})
