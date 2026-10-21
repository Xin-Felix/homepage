<script setup lang="ts">
const { isLight, followsSystem, toggleTheme } = usePublicTheme()

const label = computed(() => isLight.value ? '切换为深色主题' : '切换为浅色主题')
const hint = computed(() => followsSystem.value
  ? `当前跟随系统，${label.value}`
  : `当前为手动主题，${label.value}`)
</script>

<template>
  <button
    id="theme-toggle"
    class="icon-button"
    type="button"
    :aria-label="label"
    :title="hint"
    @click="toggleTheme"
  >
    <svg class="theme-icon theme-icon--moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
    <svg class="theme-icon theme-icon--sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  </button>
</template>
