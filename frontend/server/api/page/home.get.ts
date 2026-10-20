import { setResponseHeader } from 'h3'

import { loadHomePage } from '#server/utils/page'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return loadHomePage(event)
})
