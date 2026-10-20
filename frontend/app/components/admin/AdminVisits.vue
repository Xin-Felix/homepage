<script setup lang="ts">
import { ref, watch } from 'vue'

import AdminPager from '~/components/admin/AdminPager.vue'
import { adminRequest } from '~/composables/useAdminApi'
import type { AdminPageResult, AdminVisit } from '~/types/admin'

const props = defineProps<{ page: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

const result = ref<AdminPageResult<AdminVisit> | null>(null)
const loading = ref(true)
const errorMessage = ref('')
let loadSequence = 0

watch(() => props.page, load, { immediate: true })

async function load(): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await adminRequest<AdminPageResult<AdminVisit>>(
      'GET',
      `/api/admin/visits?page=${props.page}&size=20`,
    )
    if (sequence !== loadSequence) return
    if (!data.items.length && props.page > 0) {
      emit('update:page', props.page - 1)
      return
    }
    result.value = data
  }
  catch (error) {
    if (sequence === loadSequence) errorMessage.value = error instanceof Error ? error.message : '加载失败'
  }
  finally {
    if (sequence === loadSequence) loading.value = false
  }
}

function formatTime(value: string): string {
  return value ? String(value).replace('T', ' ').slice(0, 16) : ''
}

function changePage(page: number): void {
  emit('update:page', page)
  window.scrollTo({ top: 0, behavior: 'auto' })
}
</script>

<template>
  <section>
    <header class="admin-panel-head">
      <div>
        <span class="admin-eyebrow">Analytics</span>
        <h2>访问日志</h2>
        <p>{{ result ? `共 ${result.total} 条独立访问记录` : '脱敏后的独立访问记录' }}</p>
      </div>
    </header>

    <div v-if="loading" class="admin-card admin-loading" role="status">正在加载访问日志…</div>
    <div v-else-if="errorMessage" class="admin-card admin-empty" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" class="admin-btn" @click="load">重新加载</button>
    </div>
    <template v-else-if="result">
      <ul class="admin-list">
        <li v-if="!result.items.length" class="admin-card admin-empty">还没有访问日志</li>
        <li v-for="visit in result.items" :key="visit.id" class="admin-visit">
          <div class="admin-visit-head">
            <strong>{{ visit.source || 'unknown' }}</strong>
            <span class="admin-badge" title="加盐后的来源指纹">#{{ visit.fingerprint }}</span>
            <span class="admin-badge">请求 {{ visit.hits }} 次</span>
            <span v-if="Math.max(0, Number(visit.hits || 1) - 1)" class="admin-muted">
              其中刷新 {{ Math.max(0, Number(visit.hits || 1) - 1) }} 次
            </span>
          </div>
          <dl class="admin-visit-grid">
            <div><dt>首次访问</dt><dd>{{ formatTime(visit.firstVisitedAt) }}</dd></div>
            <div><dt>最后访问</dt><dd>{{ formatTime(visit.lastVisitedAt) }}</dd></div>
            <div><dt>访问路径</dt><dd>{{ visit.path || '/' }}</dd></div>
            <div><dt>来源页面</dt><dd>{{ visit.referer || '直接访问' }}</dd></div>
            <div class="is-wide"><dt>浏览器 / 设备</dt><dd>{{ visit.userAgent || '未提供' }}</dd></div>
          </dl>
        </li>
      </ul>
      <AdminPager :page="result.page" :total-pages="result.totalPages" @change="changePage" />
    </template>
  </section>
</template>
