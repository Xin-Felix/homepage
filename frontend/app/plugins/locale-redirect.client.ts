import { stripLocalePrefix, withLocalePrefix } from '~/composables/useLocale'

/**
 * 首访语言跳转（仅客户端、仅一次）。
 * - 已带 /en 前缀，或用户已手动选过语言并落在对应站点：不处理；
 * - 读取 localStorage('homepage.lang')；没有则回退浏览器语言；
 * - 偏好英文且当前在中文页时跳到对应 /en 页面。
 *
 * 不在 SSR 做重定向：保证爬虫访问 / 时看到中文默认页，中文 canonical 稳定可收录。
 */
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const router = useRouter()

  const path = route.path
  // admin 不参与双语；已在英文站不处理。
  if (path.startsWith('/admin') || path.startsWith('/en')) return

  let preferred: 'zh' | 'en' | null = null
  try {
    const saved = localStorage.getItem('homepage.lang')
    if (saved === 'zh' || saved === 'en') preferred = saved
  }
  catch {
    preferred = null
  }

  if (!preferred) {
    const nav = (navigator.language || '').toLowerCase()
    // 浏览器主语言为中文时保持中文；其余按英文处理（面向海外访客）。
    preferred = nav.startsWith('zh') ? 'zh' : 'en'
  }

  if (preferred === 'en') {
    const target = withLocalePrefix(stripLocalePrefix(route.fullPath), 'en')
    if (target !== route.fullPath) router.replace(target)
  }
})
