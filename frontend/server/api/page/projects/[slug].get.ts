import { getRouterParam, setResponseHeader } from 'h3'

import { loadProjectPage } from '#server/utils/page'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const page = await loadProjectPage(event, getRouterParam(event, 'slug'))
  const { contentMarkdown: _contentMarkdown, ...project } = page.project
  return { ...page, project }
})
