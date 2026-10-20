<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import AdminDashboard from '~/components/admin/AdminDashboard.vue'
import AdminMessages from '~/components/admin/AdminMessages.vue'
import AdminProfile from '~/components/admin/AdminProfile.vue'
import AdminResourceManager from '~/components/admin/AdminResourceManager.vue'
import AdminSecurity from '~/components/admin/AdminSecurity.vue'
import AdminVisits from '~/components/admin/AdminVisits.vue'
import { ADMIN_NAV_ITEMS } from '~/config/admin-resources'
import { adminRequest } from '~/composables/useAdminApi'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useAdminFeedback } from '~/composables/useAdminFeedback'
import type {
  AdminAnalyticsDays,
  AdminDashboardSummary,
  AdminResourceKey,
  AdminTab,
} from '~/types/admin'

const auth = useAdminAuth()
const { toast } = useAdminFeedback()
const panel = ref<HTMLElement | null>(null)
const currentTab = ref<AdminTab>('dashboard')
const analyticsDays = ref<AdminAnalyticsDays>(30)
const visitPage = ref(0)
const messagePage = ref(0)
const unreadMessages = ref(0)
let badgeSequence = 0

const resourceKey = computed<AdminResourceKey | null>(() => {
  const tab = currentTab.value
  return ['experiences', 'projects', 'notes', 'ai-projects', 'contacts'].includes(tab)
    ? tab as AdminResourceKey
    : null
})

onMounted(() => {
  syncHash(false)
  window.addEventListener('hashchange', onHashChange)
  refreshUnreadBadge()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHashChange)
})

function tabFromHash(): AdminTab {
  const raw = window.location.hash.slice(1)
  return ADMIN_NAV_ITEMS.some(item => item.id === raw) ? raw as AdminTab : 'dashboard'
}

function onHashChange(): void {
  syncHash(true)
}

async function syncHash(focusPanel: boolean): Promise<void> {
  currentTab.value = tabFromHash()
  refreshUnreadBadge()
  if (!focusPanel) return
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
  panel.value?.focus({ preventScroll: true })
}

async function refreshUnreadBadge(): Promise<void> {
  const sequence = ++badgeSequence
  try {
    const summary = await adminRequest<AdminDashboardSummary>('GET', '/api/admin/dashboard')
    if (sequence === badgeSequence) unreadMessages.value = summary.unreadMessages
  }
  catch {
    // badge 是辅助信息，失败不覆盖当前面板，也不弹出额外错误。
  }
}
</script>

<template>
  <div class="admin-app">
    <header class="admin-topbar">
      <a class="admin-brand" href="#dashboard" aria-label="主页后台概览">
        <span class="admin-brand-mark">H</span>
        <span><strong>主页后台</strong><small>HUANGXIN.WORK</small></span>
      </a>
      <div class="admin-top-actions">
        <a class="admin-btn is-ghost" href="/" target="_blank" rel="noopener">查看主页 ↗</a>
        <button type="button" class="admin-btn is-ghost" @click="auth.logout">退出登录</button>
      </div>
    </header>

    <div class="admin-shell-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar-caption">管理菜单</div>
        <nav aria-label="后台导航">
          <a
            v-for="item in ADMIN_NAV_ITEMS"
            :key="item.id"
            class="admin-nav-item"
            :href="`#${item.id}`"
            :aria-current="currentTab === item.id ? 'page' : undefined"
          >
            <span class="admin-nav-dot" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.id === 'messages' && unreadMessages > 0"
              class="admin-nav-badge"
              :aria-label="`${unreadMessages} 条未读`"
            >{{ unreadMessages }}</span>
          </a>
        </nav>
        <div class="admin-sidebar-foot">
          <span class="admin-status-dot" />
          <span>管理接口已连接</span>
        </div>
      </aside>

      <main ref="panel" class="admin-panel" tabindex="-1" aria-live="polite">
        <AdminDashboard v-if="currentTab === 'dashboard'" v-model:days="analyticsDays" />
        <AdminVisits v-else-if="currentTab === 'visits'" v-model:page="visitPage" />
        <AdminProfile v-else-if="currentTab === 'profile'" />
        <AdminResourceManager
          v-else-if="resourceKey"
          :key="resourceKey"
          :resource-key="resourceKey"
        />
        <AdminMessages
          v-else-if="currentTab === 'messages'"
          v-model:page="messagePage"
          @changed="refreshUnreadBadge"
        />
        <AdminSecurity v-else-if="currentTab === 'security'" />
      </main>
    </div>

    <Transition name="admin-toast">
      <div
        v-if="toast"
        :key="toast.id"
        class="admin-toast"
        :class="{ 'is-error': toast.type === 'error' }"
        role="status"
        aria-live="polite"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>
