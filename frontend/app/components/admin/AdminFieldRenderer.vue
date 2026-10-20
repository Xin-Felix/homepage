<script setup lang="ts">
import { computed } from 'vue'

import type { AdminFieldDefinition, AdminFormValue } from '~/types/admin'

const props = withDefaults(defineProps<{
  field: AdminFieldDefinition
  inputId: string
  modelValue?: AdminFormValue
  error?: string
}>(), {
  modelValue: '',
  error: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: AdminFormValue]
}>()

const isCheckbox = computed(() => props.field.type === 'checkbox')
const describedBy = computed(() => [
  props.field.hint ? `${props.inputId}-hint` : '',
  props.error ? `${props.inputId}-error` : '',
].filter(Boolean).join(' ') || undefined)

function updateText(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value)
}

function updateCheckbox(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <div
    class="admin-field"
    :class="{ 'is-check': isCheckbox, 'is-invalid': Boolean(error) }"
    :data-field="field.key"
  >
    <template v-if="isCheckbox">
      <input
        :id="inputId"
        :name="field.key"
        type="checkbox"
        :checked="Boolean(modelValue)"
        :aria-describedby="describedBy"
        @change="updateCheckbox"
      >
      <label :for="inputId">{{ field.label }}</label>
    </template>

    <template v-else>
      <label :for="inputId">
        {{ field.label }}<span v-if="field.required" class="admin-required" aria-hidden="true">*</span>
      </label>

      <textarea
        v-if="field.type === 'textarea'"
        :id="inputId"
        :name="field.key"
        :value="String(modelValue ?? '')"
        :rows="field.rows || 4"
        :maxlength="field.max"
        :required="field.required"
        :placeholder="field.placeholder"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @input="updateText"
      />

      <select
        v-else-if="field.type === 'select'"
        :id="inputId"
        :name="field.key"
        :value="String(modelValue ?? '')"
        :required="field.required"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @change="updateText"
      >
        <option v-for="option in field.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <input
        v-else
        :id="inputId"
        :name="field.key"
        :type="field.type === 'url' ? 'url' : 'text'"
        :value="String(modelValue ?? '')"
        :maxlength="field.max"
        :required="field.required"
        :placeholder="field.placeholder"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @input="updateText"
      >
    </template>

    <small v-if="field.hint" :id="`${inputId}-hint`" class="admin-field-hint">{{ field.hint }}</small>
    <span v-if="error" :id="`${inputId}-error`" class="admin-field-error">{{ error }}</span>
  </div>
</template>
