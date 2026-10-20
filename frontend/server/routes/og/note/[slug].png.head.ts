import { sendOgImage } from '#server/utils/og'

/** 动态扩展名路由需显式声明 HEAD；sendOgImage 会在读取后端前结束响应。 */
export default defineEventHandler(event => sendOgImage(
  event,
  'note:head',
  () => ({ title: '', description: '' }),
))
