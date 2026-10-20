/**
 * 公开页面 BFF 的稳定数据类型。
 * nullable 字段与后端公开 DTO 保持一致，页面组件不得依赖 admin 模型。
 */
export interface PublicProfile {
  name: string
  siteTitle: string
  description: string | null
  keywords: string | null
  greeting: string | null
  intro: string
  tags: string[]
  aboutParagraphs: string[]
  footerText: string | null
  messageEnabled: boolean
}

export interface PublicExperience {
  id: number
  period: string
  role: string
  org: string | null
  description: string | null
}

export interface PublicProjectSummary {
  id: number
  slug: string | null
  name: string
  link: string | null
  description: string | null
  meta: string[]
  detailPublished: boolean
}

export interface PublicContact {
  id: number
  label: string
  text: string
  href: string | null
  external: boolean
}

export interface PublicAiProjectSummary {
  id: number
  slug: string
  title: string
  summary: string
  status: string
  models: string | null
  stack: string[]
}

export interface PublicSite {
  profile: PublicProfile
  experiences: PublicExperience[]
  projects: PublicProjectSummary[]
  contacts: PublicContact[]
  aiProjects: PublicAiProjectSummary[]
}

export interface PublicProjectDetail {
  id: number
  slug: string
  name: string
  description: string | null
  role: string | null
  period: string | null
  link: string | null
  meta: string[]
}

export interface PublicNoteSummary {
  id: number
  slug: string
  title: string
  summary: string
  tags: string[]
  readCount: number
  publishedAt: string | null
}

export interface PublicNoteDetail extends PublicNoteSummary {
  updatedAt: string | null
}

export interface PublicAiProjectDetail extends PublicAiProjectSummary {
  demoUrl: string | null
  repoUrl: string | null
}

/** BFF 可选返回预构建 SEO；页面仍提供完整的 SSR 回退值。 */
export interface PublicSeoPayload {
  title?: string
  description?: string
  type?: 'website' | 'article'
  canonical?: string
  image?: string
  publishedTime?: string | null
  modifiedTime?: string | null
  jsonLd?: Record<string, unknown> | string | null
}

export interface PublicHomePageData {
  site: PublicSite
  views: number
  seo?: PublicSeoPayload
}

export interface PublicProjectPageData {
  p: PublicProfile
  project: PublicProjectDetail
  contentHtml: string
  views: number
  seo?: PublicSeoPayload
}

export interface PublicNotesPageData {
  p: PublicProfile
  notes: PublicNoteSummary[]
  views: number
  seo?: PublicSeoPayload
}

export interface PublicNotePageData {
  p: PublicProfile
  note: PublicNoteDetail
  contentHtml: string
  views: number
  seo?: PublicSeoPayload
}

export interface PublicAiPageData {
  p: PublicProfile
  projects: PublicAiProjectSummary[]
  views: number
  seo?: PublicSeoPayload
}

export interface PublicAiDetailPageData {
  p: PublicProfile
  project: PublicAiProjectDetail
  contentHtml: string
  views: number
  seo?: PublicSeoPayload
}
