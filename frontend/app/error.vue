<script setup lang="ts">
import { computed } from 'vue'

interface PublicNuxtError {
  statusCode?: number
  message?: string
  statusMessage?: string
}

const props = defineProps<{ error: PublicNuxtError }>()
const status = computed(() => Number(props.error.statusCode || 500))
const title = computed(() => status.value === 404 ? '页面不存在' : '出错了')
const message = computed(() => {
  if (status.value === 404) return props.error.message || props.error.statusMessage || '你要找的页面不存在。'
  if (status.value === 429) return '请求过于频繁，请稍后再试。'
  return '服务暂时不可用，请稍后再试。'
})

useHead({ htmlAttrs: { lang: 'zh-CN' } })
useSeoMeta({ title: () => title.value, robots: 'noindex, nofollow' })

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <main class="error-page">
    <div class="code">{{ status }}</div>
    <p>{{ message }}</p>
    <a href="/" @click.prevent="handleError">← 回到主页</a>
  </main>
</template>

<style>
html, body, #__nuxt { min-height: 100%; margin: 0; }
</style>

<style scoped>
.error-page {
  box-sizing: border-box;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  flex-direction: column;
  justify-content: center;
  padding: 32px clamp(20px, 5vw, 72px);
  color: #f2efe8;
  background: #0b0d0f;
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}
.code { color: #c9ff4a; font-size: 74px; font-weight: 850; line-height: 1; }
p { margin: 18px 0 28px; color: #98a19e; }
a { color: #c9ff4a; text-decoration: none; }
</style>
