import { readonly, ref } from 'vue'

import type { AdminAuthPhase } from '~/types/admin'

const TOKEN_KEY = 'homepage.admin.token'

// 使用普通模块 ref，而不是 useState：token 不会进入 Nuxt SSR payload。
const phase = ref<AdminAuthPhase>('checking')
const notice = ref('')
let token: string | null = null
let tokenHydrated = false

export function hydrateAdminToken(): string | null {
  if (!import.meta.client) return null
  if (!tokenHydrated) {
    token = window.sessionStorage.getItem(TOKEN_KEY)
    tokenHydrated = true
  }
  return token
}

export function readAdminToken(): string | null {
  return hydrateAdminToken()
}

function persistToken(value: string | null): void {
  // 防御未来误用：服务端模块单例既不读取，也不暂存任何 token。
  if (!import.meta.client) return
  token = value
  tokenHydrated = true
  if (value) window.sessionStorage.setItem(TOKEN_KEY, value)
  else window.sessionStorage.removeItem(TOKEN_KEY)
}

export function beginAdminSessionCheck(): void {
  phase.value = 'checking'
}

export function establishAdminSession(value: string): void {
  persistToken(value)
  notice.value = ''
  phase.value = 'authenticated'
}

export function confirmAdminSession(): void {
  notice.value = ''
  phase.value = 'authenticated'
}

export function setAdminAnonymous(message = '', removeToken = false): void {
  if (removeToken) persistToken(null)
  notice.value = message
  phase.value = 'anonymous'
}

export function expireAdminSession(): void {
  setAdminAnonymous('登录已过期，请重新登录', true)
}

export function clearAdminNotice(): void {
  notice.value = ''
}

export function useAdminSession() {
  return {
    phase: readonly(phase),
    notice: readonly(notice),
  }
}
