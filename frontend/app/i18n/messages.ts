/**
 * 界面固定文案字典（中/英）。
 * 业务内容（项目、经历、简介、AI 案例）来自后端按语言返回，不在此处维护；
 * 这里只放导航、按钮、区块标题等界面文案。
 */

export type Locale = 'zh' | 'en'

export interface Messages {
  nav: {
    experience: string
    projects: string
    about: string
    notes: string
    aiLab: string
    contact: string
  }
  header: {
    role: string
    statusOpen: string
    primaryNav: string
    backToTop: string
    openMenu: string
    closeMenu: string
    switchToEn: string
    switchToZh: string
    langLabel: string
  }
  hero: {
    projectsCount: (n: number) => string
    viewsCount: (n: number) => string
    contact: string
    viewProjects: string
  }
  sections: {
    experienceTitle: string
    experienceKicker: string
    projectsTitle: string
    projectsKicker: string
    aboutTitle: string
    aboutKicker: string
    aiTitle: string
    aiKicker: string
    contactTitle: string
    contactKicker: string
  }
  project: {
    caseKicker: string
    myRole: string
    period: string
    techTags: string
    viewCode: string
    backToProjects: string
    backToAllProjects: string
    uniqueVisits: (n: number) => string
    caseStudy: string
  }
  notes: {
    title: string
    description: string
    backHome: string
    readCount: (n: number) => string
    empty: string
  }
  ai: {
    title: string
    description: string
    heroLead: string
    heroEmphasis: string
    heroDesc: string
    listLabel: string
    backHome: string
    backHomeUp: string
    subtitle: string
  }
  footer: {
    secondary: string
    backHome: string
  }
  contactDialog: {
    title: string
    name: string
    email: string
    message: string
    send: string
    sending: string
    cancel: string
    success: string
    error: string
  }
  errors: {
    notFound: string
    projectNotFound: string
    noteNotFound: string
    aiNotFound: string
    aiEmpty: string
    rateLimited: string
    unavailable: string
  }
  common: {
    jobTitle: string
    notesCollection: string
    aiDescription: string
    rssTitle: string
  }
}

const zh: Messages = {
  nav: {
    experience: '经历',
    projects: '项目',
    about: '关于',
    notes: '笔记',
    aiLab: 'AI Lab',
    contact: '联系',
  },
  header: {
    role: 'BACKEND ENGINEER',
    statusOpen: '开放合适机会',
    primaryNav: '主导航',
    backToTop: '回到页面顶部',
    openMenu: '打开导航菜单',
    closeMenu: '关闭导航菜单',
    switchToEn: 'EN',
    switchToZh: 'CN',
    langLabel: '切换语言',
  },
  hero: {
    projectsCount: n => `${n} 个项目案例`,
    viewsCount: n => `${n} 次独立访问`,
    contact: '联系我',
    viewProjects: '查看项目',
  },
  sections: {
    experienceTitle: '经历',
    experienceKicker: 'EXPERIENCE',
    projectsTitle: '项目',
    projectsKicker: 'PROJECTS',
    aboutTitle: '关于我',
    aboutKicker: 'ABOUT',
    aiTitle: 'AI Lab',
    aiKicker: 'AI LAB',
    contactTitle: '联系',
    contactKicker: 'CONTACT',
  },
  project: {
    caseKicker: 'PROJECT CASE',
    myRole: '我的角色',
    period: '项目时间',
    techTags: '技术标签',
    viewCode: '查看代码 / 项目 ↗',
    backToProjects: '← 返回项目',
    backToAllProjects: '← 返回全部项目',
    uniqueVisits: n => `${n} 次独立访问`,
    caseStudy: 'PROJECT CASE STUDY',
  },
  notes: {
    title: '技术笔记',
    description: '记录工程实践、系统设计与踩坑复盘的技术笔记。',
    backHome: '← 回到主页',
    readCount: n => `${n} 次阅读`,
    empty: '暂时还没有公开的笔记。',
  },
  ai: {
    title: 'AI Lab',
    description: 'AI、Agent、RAG、MCP 与模型工程实验项目。',
    heroLead: '从实验出发，',
    heroEmphasis: '把模型接进真实工程。',
    heroDesc: '记录 AI 应用、Agent、RAG、MCP 和评测实践。',
    listLabel: 'AI Lab 项目列表',
    backHome: '← 回到主页',
    backHomeUp: 'BACK HOME ↑',
    subtitle: 'AI LAB',
  },
  footer: {
    secondary: 'DESIGNED TO LAST · BUILT WITH JAVA',
    backHome: 'BACK HOME ↑',
  },
  contactDialog: {
    title: '给我留言',
    name: '称呼',
    email: '邮箱',
    message: '留言内容',
    send: '发送',
    sending: '发送中…',
    cancel: '取消',
    success: '留言已发送，感谢！',
    error: '发送失败，请稍后再试。',
  },
  errors: {
    notFound: '你要找的页面不存在。',
    projectNotFound: '这个项目案例不存在或尚未发布。',
    noteNotFound: '这篇技术笔记不存在或尚未发布。',
    aiNotFound: '这个 AI 项目不存在或尚未发布。',
    aiEmpty: 'AI Lab 暂未开放。',
    rateLimited: '请求过于频繁，请稍后再试。',
    unavailable: '服务暂时不可用，请稍后再试。',
  },
  common: {
    jobTitle: 'Java 后端工程师',
    notesCollection: '技术笔记',
    aiDescription: 'AI、Agent、RAG、MCP 与模型工程实验项目。',
    rssTitle: '黄鑫的技术笔记',
  },
}

const en: Messages = {
  nav: {
    experience: 'Experience',
    projects: 'Projects',
    about: 'About',
    notes: 'Notes',
    aiLab: 'AI Lab',
    contact: 'Contact',
  },
  header: {
    role: 'BACKEND ENGINEER',
    statusOpen: 'Open to opportunities',
    primaryNav: 'Primary navigation',
    backToTop: 'Back to top',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    switchToEn: 'EN',
    switchToZh: 'CN',
    langLabel: 'Switch language',
  },
  hero: {
    projectsCount: n => `${n} project${n === 1 ? '' : 's'}`,
    viewsCount: n => `${n} unique visit${n === 1 ? '' : 's'}`,
    contact: 'Contact me',
    viewProjects: 'View projects',
  },
  sections: {
    experienceTitle: 'Experience',
    experienceKicker: 'EXPERIENCE',
    projectsTitle: 'Projects',
    projectsKicker: 'PROJECTS',
    aboutTitle: 'About',
    aboutKicker: 'ABOUT',
    aiTitle: 'AI Lab',
    aiKicker: 'AI LAB',
    contactTitle: 'Contact',
    contactKicker: 'CONTACT',
  },
  project: {
    caseKicker: 'PROJECT CASE',
    myRole: 'My Role',
    period: 'Timeline',
    techTags: 'Tech',
    viewCode: 'View code / project ↗',
    backToProjects: '← Back to projects',
    backToAllProjects: '← Back to all projects',
    uniqueVisits: n => `${n} unique visit${n === 1 ? '' : 's'}`,
    caseStudy: 'PROJECT CASE STUDY',
  },
  notes: {
    title: 'Notes',
    description: 'Engineering notes on practice, system design and lessons learned.',
    backHome: '← Back home',
    readCount: n => `${n} read${n === 1 ? '' : 's'}`,
    empty: 'No published notes yet.',
  },
  ai: {
    title: 'AI Lab',
    description: 'Experiments in AI, agents, RAG, MCP and model engineering.',
    heroLead: 'Starting from experiments,',
    heroEmphasis: 'wiring models into real engineering.',
    heroDesc: 'Notes on AI applications, agents, RAG, MCP and evaluation practice.',
    listLabel: 'AI Lab project list',
    backHome: '← Back home',
    backHomeUp: 'BACK HOME ↑',
    subtitle: 'AI LAB',
  },
  footer: {
    secondary: 'DESIGNED TO LAST · BUILT WITH JAVA',
    backHome: 'BACK HOME ↑',
  },
  contactDialog: {
    title: 'Leave a message',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    sending: 'Sending…',
    cancel: 'Cancel',
    success: 'Message sent, thank you!',
    error: 'Failed to send, please try again later.',
  },
  errors: {
    notFound: 'The page you are looking for does not exist.',
    projectNotFound: 'This project case does not exist or is not published yet.',
    noteNotFound: 'This note does not exist or is not published yet.',
    aiNotFound: 'This AI project does not exist or is not published yet.',
    aiEmpty: 'AI Lab is not open yet.',
    rateLimited: 'Too many requests, please try again later.',
    unavailable: 'The service is temporarily unavailable, please try again later.',
  },
  common: {
    jobTitle: 'Java Backend Engineer',
    notesCollection: 'Notes',
    aiDescription: 'Experiments in AI, agents, RAG, MCP and model engineering.',
    rssTitle: 'Huang Xin · Engineering Notes',
  },
}

export const MESSAGES: Record<Locale, Messages> = { zh, en }

export const DEFAULT_LOCALE: Locale = 'zh'
export const LOCALES: Locale[] = ['zh', 'en']
export const EN_PREFIX = '/en'
