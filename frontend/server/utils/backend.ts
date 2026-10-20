import type { H3Event } from 'h3'
import {
  createError,
  getMethod,
  getRequestHeader,
  getRequestURL,
  sendStream,
  setResponseHeader,
  setResponseStatus,
} from 'h3'

import { buildBackendHeaders } from '#server/utils/request-context'

const MAX_PROXY_BODY = 2 * 1024 * 1024
const MAX_PREVIEW_BODY = 100 * 1024
const PROXY_RESPONSE_HEADERS = ['content-type', 'cache-control', 'retry-after', 'x-robots-tag'] as const

interface BackendOptions {
  method?: string
  body?: string
}

interface BackendEnvelope<T> {
  status?: string
  data?: T
  reason?: string
}

export function getBackendOrigin(event: H3Event): string {
  const config = useRuntimeConfig(event) as { backendOrigin?: string }
  // 兼容现有 Compose 的 BACKEND_ORIGIN，同时支持 Nuxt 标准的 NUXT_BACKEND_ORIGIN。
  const raw = process.env.NUXT_BACKEND_ORIGIN
    || process.env.BACKEND_ORIGIN
    || config.backendOrigin
    || 'http://backend:8080'
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('BACKEND_ORIGIN 必须是有效 URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('BACKEND_ORIGIN 只允许 http/https')
  }
  return parsed.toString().replace(/\/$/, '')
}

function upstreamUrl(event: H3Event, apiPath?: string): string {
  const suffix = apiPath || `${getRequestURL(event).pathname}${getRequestURL(event).search}`
  if (!suffix.startsWith('/')) throw new Error('backend path 必须以 / 开头')
  return `${getBackendOrigin(event)}${suffix}`
}

function publicError(statusCode: number, reason: string) {
  return createError({
    statusCode,
    message: reason,
    data: { status: 'error', reason },
  })
}

export function getErrorStatus(error: unknown, fallback = 500): number {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const status = Number((error as { statusCode?: unknown }).statusCode)
    if (Number.isInteger(status) && status >= 400 && status <= 599) return status
  }
  return fallback
}

export function getErrorReason(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const data = (error as { data?: unknown }).data
    if (data && typeof data === 'object' && 'reason' in data) {
      const reason = (data as { reason?: unknown }).reason
      if (typeof reason === 'string' && reason) return reason
    }
  }
  return fallback
}

/** 调用 Spring JSON API；5xx 统一折算为对外 503，且只返回 success envelope 的 data。 */
export async function backendJson<T>(
  event: H3Event,
  apiPath: string,
  options: BackendOptions = {},
): Promise<T> {
  const headers = buildBackendHeaders(event)
  headers.accept = 'application/json'
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(upstreamUrl(event, apiPath), {
      method: options.method || 'GET',
      headers,
      body: options.body,
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw publicError(503, '服务暂时不可用，请稍后再试。')
  }

  const payload = await response.json().catch(() => null) as BackendEnvelope<T> | null
  if (!response.ok || !payload || payload.status !== 'success') {
    const statusCode = response.ok ? 502 : (response.status >= 500 ? 503 : response.status)
    const reason = statusCode >= 500
      ? '服务暂时不可用，请稍后再试。'
      : payload?.reason || `请求失败（HTTP ${response.status}）`
    throw publicError(statusCode, reason)
  }
  return payload.data as T
}

async function readLimitedRawBody(event: H3Event, limit: number): Promise<Buffer | undefined> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of event.node.req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > limit) throw publicError(413, '请求内容过大')
    chunks.push(buffer)
  }
  return chunks.length ? Buffer.concat(chunks) : undefined
}

/** 读取受限 JSON，不依赖全局 body parser，避免攻击者在限额检查前占满内存。 */
export async function readPreviewJson(event: H3Event): Promise<Record<string, unknown>> {
  const body = await readLimitedRawBody(event, MAX_PREVIEW_BODY)
  if (!body?.length) return {}

  const contentType = getRequestHeader(event, 'content-type') || ''
  if (!/^application\/(?:[\w.+-]*\+)?json(?:\s*;|$)/i.test(contentType)) return {}
  try {
    const value = JSON.parse(body.toString('utf8')) as unknown
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {}
  } catch {
    throw publicError(400, '请求 JSON 格式不正确')
  }
}

/** `/api/**` 原始代理：保留 query、方法、状态与响应流，只转发明确白名单 header。 */
export async function proxyToBackend(event: H3Event) {
  try {
    const method = getMethod(event).toUpperCase()
    const body = method === 'GET' || method === 'HEAD'
      ? undefined
      : await readLimitedRawBody(event, MAX_PROXY_BODY)

    const response = await fetch(upstreamUrl(event), {
      method,
      headers: buildBackendHeaders(event),
      body: body ? Uint8Array.from(body).buffer : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    })

    for (const name of PROXY_RESPONSE_HEADERS) {
      const value = response.headers.get(name)
      if (value) setResponseHeader(event, name, value)
    }
    setResponseStatus(event, response.status)

    if (method === 'HEAD' || !response.body) {
      event.node.res.end()
      return
    }
    return sendStream(event, response.body)
  } catch (error) {
    const statusCode = getErrorStatus(error, 502)
    const isTooLarge = statusCode === 413
    setResponseStatus(event, isTooLarge ? 413 : 502)
    return {
      status: 'error',
      reason: isTooLarge ? '请求内容过大' : '后端服务暂时不可用',
    }
  }
}
