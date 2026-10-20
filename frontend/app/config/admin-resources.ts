import type {
  AdminFieldDefinition,
  AdminFormState,
  AdminNavItem,
  AdminResourceConfig,
  AdminResourceItem,
  AdminResourceKey,
} from '~/types/admin'

/** 后台导航继续使用 hash，兼容旧书签和浏览器前进/后退。 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { id: 'dashboard', label: '概览' },
  { id: 'visits', label: '访问日志' },
  { id: 'profile', label: '基本信息' },
  { id: 'experiences', label: '工作经历' },
  { id: 'projects', label: '开源与项目' },
  { id: 'notes', label: '技术笔记' },
  { id: 'ai-projects', label: 'AI Lab' },
  { id: 'contacts', label: '联系方式' },
  { id: 'messages', label: '留言' },
  { id: 'security', label: '安全设置' },
]

export const PROFILE_FIELDS: readonly AdminFieldDefinition[] = [
  { key: 'name', label: '名字', required: true, max: 30 },
  { key: 'siteTitle', label: '网页标题', required: true, max: 60, hint: '浏览器标签页和搜索结果里显示的标题' },
  { key: 'greeting', label: '问候语', max: 30, placeholder: '你好，我是' },
  { key: 'intro', label: '一句话介绍', type: 'textarea', rows: 2, required: true, max: 300, hint: '显示在名字下方' },
  { key: 'tags', label: '技能标签', type: 'list', placeholder: 'Java, Spring Boot, MySQL', hint: '用逗号分隔' },
  { key: 'about', label: '关于我', type: 'textarea', rows: 6, max: 2000, hint: '每行一段' },
  { key: 'description', label: 'SEO 描述', type: 'textarea', rows: 2, max: 300, hint: '搜索引擎结果里的摘要' },
  { key: 'keywords', label: 'SEO 关键词', max: 200, placeholder: '用逗号分隔' },
  { key: 'footerText', label: '页脚文字', max: 100, hint: '会显示为「© 年份 + 这里的文字」' },
  { key: 'messageEnabled', label: '在主页开放留言', type: 'checkbox' },
]

const visibleField: AdminFieldDefinition = {
  key: 'visible',
  label: '在主页显示',
  type: 'checkbox',
  default: true,
}

function text(item: AdminResourceItem, key: string): string {
  const value = item[key]
  return value == null ? '' : String(value)
}

function count(item: AdminResourceItem, key: string): number {
  const value = item[key]
  return typeof value === 'number' ? value : 0
}

export const ADMIN_RESOURCES: Record<AdminResourceKey, AdminResourceConfig> = {
  experiences: {
    key: 'experiences',
    title: '工作经历',
    description: '按列表顺序显示在主页时间线上',
    noun: '经历',
    path: '/api/admin/experiences',
    sortable: true,
    markdown: false,
    fields: [
      { key: 'period', label: '时间', required: true, max: 50, placeholder: '2022.07 — 至今' },
      { key: 'role', label: '职位 / 角色', required: true, max: 50, placeholder: 'Java 后端工程师' },
      { key: 'org', label: '公司 / 组织', max: 50, hint: '可留空' },
      { key: 'description', label: '描述', type: 'textarea', max: 1000 },
      visibleField,
    ],
    summary: item => ({
      title: text(item, 'org') ? `${text(item, 'role')} · ${text(item, 'org')}` : text(item, 'role'),
      sub: text(item, 'period'),
    }),
  },
  projects: {
    key: 'projects',
    title: '开源与项目',
    description: '首页卡片与 Markdown 案例详情',
    noun: '项目',
    path: '/api/admin/projects',
    sortable: true,
    markdown: true,
    fields: [
      { key: 'name', label: '项目名称', required: true, max: 50 },
      { key: 'slug', label: '详情路径', max: 80, placeholder: 'product-migration', hint: '仅小写字母、数字和连字符；发布详情时必填' },
      { key: 'link', label: '外部链接', type: 'url', max: 300, placeholder: 'https://github.com/…', hint: '可留空' },
      { key: 'description', label: '卡片摘要', type: 'textarea', rows: 3, max: 1000 },
      { key: 'role', label: '我的角色', max: 100, placeholder: '技术负责人' },
      { key: 'period', label: '项目时间', max: 50, placeholder: '2025.05 — 2025.08' },
      { key: 'meta', label: '卡片标签', type: 'list', placeholder: 'Java, 灰度迁移, 15,000+ 商品', hint: '用逗号分隔，显示在卡片和详情页' },
      { key: 'contentMarkdown', label: '案例详情（Markdown）', type: 'textarea', rows: 16, max: 50000, hint: '支持标题、列表、引用、代码块、表格和链接' },
      { key: 'detailPublished', label: '发布案例详情', type: 'checkbox' },
      visibleField,
    ],
    summary: item => ({
      title: text(item, 'name'),
      sub: text(item, 'slug') ? `/projects/${text(item, 'slug')}` : (text(item, 'link') || '仅首页卡片'),
    }),
  },
  notes: {
    key: 'notes',
    title: '技术笔记',
    description: 'Markdown 技术文章，草稿不会出现在公开页面',
    noun: '笔记',
    path: '/api/admin/notes',
    sortable: false,
    markdown: true,
    fields: [
      { key: 'title', label: '标题', required: true, max: 120 },
      { key: 'slug', label: '文章路径', required: true, max: 100, placeholder: 'system-migration-double-write' },
      { key: 'summary', label: '摘要', type: 'textarea', rows: 3, required: true, max: 500 },
      { key: 'tags', label: '标签', type: 'list', placeholder: '系统迁移, 双写, 灰度' },
      { key: 'contentMarkdown', label: '正文（Markdown）', type: 'textarea', rows: 18, required: true, max: 100000 },
      { key: 'published', label: '公开发布', type: 'checkbox' },
    ],
    summary: item => ({
      title: text(item, 'title'),
      sub: `${item.published ? '已发布' : '草稿'} · /notes/${text(item, 'slug')} · 阅读 ${count(item, 'readCount')}`,
    }),
  },
  'ai-projects': {
    key: 'ai-projects',
    title: 'AI Lab',
    description: '没有公开项目时，前台入口和区块会自动隐藏',
    noun: 'AI 项目',
    path: '/api/admin/ai-projects',
    sortable: true,
    markdown: true,
    fields: [
      { key: 'title', label: '项目名称', required: true, max: 100 },
      { key: 'slug', label: '详情路径', max: 100, placeholder: 'my-ai-agent' },
      { key: 'summary', label: '一句话介绍', type: 'textarea', rows: 3, required: true, max: 500 },
      {
        key: 'status', label: '项目状态', type: 'select', default: 'IDEA', options: [
          { value: 'IDEA', label: '构思中' },
          { value: 'BUILDING', label: '开发中' },
          { value: 'LIVE', label: '已上线' },
          { value: 'ARCHIVED', label: '已归档' },
        ],
      },
      { key: 'models', label: '模型 / 服务', max: 100, placeholder: 'Claude / GPT / 本地模型' },
      { key: 'stack', label: '技术栈', type: 'list', placeholder: 'RAG, Agent, MCP, Spring AI' },
      { key: 'demoUrl', label: '在线体验', type: 'url', max: 300, placeholder: 'https://…' },
      { key: 'repoUrl', label: '代码仓库', type: 'url', max: 300, placeholder: 'https://github.com/…' },
      { key: 'contentMarkdown', label: '项目详情（Markdown）', type: 'textarea', rows: 18, max: 100000 },
      { key: 'visible', label: '公开发布', type: 'checkbox', default: false },
    ],
    summary: item => ({
      title: text(item, 'title'),
      sub: `${text(item, 'status')} · ${item.visible ? `/ai/${text(item, 'slug')}` : '未公开'}`,
    }),
  },
  contacts: {
    key: 'contacts',
    title: '联系方式',
    description: '主页「联系我」里的条目',
    noun: '联系方式',
    path: '/api/admin/contacts',
    sortable: true,
    markdown: false,
    fields: [
      { key: 'label', label: '名称', required: true, max: 20, placeholder: 'GitHub / Email / 微信' },
      { key: 'text', label: '显示文字', required: true, max: 100 },
      { key: 'href', label: '链接', max: 300, placeholder: 'https://…  或  mailto:…', hint: '留空则只显示文字（比如微信号）' },
      visibleField,
    ],
    summary: item => ({
      title: `${text(item, 'label')}：${text(item, 'text')}`,
      sub: text(item, 'href') || '无链接，仅显示文字',
    }),
  },
}

/** 把 API 实体转成适合输入框编辑的值；数组暂存为逗号分隔文本。 */
export function createAdminForm(
  fields: readonly AdminFieldDefinition[],
  values: Record<string, unknown> = {},
): AdminFormState {
  return Object.fromEntries(fields.map((field) => {
    const raw = values[field.key]
    if (field.type === 'checkbox') {
      return [field.key, raw == null ? Boolean(field.default) : Boolean(raw)]
    }
    if (field.type === 'list') {
      return [field.key, Array.isArray(raw) ? raw.join(', ') : '']
    }
    const fallback = field.default ?? field.options?.[0]?.value ?? ''
    return [field.key, raw == null ? String(fallback) : String(raw)]
  }))
}

/** 提交前统一 trim，并将中英文逗号分隔字段恢复为数组。 */
export function serializeAdminForm(
  fields: readonly AdminFieldDefinition[],
  values: AdminFormState,
): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => {
    const value = values[field.key]
    if (field.type === 'checkbox') return [field.key, Boolean(value)]
    const textValue = String(value ?? '').trim()
    if (field.type === 'list') {
      return [field.key, textValue.split(/[,，]/).map(item => item.trim()).filter(Boolean)]
    }
    return [field.key, textValue]
  }))
}

/** 后端字段路径可能是 tags[0] 或对象路径，这里归并到顶层输入项。 */
export function normalizeAdminFieldErrors(
  fieldErrors?: Record<string, string>,
): Record<string, string> {
  if (!fieldErrors) return {}
  const normalized: Record<string, string> = {}
  for (const [path, message] of Object.entries(fieldErrors)) {
    const key = path.split(/[.\[]/, 1)[0]
    if (key && !normalized[key]) normalized[key] = message
  }
  return normalized
}
