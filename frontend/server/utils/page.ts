import type { H3Event } from 'h3'
import { createError } from 'h3'

import type {
  AiProjectDetail,
  AiProjectSummary,
  NoteDetail,
  NoteSummary,
  ProjectDetail,
  PublicHome,
} from '#server/types/site'
import { backendJson, getErrorStatus } from '#server/utils/backend'
import { renderMarkdown } from '#server/utils/markdown'
import { claimRequestEffect } from '#server/utils/request-context'
import { absoluteUrl, buildSeo, isValidSlug } from '#server/utils/seo'

const NOTES_DESCRIPTION = '关于后端工程、系统迁移、实时风控与稳定性治理的技术笔记。'
const AI_DESCRIPTION = 'AI、Agent、RAG、MCP 与模型工程实验项目。'

function notFound(reason: string) {
  return createError({ statusCode: 404, message: reason, data: { status: 'error', reason } })
}

function requireSlug(slug: string | undefined): string {
  if (!slug || !isValidSlug(slug)) throw notFound('请求的内容不存在或尚未发布。')
  return slug
}

async function remapNotFound<T>(work: Promise<T>, reason: string): Promise<T> {
  try {
    return await work
  } catch (error) {
    if (getErrorStatus(error) === 404) throw notFound(reason)
    throw error
  }
}

/** 全站访问统计失败不影响页面；同一 SSR 请求上下文只记录一次，HEAD 永不记录。 */
async function recordPageVisit(event: H3Event, path: string, fallbackViews: number): Promise<number> {
  if (!claimRequestEffect(event, `page-visit:${path}`)) return fallbackViews
  try {
    const result = await backendJson<{ views: number }>(event, '/api/public/visits', {
      method: 'POST',
      body: JSON.stringify({ path }),
    })
    return result.views
  } catch (error) {
    console.error('visit tracking failed:', error instanceof Error ? error.message : error)
    return fallbackViews
  }
}

export async function loadHomePage(event: H3Event) {
  const [home, aiProjects] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<AiProjectSummary[]>(event, '/api/public/ai-projects'),
  ])
  const site = { ...home, aiProjects }
  const views = await recordPageVisit(event, '/', home.views)
  const seo = buildSeo(event, {
    title: home.profile.siteTitle,
    description: home.profile.description,
    path: '/',
    imagePath: '/og/home.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: home.profile.name,
      url: absoluteUrl(event, '/'),
      jobTitle: 'Java 后端工程师',
      sameAs: home.contacts.map(item => item.href).filter(href => href?.startsWith('http')),
      knowsAbout: home.profile.tags,
    },
  })
  return { site, p: home.profile, views, year: new Date().getFullYear(), seo }
}

export async function loadProjectPage(event: H3Event, rawSlug: string | undefined) {
  const slug = requireSlug(rawSlug)
  return remapNotFound((async () => {
    const [home, project] = await Promise.all([
      backendJson<PublicHome>(event, '/api/public/home'),
      backendJson<ProjectDetail>(event, `/api/public/projects/${encodeURIComponent(slug)}`),
    ])
    const views = await recordPageVisit(event, `/projects/${slug}`, home.views)
    const seo = buildSeo(event, {
      title: `${project.name} · ${home.profile.name}`,
      description: project.description,
      path: `/projects/${project.slug}`,
      imagePath: `/og/project/${project.slug}.png`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.name,
        description: project.description,
        url: absoluteUrl(event, `/projects/${project.slug}`),
        author: { '@type': 'Person', name: home.profile.name },
        keywords: project.meta.join(', '),
      },
    })
    return {
      p: home.profile,
      project,
      contentHtml: renderMarkdown(project.contentMarkdown),
      views,
      year: new Date().getFullYear(),
      seo,
    }
  })(), '这个项目案例不存在或尚未发布。')
}

export async function loadNotesPage(event: H3Event) {
  const [home, notes] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<NoteSummary[]>(event, '/api/public/notes'),
  ])
  const views = await recordPageVisit(event, '/notes', home.views)
  const seo = buildSeo(event, {
    title: `技术笔记 · ${home.profile.name}`,
    description: NOTES_DESCRIPTION,
    path: '/notes',
    imagePath: '/og/notes.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '技术笔记',
      description: NOTES_DESCRIPTION,
      url: absoluteUrl(event, '/notes'),
      author: { '@type': 'Person', name: home.profile.name },
    },
  })
  return { p: home.profile, notes, views, year: new Date().getFullYear(), seo }
}

export async function loadNotePage(event: H3Event, rawSlug: string | undefined) {
  const slug = requireSlug(rawSlug)
  return remapNotFound((async () => {
    // 文章阅读数也是副作用：HEAD=false；同一 SSR 上下文内的重复取数使用 count=false。
    const countRead = claimRequestEffect(event, `note-read:${slug}`)
    const [home, note] = await Promise.all([
      backendJson<PublicHome>(event, '/api/public/home'),
      backendJson<NoteDetail>(event, `/api/public/notes/${encodeURIComponent(slug)}?count=${countRead}`),
    ])
    const views = await recordPageVisit(event, `/notes/${slug}`, home.views)
    const seo = buildSeo(event, {
      title: `${note.title} · ${home.profile.name}`,
      description: note.summary,
      path: `/notes/${note.slug}`,
      imagePath: `/og/note/${note.slug}.png`,
      type: 'article',
      publishedTime: note.publishedAt,
      modifiedTime: note.updatedAt,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: note.title,
        description: note.summary,
        url: absoluteUrl(event, `/notes/${note.slug}`),
        datePublished: note.publishedAt,
        dateModified: note.updatedAt,
        author: { '@type': 'Person', name: home.profile.name },
        keywords: note.tags.join(', '),
      },
    })
    return {
      p: home.profile,
      note,
      contentHtml: renderMarkdown(note.contentMarkdown),
      views,
      year: new Date().getFullYear(),
      seo,
    }
  })(), '这篇技术笔记不存在或尚未发布。')
}

export async function loadAiPage(event: H3Event) {
  const [home, projects] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<AiProjectSummary[]>(event, '/api/public/ai-projects'),
  ])
  if (!projects.length) throw notFound('AI Lab 暂未开放。')

  const views = await recordPageVisit(event, '/ai', home.views)
  const seo = buildSeo(event, {
    title: `AI Lab · ${home.profile.name}`,
    description: AI_DESCRIPTION,
    path: '/ai',
    imagePath: '/og/ai.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI Lab',
      description: AI_DESCRIPTION,
      url: absoluteUrl(event, '/ai'),
    },
  })
  return { p: home.profile, projects, views, year: new Date().getFullYear(), seo }
}

export async function loadAiDetailPage(event: H3Event, rawSlug: string | undefined) {
  const slug = requireSlug(rawSlug)
  return remapNotFound((async () => {
    const [home, project] = await Promise.all([
      backendJson<PublicHome>(event, '/api/public/home'),
      backendJson<AiProjectDetail>(event, `/api/public/ai-projects/${encodeURIComponent(slug)}`),
    ])
    const views = await recordPageVisit(event, `/ai/${slug}`, home.views)
    const seo = buildSeo(event, {
      title: `${project.title} · AI Lab · ${home.profile.name}`,
      description: project.summary,
      path: `/ai/${project.slug}`,
      imagePath: `/og/ai/${project.slug}.png`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.summary,
        url: absoluteUrl(event, `/ai/${project.slug}`),
        applicationCategory: 'DeveloperApplication',
        author: { '@type': 'Person', name: home.profile.name },
      },
    })
    return {
      p: home.profile,
      project,
      contentHtml: renderMarkdown(project.contentMarkdown),
      views,
      year: new Date().getFullYear(),
      seo,
    }
  })(), '这个 AI 项目不存在或尚未发布。')
}
