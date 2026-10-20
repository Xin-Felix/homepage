import { getRouterParam, setResponseHeader } from 'h3'

import { loadNotePage } from '#server/utils/page'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const page = await loadNotePage(event, getRouterParam(event, 'slug'))
  const { contentMarkdown: _contentMarkdown, ...note } = page.note
  return { ...page, note }
})
