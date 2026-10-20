<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import AdminFieldRenderer from '~/components/admin/AdminFieldRenderer.vue'
import { ADMIN_RESOURCES, createAdminForm, normalizeAdminFieldErrors, serializeAdminForm } from '~/config/admin-resources'
import { AdminApiError, adminRequest } from '~/composables/useAdminApi'
import { useAdminFeedback } from '~/composables/useAdminFeedback'
import type {
  AdminFormState,
  AdminMarkdownPreview,
  AdminResourceItem,
  AdminResourceKey,
} from '~/types/admin'

const props = defineProps<{
  open: boolean
  resourceKey: AdminResourceKey
  item: AdminResourceItem | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const feedback = useAdminFeedback()
const dialog = ref<HTMLDialogElement | null>(null)
const previewPanel = ref<HTMLElement | null>(null)
const form = ref<AdminFormState>({})
const fieldErrors = ref<Record<string, string>>({})
const previewHtml = ref('')
const previewVisible = ref(false)
const saving = ref(false)
const previewing = ref(false)

const resource = computed(() => ADMIN_RESOURCES[props.resourceKey])
const isNew = computed(() => props.item == null)
const title = computed(() => `${isNew.value ? '新增' : '编辑'}${resource.value.noun}`)

function resetEditor(): void {
  form.value = createAdminForm(resource.value.fields, props.item || {})
  fieldErrors.value = {}
  previewHtml.value = ''
  previewVisible.value = false
}

watch(
  [() => props.open, () => props.resourceKey, () => props.item],
  async ([open]) => {
    if (open) resetEditor()
    await nextTick()
    const element = dialog.value
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      await nextTick()
      element.querySelector<HTMLElement>('input, textarea, select')?.focus()
    }
    else if (!open && element.open) {
      element.close()
    }
  },
  { immediate: true },
)

function close(): void {
  if (!saving.value) emit('close')
}

function handleNativeClose(): void {
  if (props.open) emit('close')
}

async function previewMarkdown(): Promise<void> {
  if (previewing.value) return
  previewing.value = true
  try {
    const result = await adminRequest<AdminMarkdownPreview>('POST', '/admin/markdown-preview', {
      markdown: String(form.value.contentMarkdown ?? ''),
    })
    // 此 HTML 只来自服务端 marked + sanitize-html 白名单，不渲染未经清洗的 Markdown。
    previewHtml.value = result.html || '<p>暂无内容</p>'
    previewVisible.value = true
    await nextTick()
    previewPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  catch (error) {
    feedback.showToast(error instanceof Error ? error.message : '预览失败', 'error')
  }
  finally {
    previewing.value = false
  }
}

async function submit(): Promise<void> {
  if (saving.value) return
  saving.value = true
  fieldErrors.value = {}

  try {
    const payload = serializeAdminForm(resource.value.fields, form.value)
    if (props.item) {
      await adminRequest('PUT', `${resource.value.path}/${props.item.id}`, payload)
    }
    else {
      await adminRequest('POST', resource.value.path, payload)
    }
    feedback.showToast(props.item ? '已保存' : '已新增')
    emit('saved')
    emit('close')
  }
  catch (error) {
    if (error instanceof AdminApiError) {
      fieldErrors.value = normalizeAdminFieldErrors(error.fields)
    }
    feedback.showToast(error instanceof Error ? error.message : '保存失败', 'error')
    await nextTick()
    dialog.value?.querySelector<HTMLElement>('.admin-field.is-invalid input, .admin-field.is-invalid textarea, .admin-field.is-invalid select')?.focus()
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="admin-editor"
    :class="{ 'is-wide': resource.markdown }"
    :aria-labelledby="`admin-editor-title-${resourceKey}`"
    @cancel.prevent="close"
    @close="handleNativeClose"
  >
    <form class="admin-form" @submit.prevent="submit">
      <div class="admin-modal-head">
        <div>
          <span class="admin-eyebrow">内容管理</span>
          <h3 :id="`admin-editor-title-${resourceKey}`">{{ title }}</h3>
        </div>
        <button type="button" class="admin-icon-btn" aria-label="关闭编辑器" :disabled="saving" @click="close">×</button>
      </div>

      <AdminFieldRenderer
        v-for="field in resource.fields"
        :key="field.key"
        v-model="form[field.key]"
        :field="field"
        :input-id="`admin-editor-${resourceKey}-${field.key}`"
        :error="fieldErrors[field.key]"
      />

      <!-- v-html 的值已经由受保护的服务端预览接口清洗。 -->
      <section
        v-if="previewVisible"
        ref="previewPanel"
        class="admin-markdown-preview"
        aria-label="Markdown 预览"
        v-html="previewHtml"
      />

      <div class="admin-form-actions">
        <button
          v-if="resource.markdown"
          type="button"
          class="admin-btn"
          :disabled="previewing || saving"
          @click="previewMarkdown"
        >
          {{ previewing ? '正在预览…' : '预览 Markdown' }}
        </button>
        <span class="admin-form-spacer" />
        <button type="button" class="admin-btn is-ghost" :disabled="saving" @click="close">取消</button>
        <button type="submit" class="admin-btn is-primary" :disabled="saving">
          {{ saving ? '正在保存…' : '保存' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
