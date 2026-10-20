<script setup lang="ts">
// 后台布局独立加载样式和 noindex，不影响公开页面的组件与 SEO。
useHead({
  title: '主页管理后台',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'googlebot', content: 'noindex, nofollow' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'stylesheet', href: '/styles/admin.css' },
  ],
})
</script>

<template>
  <div class="admin-layout">
    <slot />
  </div>
</template>
