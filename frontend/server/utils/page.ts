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
import { localizedPath, serverMessages } from '#server/utils/i18n'
import { renderMarkdown } from '#server/utils/markdown'
import { claimRequestEffect, getSiteLang } from '#server/utils/request-context'
import { absoluteUrl, buildSeo, isValidSlug } from '#server/utils/seo'

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
  const lang = getSiteLang(event)
  const t = serverMessages(lang)
  const [home, aiProjects] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<AiProjectSummary[]>(event, '/api/public/ai-projects'),
  ])
  const site = { ...home, aiProjects }
  const views = await recordPageVisit(event, localizedPath('/', lang), home.views)
  const seo = buildSeo(event, {
    title: home.profile.siteTitle,
    description: home.profile.description,
    path: localizedPath('/', lang),
    imagePath: '/og/home.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: home.profile.name,
      url: absoluteUrl(event, localizedPath('/', lang)),
      jobTitle: t.jobTitle,
      sameAs: home.contacts.map(item => item.href).filter(href => href?.startsWith('http')),
      knowsAbout: home.profile.tags,
    },
  })
  return { site, p: home.profile, views, year: new Date().getFullYear(), seo }
}

export async function loadProjectPage(event: H3Event, rawSlug: string | undefined) {
  const slug = requireSlug(rawSlug)
  const lang = getSiteLang(event)
  return remapNotFound((async () => {
    const [home, project] = await Promise.all([
      backendJson<PublicHome>(event, '/api/public/home'),
      backendJson<ProjectDetail>(event, `/api/public/projects/${encodeURIComponent(slug)}`),
    ])
    const views = await recordPageVisit(event, localizedPath(`/projects/${slug}`, lang), home.views)
    const seo = buildSeo(event, {
      title: `${project.name} · ${home.profile.name}`,
      description: project.description,
      path: localizedPath(`/projects/${project.slug}`, lang),
      imagePath: `/og/project/${project.slug}.png`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.name,
        description: project.description,
        url: absoluteUrl(event, localizedPath(`/projects/${project.slug}`, lang)),
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
  const lang = getSiteLang(event)
  const t = serverMessages(lang)
  const [home, notes] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<NoteSummary[]>(event, '/api/public/notes'),
  ])
  const views = await recordPageVisit(event, localizedPath('/notes', lang), home.views)
  const seo = buildSeo(event, {
    title: `${t.notesTitle} · ${home.profile.name}`,
    description: t.notesDescription,
    path: localizedPath('/notes', lang),
    imagePath: '/og/notes.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t.notesTitle,
      description: t.notesDescription,
      url: absoluteUrl(event, localizedPath('/notes', lang)),
      author: { '@type': 'Person', name: home.profile.name },
    },
  })
  return { p: home.profile, notes, views, year: new Date().getFullYear(), seo }
}

export async function loadNotePage(event: H3Event, rawSlug: string | undefined) {
  const slug = requireSlug(rawSlug)
  const lang = getSiteLang(event)
  return remapNotFound((async () => {
    // 文章阅读数也是副作用：HEAD=false；同一 SSR 上下文内的重复取数使用 count=false。
    const countRead = claimRequestEffect(event, `note-read:${slug}`)
    const [home, note] = await Promise.all([
      backendJson<PublicHome>(event, '/api/public/home'),
      backendJson<NoteDetail>(event, `/api/public/notes/${encodeURIComponent(slug)}?count=${countRead}`),
    ])
    const views = await recordPageVisit(event, localizedPath(`/notes/${slug}`, lang), home.views)
    const seo = buildSeo(event, {
      title: `${note.title} · ${home.profile.name}`,
      description: note.summary,
      path: localizedPath(`/notes/${note.slug}`, lang),
      imagePath: `/og/note/${note.slug}.png`,
      type: 'article',
      publishedTime: note.publishedAt,
      modifiedTime: note.updatedAt,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: note.title,
        description: note.summary,
        url: absoluteUrl(event, localizedPath(`/notes/${note.slug}`, lang)),
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
  const lang = getSiteLang(event)
  const t = serverMessages(lang)
  const [home, projects] = await Promise.all([
    backendJson<PublicHome>(event, '/api/public/home'),
    backendJson<AiProjectSummary[]>(event, '/api/public/ai-projects'),
  ])
  if (!projects.length) throw notFound('AI Lab 暂未开放。')

  const views = await recordPageVisit(event, localizedPath('/ai', lang), home.views)
  const seo = buildSeo(event, {
    title: `${t.aiTitle} · ${home.profile.name}`,
    description: t.aiDescription,
    path: localizedPath('/ai', lang),
    imagePath: '/og/ai.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t.aiTitle,
      description: t.aiDescription,
      url: absoluteUrl(event, localizedPath('/ai', lang)),
    },
  })
  return { p: home.profile, projects, views, year: new Date().getFullYear(), seo }
}

export async function loadAiDetailPage(event: H3Event, rawSlug: string | undefined) {
  const slug = requireSlug(rawSlug)
  const lang = getSiteLang(event)
  const t = serverMessages(lang)
  return remapNotFound((async () => {
    const [home, project] = await Promise.all([
      backendJson<PublicHome>(event, '/api/public/home'),
      backendJson<AiProjectDetail>(event, `/api/public/ai-projects/${encodeURIComponent(slug)}`),
    ])
    const views = await recordPageVisit(event, localizedPath(`/ai/${slug}`, lang), home.views)
    const seo = buildSeo(event, {
      title: `${project.title} · ${t.aiTitle} · ${home.profile.name}`,
      description: project.summary,
      path: localizedPath(`/ai/${project.slug}`, lang),
      imagePath: `/og/ai/${project.slug}.png`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.summary,
        url: absoluteUrl(event, localizedPath(`/ai/${project.slug}`, lang)),
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
