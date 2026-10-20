<script setup lang="ts">
// 在 CSS 与页面绘制前恢复主题，避免浅色用户看到深色闪烁。
const themeBootstrap = `(() => {
  const root = document.documentElement;
  root.classList.add('js');
  try {
    root.dataset.theme = localStorage.getItem('homepage.theme') === 'light' ? 'light' : 'dark';
  } catch (_) {
    root.dataset.theme = 'dark';
  }
})();`

useHead({
  htmlAttrs: { lang: 'zh-CN' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'theme-color', content: '#0b0d0f' },
  ],
  link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  script: [{ key: 'public-theme-bootstrap', innerHTML: themeBootstrap, tagPosition: 'head' }],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
