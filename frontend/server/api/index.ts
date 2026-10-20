import { proxyToBackend } from '#server/utils/backend'

/** catch-all 不一定匹配空片段，单独保留 `/api` 本身的透明代理。 */
export default defineEventHandler(event => proxyToBackend(event))
