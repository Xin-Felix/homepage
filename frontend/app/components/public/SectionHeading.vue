<script setup lang="ts">
defineProps<{
  number: string
  kicker: string
  titleId: string
}>()
</script>

<template>
  <header class="section-header reveal">
    <div>
      <span>{{ number }}</span>
      <p>{{ kicker }}</p>
    </div>
    <h2 :id="titleId"><slot /></h2>
  </header>
</template>
