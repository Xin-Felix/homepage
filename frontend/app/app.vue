<script setup lang="ts">
// 在 CSS 与页面绘制前恢复手动主题；没有手动值时使用系统偏好，避免首屏闪烁。
const themeBootstrap = `(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  let savedTheme = null;
  try {
    const saved = localStorage.getItem('homepage.theme');
    if (saved === 'light' || saved === 'dark') savedTheme = saved;
  } catch (_) {}
  const theme = savedTheme || systemTheme;
  root.dataset.theme = theme;
  root.dataset.themePreference = savedTheme ? 'manual' : 'system';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#f4f3ed' : '#0b0d0f';
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
