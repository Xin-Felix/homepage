import { setResponseHeader } from 'h3'

import type { AiProjectSummary, NoteSummary, PublicHome } from '#server/types/site'
import { backendJson } from '#server/utils/backend'
import { sitemapEntry } from '#server/utils/seo'

export default defineEventHandler(async (event) => {
  const [home, notes, aiProjects] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<NoteSummary[]>(event, '/api/public/notes'),
    backendJson<AiProjectSummary[]>(event, '/api/public/ai-projects'),
  ])
  const entries = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/notes', changefreq: 'weekly', priority: '0.8' },
    ...home.projects
      .filter(project => project.detailPublished && project.slug)
      .map(project => ({ path: `/projects/${project.slug}`, changefreq: 'monthly', priority: '0.8' })),
    ...notes.map(note => ({
      path: `/notes/${note.slug}`,
      lastmod: note.publishedAt,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    ...(aiProjects.length
      ? [{ path: '/ai', changefreq: 'weekly', priority: '0.7' }]
      : []),
    ...aiProjects.map(project => ({
      path: `/ai/${project.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry => sitemapEntry(event, entry)).join('\n')}\n</urlset>`

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=1800')
  return xml
})
