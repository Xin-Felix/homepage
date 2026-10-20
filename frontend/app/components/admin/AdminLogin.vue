<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import { useAdminAuth } from '~/composables/useAdminAuth'

const auth = useAdminAuth()
const username = ref('')
const password = ref('')
const totpCode = ref('')
const localError = ref('')
const submitting = ref(false)
const usernameInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)

const displayedError = computed(() => localError.value || auth.notice.value)

onMounted(async () => {
  await nextTick()
  usernameInput.value?.focus()
})

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  localError.value = ''
  auth.clearNotice()

  try {
    await auth.login({
      username: username.value.trim(),
      password: password.value,
      totpCode: totpCode.value.trim(),
    })
    password.value = ''
    totpCode.value = ''
  }
  catch (error) {
    localError.value = error instanceof Error ? error.message : '登录失败'
    await nextTick()
    passwordInput.value?.select()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="admin-login">
    <form class="admin-login-card" @submit.prevent="submit">
      <div class="admin-login-mark" aria-hidden="true">H</div>
      <div>
        <h1>主页管理后台</h1>
        <p class="admin-muted">使用管理员账号登录后管理主页</p>
      </div>

      <label for="admin-login-username">管理员账号</label>
      <input
        id="admin-login-username"
        ref="usernameInput"
        v-model="username"
        name="username"
        type="text"
        autocomplete="username"
        maxlength="100"
        required
      >

      <label for="admin-login-password">管理员密码</label>
      <input
        id="admin-login-password"
        ref="passwordInput"
        v-model="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
      >

      <label for="admin-login-totp">
        动态验证码 <span class="admin-muted">（启用 TOTP 后必填）</span>
      </label>
      <input
        id="admin-login-totp"
        v-model="totpCode"
        name="totpCode"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        pattern="[0-9]{6}"
        placeholder="6 位验证码"
      >

      <button type="submit" class="admin-btn is-primary is-block" :disabled="submitting">
        {{ submitting ? '正在登录…' : '登录' }}
      </button>
      <p class="admin-form-error" role="alert">{{ displayedError }}</p>
    </form>
  </main>
</template>
