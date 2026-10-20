import { initializeRequestContext } from '#server/utils/request-context'

/**
 * 在 Nuxt 页面发起内部 $fetch 前解析根请求信息；页面 composable 会将这些已校验值
 * 显式传给无 socket peer 的 Nitro 子请求，确保统计仍使用真实客户端上下文。
 */
export default defineEventHandler((event) => {
  initializeRequestContext(event)
})
