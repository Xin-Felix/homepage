<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import TagList from '~/components/public/TagList.vue'
import type { PublicAiPageData } from '~/types/public'

// 无公开 AI 项目时，页面 BFF 会直接返回 404，本页不伪造空状态。
const { data, error } = await usePublicPageData<PublicAiPageData>('public-ai', '/api/page/ai')
const page = requirePublicPage(data, error, '你要找的页面不存在。')
const { p: profile, projects } = page
const description = 'AI、Agent、RAG、MCP 与模型工程实验项目。'
const requestUrl = useRequestURL()

usePublicSeo({
  title: `AI Lab · ${profile.name}`,
  description,
  path: '/ai',
  imagePath: '/og/ai.png',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Lab',
    description,
    url: new URL('/ai', requestUrl.origin).toString(),
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader :profile="profile" subtitle="AI LAB" back-to="/" back-label="← 回到主页" />
  <main class="notes-shell">
    <header class="notes-hero ai-list-hero">
      <div class="card-no">AI LAB / EXPERIMENTS</div>
      <h1>从实验出发，<br><em>把模型接进真实工程。</em></h1>
      <p>记录 AI 应用、Agent、RAG、MCP 和评测实践。</p>
    </header>
    <section class="ai-list" aria-label="AI Lab 项目列表">
      <NuxtLink
        v-for="(project, index) in projects"
        :key="project.id"
        class="ai-list-card"
        :to="`/ai/${project.slug}`"
      >
        <div class="ai-card-top"><span>EXPERIMENT_0{{ index + 1 }}</span><b>{{ project.status }}</b></div>
        <div class="ai-node" aria-hidden="true"><i /><i /><strong>AI</strong></div>
        <h2>{{ project.title }}</h2>
        <p>{{ project.summary }}</p>
        <TagList :tags="project.models ? [project.models, ...project.stack] : project.stack" />
      </NuxtLink>
    </section>
  </main>
  <SiteFooter
    :profile="profile"
    :secondary="`${page.views} 次独立访问`"
    back-to="/"
    back-label="BACK HOME ↑"
  />
</template>
