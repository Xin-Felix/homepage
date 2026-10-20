<script setup lang="ts">
import { ref, watch } from 'vue'

import AdminPager from '~/components/admin/AdminPager.vue'
import { adminRequest } from '~/composables/useAdminApi'
import { useAdminFeedback } from '~/composables/useAdminFeedback'
import type { AdminMessage, AdminPageResult } from '~/types/admin'

const props = defineProps<{ page: number }>()
const emit = defineEmits<{
  'update:page': [page: number]
  changed: []
}>()

const feedback = useAdminFeedback()
const result = ref<AdminPageResult<AdminMessage> | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const mutatingId = ref<number | null>(null)
let loadSequence = 0

watch(() => props.page, load, { immediate: true })

async function load(): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await adminRequest<AdminPageResult<AdminMessage>>(
      'GET',
      `/api/admin/messages?page=${props.page}&size=20`,
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

async function markRead(message: AdminMessage): Promise<void> {
  mutatingId.value = message.id
  try {
    await adminRequest('PUT', `/api/admin/messages/${message.id}/read`)
    await load()
    emit('changed')
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '操作失败', 'error')
  }
  finally {
    mutatingId.value = null
  }
}

async function remove(message: AdminMessage): Promise<void> {
  if (!window.confirm(`确定删除 ${message.name} 的这条留言吗？`)) return
  mutatingId.value = message.id
  try {
    await adminRequest('DELETE', `/api/admin/messages/${message.id}`)
    feedback.showToast('已删除')
    await load()
    emit('changed')
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '删除失败', 'error')
  }
  finally {
    mutatingId.value = null
  }
}
</script>

<template>
  <section>
    <header class="admin-panel-head">
      <div>
        <span class="admin-eyebrow">Inbox</span>
        <h2>留言</h2>
        <p>{{ result ? `共 ${result.total} 条` : '访客留言与联系方式' }}</p>
      </div>
    </header>

    <div v-if="loading" class="admin-card admin-loading" role="status">正在加载留言…</div>
    <div v-else-if="errorMessage" class="admin-card admin-empty" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" class="admin-btn" @click="load">重新加载</button>
    </div>
    <template v-else-if="result">
      <ul class="admin-list">
        <li v-if="!result.items.length" class="admin-card admin-empty">还没有留言</li>
        <li v-for="message in result.items" :key="message.id" class="admin-message" :class="{ 'is-unread': !message.read }">
          <div class="admin-message-head">
            <strong>{{ message.name }}</strong>
            <span v-if="message.contact">{{ message.contact }}</span>
            <span v-else class="admin-muted">未留联系方式</span>
            <time class="admin-muted" :datetime="message.createdAt">{{ formatTime(message.createdAt) }}</time>
            <span v-if="!message.read" class="admin-badge is-new">未读</span>
            <span v-if="message.ipHash" class="admin-muted" title="来源 IP 摘要，相同表示同一来源">
              #{{ message.ipHash.slice(0, 6) }}
            </span>
          </div>
          <p class="admin-message-body">{{ message.content }}</p>
          <div class="admin-row-actions is-start">
            <button
              v-if="!message.read"
              type="button"
              class="admin-btn"
              :disabled="mutatingId === message.id"
              @click="markRead(message)"
            >标记已读</button>
            <button
              type="button"
              class="admin-btn is-danger"
              :disabled="mutatingId === message.id"
              @click="remove(message)"
            >删除</button>
          </div>
        </li>
      </ul>
      <AdminPager :page="result.page" :total-pages="result.totalPages" @change="changePage" />
    </template>
  </section>
</template>
