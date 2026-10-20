<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

import AdminFieldRenderer from '~/components/admin/AdminFieldRenderer.vue'
import { createAdminForm, normalizeAdminFieldErrors, PROFILE_FIELDS, serializeAdminForm } from '~/config/admin-resources'
import { AdminApiError, adminRequest } from '~/composables/useAdminApi'
import { useAdminFeedback } from '~/composables/useAdminFeedback'
import type { AdminFormState, AdminProfile } from '~/types/admin'

const feedback = useAdminFeedback()
const formElement = ref<HTMLFormElement | null>(null)
const form = ref<AdminFormState>({})
const fieldErrors = ref<Record<string, string>>({})
const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
let loadSequence = 0

onMounted(load)

async function load(): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  loadError.value = ''
  try {
    const profile = await adminRequest<AdminProfile>('GET', '/api/admin/profile')
    if (sequence !== loadSequence) return
    form.value = createAdminForm(PROFILE_FIELDS, profile)
  }
  catch (error) {
    if (sequence === loadSequence) loadError.value = error instanceof Error ? error.message : '加载失败'
  }
  finally {
    if (sequence === loadSequence) loading.value = false
  }
}

async function save(): Promise<void> {
  if (saving.value) return
  saving.value = true
  fieldErrors.value = {}
  try {
    await adminRequest('PUT', '/api/admin/profile', serializeAdminForm(PROFILE_FIELDS, form.value))
    feedback.showToast('已保存，主页已更新')
  }
  catch (error) {
    if (error instanceof AdminApiError) fieldErrors.value = normalizeAdminFieldErrors(error.fields)
    feedback.showToast(error instanceof Error ? error.message : '保存失败', 'error')
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('.admin-field.is-invalid input, .admin-field.is-invalid textarea, .admin-field.is-invalid select')?.focus()
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="admin-panel-head">
      <div>
        <span class="admin-eyebrow">站点资料</span>
        <h2>基本信息</h2>
        <p>主页顶部、关于我、页脚和 SEO 信息</p>
      </div>
    </header>

    <div v-if="loading" class="admin-card admin-loading" role="status">正在加载基本信息…</div>
    <div v-else-if="loadError" class="admin-card admin-empty" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="admin-btn" @click="load">重新加载</button>
    </div>
    <form v-else ref="formElement" class="admin-card admin-form admin-profile-form" @submit.prevent="save">
      <AdminFieldRenderer
        v-for="field in PROFILE_FIELDS"
        :key="field.key"
        v-model="form[field.key]"
        :field="field"
        :input-id="`admin-profile-${field.key}`"
        :error="fieldErrors[field.key]"
      />
      <div class="admin-form-actions">
        <button type="submit" class="admin-btn is-primary" :disabled="saving">
          {{ saving ? '正在保存…' : '保存' }}
        </button>
      </div>
    </form>
  </section>
</template>
