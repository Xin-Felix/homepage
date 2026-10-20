<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import { adminRequest } from '~/composables/useAdminApi'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useAdminFeedback } from '~/composables/useAdminFeedback'
import type { AdminTotpSetup, AdminTotpStatus } from '~/types/admin'

const auth = useAdminAuth()
const feedback = useAdminFeedback()
const status = ref<AdminTotpStatus | null>(null)
const setup = shallowRef<AdminTotpSetup | null>(null)
const setupPassword = ref('')
const setupCode = ref('')
const disablePassword = ref('')
const disableCode = ref('')
const setupExpired = ref(false)
const loading = ref(true)
const loadError = ref('')
const setupBusy = ref(false)
const confirmBusy = ref(false)
const disableBusy = ref(false)
let expiryTimer: ReturnType<typeof setTimeout> | undefined
let setupGeneration = 0
let disposed = false

onMounted(() => {
  disposed = false
  loadStatus()
})
onBeforeUnmount(() => {
  disposed = true
  clearSensitiveData()
})

async function loadStatus(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    status.value = await adminRequest<AdminTotpStatus>('GET', '/api/admin/totp/status')
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : '加载失败'
  }
  finally {
    loading.value = false
  }
}

/** 二维码和手工密钥仅保存在当前组件内，离页、过期和启停成功都会立即清除。 */
function clearSensitiveData(): void {
  setupGeneration += 1
  if (expiryTimer) clearTimeout(expiryTimer)
  expiryTimer = undefined
  setup.value = null
  setupPassword.value = ''
  setupCode.value = ''
  disablePassword.value = ''
  disableCode.value = ''
}

function scheduleExpiry(expiresAt: string): void {
  if (expiryTimer) clearTimeout(expiryTimer)

  // 后端当前可能返回无时区 LocalDateTime；这种值不能跨时区当作绝对时间解析。
  let remaining = 10 * 60_000
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(expiresAt)) {
    const timestamp = new Date(expiresAt).getTime()
    if (Number.isFinite(timestamp)) remaining = Math.max(1000, timestamp - Date.now())
  }

  expiryTimer = setTimeout(() => {
    setup.value = null
    setupCode.value = ''
    setupExpired.value = true
  }, Math.min(remaining, 10 * 60_000))
}

async function startSetup(): Promise<void> {
  if (setupBusy.value) return
  const generation = ++setupGeneration
  setupBusy.value = true
  try {
    const result = await adminRequest<AdminTotpSetup>('POST', '/api/admin/totp/setup', {
      password: setupPassword.value,
    })
    // 用户可能在请求期间离开安全页；迟到的响应不得把密钥重新留在闭包中。
    if (disposed || generation !== setupGeneration) return
    setupPassword.value = ''
    setupCode.value = ''
    setupExpired.value = false
    setup.value = result
    scheduleExpiry(result.expiresAt)
  }
  catch (error) {
    if (!disposed && generation === setupGeneration) {
      feedback.showToast(error instanceof Error ? error.message : '无法生成绑定二维码', 'error')
    }
  }
  finally {
    setupBusy.value = false
  }
}

async function confirmSetup(): Promise<void> {
  if (confirmBusy.value) return
  confirmBusy.value = true
  try {
    await adminRequest('POST', '/api/admin/totp/confirm', { code: setupCode.value.trim() })
    clearSensitiveData()
    auth.requireRelogin('TOTP 已启用，请使用账号、密码和动态验证码重新登录')
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '启用失败', 'error')
    confirmBusy.value = false
  }
}

async function disableTotp(): Promise<void> {
  if (!window.confirm('确定停用 TOTP 双因素认证吗？')) return
  disableBusy.value = true
  try {
    await adminRequest('POST', '/api/admin/totp/disable', {
      password: disablePassword.value,
      code: disableCode.value.trim(),
    })
    clearSensitiveData()
    auth.requireRelogin('TOTP 已停用，请重新登录')
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '停用失败', 'error')
    disableBusy.value = false
  }
}
</script>

<template>
  <section>
    <header class="admin-panel-head">
      <div>
        <span class="admin-eyebrow">Security</span>
        <h2>安全设置</h2>
        <p>TOTP 动态验证码和后台会话安全</p>
      </div>
    </header>

    <div v-if="loading" class="admin-card admin-loading" role="status">正在读取安全状态…</div>
    <div v-else-if="loadError" class="admin-card admin-empty" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="admin-btn" @click="loadStatus">重新加载</button>
    </div>

    <template v-else-if="status">
      <div class="admin-card admin-security-card">
        <div class="admin-security-status">
          <div>
            <span class="admin-security-icon" aria-hidden="true">⌾</span>
            <div>
              <h3>Authenticator 动态验证码</h3>
              <p class="admin-muted">
                {{ status.enabled ? '已启用：登录必须同时输入 6 位动态验证码。' : '未启用：当前只验证管理员账号和密码。' }}
              </p>
            </div>
          </div>
          <span class="admin-badge" :class="{ 'is-success': status.enabled }">
            {{ status.enabled ? '已启用' : '未启用' }}
          </span>
        </div>

        <template v-if="!status.enabled">
          <p v-if="status.setupPending && !setup && !setupExpired" class="admin-warning">存在未确认的绑定，重新生成会替换它。</p>

          <div v-if="setup" class="admin-totp-setup">
            <h3>用 Authenticator 扫描二维码</h3>
            <p class="admin-muted">二维码约 10 分钟有效。无法扫码时手工输入下方密钥。</p>
            <img class="admin-totp-qr" :src="setup.qrDataUrl" alt="TOTP 绑定二维码">
            <code class="admin-manual-key">{{ setup.manualKey }}</code>
            <div class="admin-security-action">
              <input
                v-model="setupCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                pattern="[0-9]{6}"
                placeholder="输入 App 中的 6 位验证码"
              >
              <button type="button" class="admin-btn is-primary" :disabled="confirmBusy" @click="confirmSetup">
                {{ confirmBusy ? '正在启用…' : '确认并启用' }}
              </button>
            </div>
          </div>

          <p v-else-if="setupExpired" class="admin-warning">
            绑定已过期，请重新进入安全设置生成二维码。
          </p>

          <div v-else class="admin-security-action">
            <input
              v-model="setupPassword"
              type="password"
              autocomplete="current-password"
              placeholder="再次输入后台密码"
            >
            <button type="button" class="admin-btn is-primary" :disabled="setupBusy" @click="startSetup">
              {{ setupBusy ? '正在生成…' : '生成绑定二维码' }}
            </button>
          </div>
        </template>

        <template v-else>
          <p class="admin-warning">停用后后台将退回账号 + 密码登录，并撤销所有现有会话。</p>
          <div class="admin-security-action is-disable">
            <input
              v-model="disablePassword"
              type="password"
              autocomplete="current-password"
              placeholder="当前后台密码"
            >
            <input
              v-model="disableCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              pattern="[0-9]{6}"
              placeholder="当前 6 位动态验证码"
            >
            <button type="button" class="admin-btn is-danger" :disabled="disableBusy" @click="disableTotp">
              {{ disableBusy ? '正在停用…' : '停用 TOTP' }}
            </button>
          </div>
        </template>
      </div>
      <p class="admin-muted admin-security-note">
        请使用 Google Authenticator、Microsoft Authenticator、1Password 等兼容 TOTP 的应用。服务器时间必须保持同步。
      </p>
    </template>
  </section>
</template>
