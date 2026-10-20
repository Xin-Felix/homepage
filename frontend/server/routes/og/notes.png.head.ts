import { sendOgImage } from '#server/utils/og'

/** Nitro 不会自动让 `.get.ts` 响应 HEAD，显式保留无渲染的快速响应。 */
export default defineEventHandler(event => sendOgImage(
  event,
  'notes:head',
  () => ({ title: '', description: '' }),
))
