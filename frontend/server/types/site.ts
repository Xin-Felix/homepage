export interface Profile {
  name: string
  siteTitle: string
  description: string
  keywords: string
  greeting: string
  intro: string
  tags: string[]
  aboutParagraphs: string[]
  footerText: string
  messageEnabled: boolean
}

export interface Experience {
  id: number
  period: string
  role: string
  org: string
  description: string
}

export interface ProjectSummary {
  id: number
  slug: string
  name: string
  link: string
  description: string
  meta: string[]
  detailPublished: boolean
}

export interface ContactLink {
  id: number
  label: string
  text: string
  href: string
  external: boolean
}

export interface PublicHome {
  profile: Profile
  experiences: Experience[]
  projects: ProjectSummary[]
  contacts: ContactLink[]
  views: number
}

export interface ProjectDetail {
  id: number
  slug: string
  name: string
  description: string
  role: string
  period: string
  link: string
  meta: string[]
  contentMarkdown: string
}

export interface NoteSummary {
  id: number
  slug: string
  title: string
  summary: string
  tags: string[]
  readCount: number
  publishedAt: string
}

export interface NoteDetail extends NoteSummary {
  contentMarkdown: string
  updatedAt: string
}

export interface AiProjectSummary {
  id: number
  slug: string
  title: string
  summary: string
  status: string
  models: string
  stack: string[]
}

export interface AiProjectDetail extends AiProjectSummary {
  demoUrl: string | null
  repoUrl: string | null
  contentMarkdown: string
}

export interface SeoData {
  title: string
  description: string
  type: string
  canonical: string
  image: string
  publishedTime?: string
  modifiedTime?: string
  jsonLd: string
}
