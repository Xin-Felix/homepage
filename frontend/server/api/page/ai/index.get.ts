import { setResponseHeader } from 'h3'

import { loadAiPage } from '#server/utils/page'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return loadAiPage(event)
})
