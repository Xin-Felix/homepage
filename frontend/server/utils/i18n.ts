/**
 * 服务端（BFF / SEO / sitemap）使用的界面文案。
 * 只包含服务端生成 SEO、描述、JSON-LD 需要的少量固定文案；
 * 页面内的大量界面文案在 app 侧 ~/i18n/messages.ts 维护。
 */

export type ServerLocale = 'zh' | 'en'

export const EN_PREFIX = '/en'

interface ServerMessages {
  notesDescription: string
  aiDescription: string
  jobTitle: string
  notesTitle: string
  aiTitle: string
  rssTitle: string
}

const MESSAGES: Record<ServerLocale, ServerMessages> = {
  zh: {
    notesDescription: '关于后端工程、系统迁移、实时风控与稳定性治理的技术笔记。',
    aiDescription: 'AI、Agent、RAG、MCP 与模型工程实验项目。',
    jobTitle: 'Java 后端工程师',
    notesTitle: '技术笔记',
    aiTitle: 'AI Lab',
    rssTitle: '黄鑫的技术笔记',
  },
  en: {
    notesDescription: 'Engineering notes on backend systems, migration, real-time risk control and reliability.',
    aiDescription: 'Experiments in AI, agents, RAG, MCP and model engineering.',
    jobTitle: 'Java Backend Engineer',
    notesTitle: 'Notes',
    aiTitle: 'AI Lab',
    rssTitle: 'Huang Xin · Engineering Notes',
  },
}

export function serverMessages(lang: ServerLocale): ServerMessages {
  return MESSAGES[lang]
}

/** 给逻辑路径加上语言前缀（英文站加 /en）。 */
export function localizedPath(path: string, lang: ServerLocale): string {
  if (lang !== 'en') return path
  return path === '/' ? EN_PREFIX : `${EN_PREFIX}${path}`
}

export function ogLocale(lang: ServerLocale): string {
  return lang === 'en' ? 'en_US' : 'zh_CN'
}
