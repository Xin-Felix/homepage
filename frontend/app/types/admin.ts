/**
 * 管理后台共享类型。
 * 时间字段保持后端 ISO 字符串，不转换为 Date，避免浏览器时区改变原有展示语义。
 */

export type AdminHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type AdminAnalyticsDays = 7 | 30 | 90
export type AdminAuthPhase = 'checking' | 'anonymous' | 'authenticated'
export type AdminToastType = 'success' | 'error'

export type AdminTab =
  | 'dashboard'
  | 'visits'
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'notes'
  | 'ai-projects'
  | 'contacts'
  | 'messages'
  | 'security'

export type AdminResourceKey = 'experiences' | 'projects' | 'notes' | 'ai-projects' | 'contacts'

export interface ApiEnvelope<T> {
  status: 'success' | 'error' | string
  data?: T
  reason?: string
  invalidFields?: Record<string, string>
}

export interface AdminLoginRequest {
  username: string
  password: string
  totpCode: string
}

export interface AdminLoginResponse {
  token: string
  expiresAt: string
}

export interface AdminDashboardSummary {
  views: number
  messages: number
  unreadMessages: number
  experiences: number
  projects: number
  notes: number
  aiProjects: number
}

export interface AdminDailyPoint {
  date: string
  uniqueVisitors: number
  requests: number
}

export interface AdminHourlyPoint {
  hour: number
  visitors: number
}

export interface AdminRankItem {
  name: string
  value: number
}

export interface AdminAnalytics {
  days: AdminAnalyticsDays
  uniqueVisitors: number
  requests: number
  refreshes: number
  daily: AdminDailyPoint[]
  hourly: AdminHourlyPoint[]
  sources: AdminRankItem[]
  paths: AdminRankItem[]
  browsers: AdminRankItem[]
  devices: AdminRankItem[]
}

export interface AdminProfile {
  id: number
  name: string
  siteTitle: string
  greeting: string | null
  intro: string
  tags: string[]
  about: string | null
  description: string | null
  keywords: string | null
  footerText: string | null
  messageEnabled: boolean
  views: number
  updatedAt: string | null
  [key: string]: unknown
}

export interface AdminEntity {
  id: number
  [key: string]: unknown
}

export interface AdminSortableEntity extends AdminEntity {
  sortOrder: number
  visible: boolean
}

export interface AdminExperience extends AdminSortableEntity {
  period: string
  role: string
  org: string | null
  description: string | null
}

export interface AdminProject extends AdminSortableEntity {
  name: string
  slug: string | null
  link: string | null
  description: string | null
  role: string | null
  period: string | null
  meta: string[]
  contentMarkdown: string | null
  detailPublished: boolean
}

export interface AdminNote extends AdminEntity {
  title: string
  slug: string
  summary: string
  tags: string[]
  contentMarkdown: string
  published: boolean
  readCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type AdminAiProjectStatus = 'IDEA' | 'BUILDING' | 'LIVE' | 'ARCHIVED'

export interface AdminAiProject extends AdminSortableEntity {
  title: string
  slug: string | null
  summary: string
  status: AdminAiProjectStatus
  models: string | null
  stack: string[]
  demoUrl: string | null
  repoUrl: string | null
  contentMarkdown: string | null
}

export interface AdminContact extends AdminSortableEntity {
  label: string
  text: string
  href: string | null
}

export type AdminResourceItem =
  | AdminExperience
  | AdminProject
  | AdminNote
  | AdminAiProject
  | AdminContact

export interface AdminItemSummary {
  title: string
  sub: string
}

export type AdminFieldType = 'text' | 'url' | 'textarea' | 'checkbox' | 'select' | 'list'

export interface AdminFieldOption {
  value: string
  label: string
}

export interface AdminFieldDefinition {
  key: string
  label: string
  type?: AdminFieldType
  required?: boolean
  max?: number
  rows?: number
  placeholder?: string
  hint?: string
  default?: string | boolean
  options?: readonly AdminFieldOption[]
}

export type AdminFormValue = string | boolean
export type AdminFormState = Record<string, AdminFormValue>

export interface AdminResourceConfig {
  key: AdminResourceKey
  title: string
  description: string
  noun: string
  path: string
  sortable: boolean
  markdown: boolean
  fields: readonly AdminFieldDefinition[]
  summary: (item: AdminResourceItem) => AdminItemSummary
}

export interface AdminNavItem {
  id: AdminTab
  label: string
}

export interface AdminPageResult<T> {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface AdminVisit {
  id: number
  /** 完整 IP 仅对后台认证会话返回；旧记录为 null。 */
  ipAddress: string | null
  /** 创建访问记录时写入的离线地区快照；旧记录可能没有。 */
  region: string | null
  /** 历史脱敏记录无法恢复完整 IP。 */
  historicalMasked: boolean
  /** 兼容字段：新记录等于 ipAddress，旧记录为脱敏网段。 */
  source: string
  fingerprint: string
  path: string
  userAgent: string | null
  referer: string | null
  hits: number
  firstVisitedAt: string
  lastVisitedAt: string
}

export interface AdminMessage {
  id: number
  name: string
  contact: string | null
  content: string
  read: boolean
  ipHash: string | null
  createdAt: string
}

export interface AdminTotpStatus {
  enabled: boolean
  setupPending: boolean
}

export interface AdminTotpSetup {
  manualKey: string
  expiresAt: string
  qrDataUrl: string
}

export interface AdminMarkdownPreview {
  html: string
}
