import { expireAdminSession, readAdminToken } from '~/composables/useAdminSession'
import type { AdminHttpMethod, ApiEnvelope } from '~/types/admin'

/** 保留 HTTP 状态和字段错误，供通用表单精确展示。 */
export class AdminApiError extends Error {
  readonly status: number
  readonly fields?: Record<string, string>

  constructor(message: string, status = 0, fields?: Record<string, string>) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.fields = fields
  }
}

/**
 * 管理后台只在客户端调用原生 fetch。
 * 不使用 useFetch/useAsyncData，避免 Bearer token 或后台数据进入 SSR payload。
 */
export async function adminRequest<T = void>(
  method: AdminHttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!import.meta.client) {
    throw new AdminApiError('管理后台 API 只能在客户端调用')
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = readAdminToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const init: RequestInit = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(path, init)
  }
  catch {
    throw new AdminApiError('网络异常，请检查服务是否在运行')
  }

  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null

  // TOTP 二次校验也可能返回 401；只有后端明确声明会话失效时才退出。
  if (
    response.status === 401
    && path !== '/api/admin/login'
    && payload?.reason === '未登录或登录已过期'
  ) {
    expireAdminSession()
    throw new AdminApiError('登录已过期，请重新登录', response.status, payload.invalidFields)
  }

  if (!response.ok || !payload || payload.status !== 'success') {
    throw new AdminApiError(
      payload?.reason || `请求失败（HTTP ${response.status}）`,
      response.status,
      payload?.invalidFields,
    )
  }

  return payload.data as T
}

export function useAdminApi() {
  return { request: adminRequest }
}
