import { proxyToBackend } from '#server/utils/backend'

/** 未被本地 BFF 命中的 `/api/**` 全部透明转发给 Spring。 */
export default defineEventHandler(event => proxyToBackend(event))
