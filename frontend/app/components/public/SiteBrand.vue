<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  subtitle: string
  to?: string
  label?: string
}>(), {
  to: '/',
  label: '回到主页',
})
</script>

<template>
  <NuxtLink class="brand" :to="to" :aria-label="label">
    <span class="brand-mark" aria-hidden="true">HX</span>
    <span class="brand-copy">
      <strong>{{ name }}</strong>
      <small>{{ subtitle }}</small>
    </span>
  </NuxtLink>
</template>
