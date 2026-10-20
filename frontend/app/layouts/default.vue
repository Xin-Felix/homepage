<script setup lang="ts">
// 公开样式随布局在首个 SSR HTML 中显式加载，不进入独立后台页面。
useHead({
  link: [{ rel: 'stylesheet', href: '/styles/site.css' }],
})
</script>

<template>
  <!-- 保持一个稳定的 Nuxt 根容器，不改变各公开页面的布局选择器。 -->
  <div class="public-layout">
    <slot />
  </div>
</template>
