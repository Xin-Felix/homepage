import { computed } from 'vue'

import { adminRequest, AdminApiError } from '~/composables/useAdminApi'
import {
  beginAdminSessionCheck,
  clearAdminNotice,
  confirmAdminSession,
  establishAdminSession,
  hydrateAdminToken,
  setAdminAnonymous,
  useAdminSession,
} from '~/composables/useAdminSession'
import type { AdminLoginRequest, AdminLoginResponse } from '~/types/admin'

let initialization: Promise<void> | null = null

function resetHash(): void {
  if (import.meta.client) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}

export function useAdminAuth() {
  const session = useAdminSession()

  async function initialize(): Promise<void> {
    if (!import.meta.client) return
    if (initialization) return initialization

    initialization = (async () => {
      const token = hydrateAdminToken()
      if (!token) {
        setAdminAnonymous()
        return
      }

      beginAdminSessionCheck()
      try {
        await adminRequest<void>('GET', '/api/admin/me')
        confirmAdminSession()
      }
      catch (error) {
        // 精确的过期 401 已由 API 层清 token；网络或服务错误不能误删会话。
        if (session.phase.value !== 'anonymous') {
          const message = error instanceof Error ? error.message : '无法验证登录状态'
          setAdminAnonymous(message, false)
        }
      }
    })().finally(() => {
      initialization = null
    })

    return initialization
  }

  async function login(credentials: AdminLoginRequest): Promise<void> {
    clearAdminNotice()
    const result = await adminRequest<AdminLoginResponse>('POST', '/api/admin/login', credentials)
    establishAdminSession(result.token)
  }

  async function logout(): Promise<void> {
    try {
      await adminRequest<void>('POST', '/api/admin/logout')
    }
    catch {
      // 与旧后台一致：服务不可用时也必须清理当前标签页会话。
    }
    setAdminAnonymous('', true)
    resetHash()
  }

  /** TOTP 启用或停用会撤销所有服务端 token，立即回登录页。 */
  function requireRelogin(message: string): void {
    setAdminAnonymous(message, true)
    resetHash()
  }

  return {
    phase: session.phase,
    notice: session.notice,
    isChecking: computed(() => session.phase.value === 'checking'),
    isAuthenticated: computed(() => session.phase.value === 'authenticated'),
    initialize,
    login,
    logout,
    requireRelogin,
    clearNotice: clearAdminNotice,
    isApiError: (error: unknown): error is AdminApiError => error instanceof AdminApiError,
  }
}
