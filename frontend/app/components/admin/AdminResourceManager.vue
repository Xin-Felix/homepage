<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

import AdminEditorModal from '~/components/admin/AdminEditorModal.vue'
import { ADMIN_RESOURCES } from '~/config/admin-resources'
import { adminRequest } from '~/composables/useAdminApi'
import { useAdminFeedback } from '~/composables/useAdminFeedback'
import type { AdminResourceItem, AdminResourceKey } from '~/types/admin'

const props = defineProps<{
  resourceKey: AdminResourceKey
}>()

const feedback = useAdminFeedback()
const root = ref<HTMLElement | null>(null)
const items = ref<AdminResourceItem[]>([])
const loading = ref(true)
const loadError = ref('')
const editorOpen = ref(false)
const editingItem = ref<AdminResourceItem | null>(null)
let loadSequence = 0

const resource = ADMIN_RESOURCES[props.resourceKey]

onMounted(load)

async function load(): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  loadError.value = ''
  try {
    const result = await adminRequest<AdminResourceItem[]>('GET', resource.path)
    if (sequence === loadSequence) items.value = result
  }
  catch (error) {
    if (sequence === loadSequence) loadError.value = error instanceof Error ? error.message : '加载失败'
  }
  finally {
    if (sequence === loadSequence) loading.value = false
  }
}

function openEditor(item: AdminResourceItem | null): void {
  editingItem.value = item
  editorOpen.value = true
}

async function saved(): Promise<void> {
  editorOpen.value = false
  await load()
}

const sorting = ref(false)

async function move(index: number, delta: -1 | 1): Promise<void> {
  const target = index + delta
  const moving = items.value[index]
  const targetItem = items.value[target]
  if (sorting.value || !moving || !targetItem) return

  sorting.value = true
  const ids = items.value.map(item => item.id)
  ;[ids[index], ids[target]] = [targetItem.id, moving.id]

  try {
    await adminRequest('PUT', `${resource.path}/order`, ids)
    await load()
    await nextTick()
    const row = root.value?.querySelector<HTMLElement>(`[data-id="${moving.id}"]`)
    const preferred = row?.querySelector<HTMLButtonElement>(`[data-action="${delta < 0 ? 'up' : 'down'}"]`)
    const fallback = row?.querySelector<HTMLButtonElement>('[data-action="edit"]')
    ;(preferred && !preferred.disabled ? preferred : fallback)?.focus()
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '排序失败', 'error')
  }
  finally {
    sorting.value = false
  }
}

async function remove(item: AdminResourceItem): Promise<void> {
  if (sorting.value) return
  const summary = resource.summary(item)
  const extra = props.resourceKey === 'notes' ? '' : '\n（只是暂时不想展示的话，可以在编辑里取消展示或发布）'
  if (!window.confirm(`确定删除「${summary.title}」吗？删除后无法恢复。${extra}`)) return

  try {
    await adminRequest('DELETE', `${resource.path}/${item.id}`)
    feedback.showToast('已删除')
    await load()
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '删除失败', 'error')
  }
}
</script>

<template>
  <section ref="root">
    <header class="admin-panel-head">
      <div>
        <span class="admin-eyebrow">内容管理</span>
        <h2>{{ resource.title }}</h2>
        <p>{{ resource.description }}</p>
      </div>
      <button type="button" class="admin-btn is-primary" @click="openEditor(null)">＋ 新增{{ resource.noun }}</button>
    </header>

    <div v-if="loading" class="admin-card admin-loading" role="status">正在加载{{ resource.title }}…</div>
    <div v-else-if="loadError" class="admin-card admin-empty" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="admin-btn" @click="load">重新加载</button>
    </div>
    <ul v-else class="admin-list">
      <li v-if="!items.length" class="admin-card admin-empty">
        还没有{{ resource.noun }}，点右上角新增一条吧
      </li>
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="admin-resource-row"
        :class="{ 'is-hidden': item.visible === false }"
        :data-id="item.id"
      >
        <div class="admin-row-main">
          <div class="admin-row-title">
            {{ resource.summary(item).title }}
            <span v-if="item.visible === false" class="admin-badge">已隐藏</span>
            <span v-if="resourceKey === 'notes' && item.published === false" class="admin-badge">草稿</span>
          </div>
          <div class="admin-row-sub">{{ resource.summary(item).sub }}</div>
        </div>
        <div class="admin-row-actions">
          <template v-if="resource.sortable">
            <button
              type="button"
              class="admin-btn is-icon"
              data-action="up"
              :aria-label="`上移：${resource.summary(item).title}`"
              title="上移"
              :disabled="sorting || index === 0"
              @click="move(index, -1)"
            >↑</button>
            <button
              type="button"
              class="admin-btn is-icon"
              data-action="down"
              :aria-label="`下移：${resource.summary(item).title}`"
              title="下移"
              :disabled="sorting || index === items.length - 1"
              @click="move(index, 1)"
            >↓</button>
          </template>
          <button type="button" class="admin-btn" data-action="edit" :disabled="sorting" @click="openEditor(item)">编辑</button>
          <button type="button" class="admin-btn is-danger" :disabled="sorting" @click="remove(item)">删除</button>
        </div>
      </li>
    </ul>

    <AdminEditorModal
      :open="editorOpen"
      :resource-key="resourceKey"
      :item="editingItem"
      @close="editorOpen = false"
      @saved="saved"
    />
  </section>
</template>
