import { getRequestURL, sendRedirect, setResponseHeader } from 'h3'

/** 管理后台禁止缓存与搜索引擎收录，并将无尾斜杠入口统一到 Nuxt 页面。 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (path !== '/admin' && !path.startsWith('/admin/')) return

  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')

  if (path === '/admin') {
    return sendRedirect(event, '/admin/', 302)
  }
})
