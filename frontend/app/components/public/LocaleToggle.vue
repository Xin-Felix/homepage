<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'

// 语言切换是导航到带/不带 /en 前缀的同一页面；点击后记住选择，
// 供下次首访在根路径时按偏好跳转（见 locale-redirect 插件）。
const { locale, messages, alternatePath } = useLocale()

const label = computed(() => messages.value.header.langLabel)
const targetLabel = computed(() =>
  locale.value === 'en' ? messages.value.header.switchToZh : messages.value.header.switchToEn)

const persist = () => {
  try {
    localStorage.setItem('homepage.lang', locale.value === 'en' ? 'zh' : 'en')
  }
  catch {
    // 隐私模式或禁用存储时忽略，仍可正常切换。
  }
}
</script>

<template>
  <NuxtLink
    class="icon-button lang-toggle"
    :to="alternatePath"
    :aria-label="label"
    :title="label"
    :hreflang="locale === 'en' ? 'zh-CN' : 'en'"
    @click="persist"
  >
    <span class="lang-toggle-text">{{ targetLabel }}</span>
  </NuxtLink>
</template>
