<script setup lang="ts">
withDefaults(defineProps<{
  tags: string[]
  variant?: 'project' | 'note'
}>(), {
  variant: 'project',
})
</script>

<template>
  <div :class="variant === 'note' ? 'note-tags' : 'project-tags'">
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </div>
</template>
