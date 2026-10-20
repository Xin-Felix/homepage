<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

function go(page: number): void {
  if (props.disabled || page < 0 || page >= props.totalPages || page === props.page) return
  emit('change', page)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="admin-pager" aria-label="分页">
    <button
      type="button"
      class="admin-btn"
      :disabled="disabled || page === 0"
      @click="go(page - 1)"
    >
      上一页
    </button>
    <span aria-live="polite">{{ page + 1 }} / {{ totalPages }}</span>
    <button
      type="button"
      class="admin-btn"
      :disabled="disabled || page >= totalPages - 1"
      @click="go(page + 1)"
    >
      下一页
    </button>
  </nav>
</template>
