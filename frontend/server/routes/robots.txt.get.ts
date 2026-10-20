import { setResponseHeader } from 'h3'

import { absoluteUrl } from '#server/utils/seo'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${absoluteUrl(event, '/sitemap.xml')}\n`
})
