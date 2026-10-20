<script setup lang="ts">
import { onMounted } from 'vue'

import AdminLogin from '~/components/admin/AdminLogin.vue'
import AdminShell from '~/components/admin/AdminShell.vue'
import { useAdminAuth } from '~/composables/useAdminAuth'

definePageMeta({ layout: 'admin' })

// SSR 只输出无敏感信息的 fallback；鉴权和后台数据均在 ClientOnly 内启动。
useSeoMeta({
  title: '主页管理后台',
  robots: 'noindex, nofollow',
})

const { initialize, isAuthenticated, isChecking } = useAdminAuth()

onMounted(() => {
  initialize()
})
</script>

<template>
  <ClientOnly>
    <div class="admin-root">
      <main v-if="isChecking" class="admin-login" aria-live="polite">
        <div class="admin-login-card admin-boot-card">
          <div class="admin-login-mark" aria-hidden="true">H</div>
          <h1>主页管理后台</h1>
          <p class="admin-muted">正在验证登录状态…</p>
          <span class="admin-spinner" aria-hidden="true" />
        </div>
      </main>
      <AdminShell v-else-if="isAuthenticated" />
      <AdminLogin v-else />
    </div>

    <template #fallback>
      <main class="admin-root admin-login">
        <div class="admin-login-card admin-boot-card">
          <div class="admin-login-mark" aria-hidden="true">H</div>
          <h1>主页管理后台</h1>
          <p class="admin-muted">正在加载管理后台…</p>
        </div>
      </main>
    </template>
  </ClientOnly>
</template>
