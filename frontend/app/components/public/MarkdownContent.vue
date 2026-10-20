<script setup lang="ts">
defineProps<{ html: string }>()
</script>

<template>
  <!-- 仅接收页面 BFF 在服务端完成 Markdown 解析及白名单清洗后的 contentHtml。 -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <article class="markdown-body" v-html="html" />
</template>
