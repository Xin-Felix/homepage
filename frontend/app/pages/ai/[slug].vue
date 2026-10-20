<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import MarkdownContent from '~/components/public/MarkdownContent.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import type { PublicAiDetailPageData } from '~/types/public'

definePageMeta({ key: route => route.path })

const route = useRoute()
const slug = route.params.slug
if (!isPublicSlug(slug)) {
  throw createError({ statusCode: 404, message: '这个 AI 项目不存在或尚未发布。' })
}

const { data, error } = await usePublicPageData<PublicAiDetailPageData>(
  `public-ai-detail:${slug}`,
  `/api/page/ai/${encodeURIComponent(slug)}`,
)
const page = requirePublicPage(data, error, '这个 AI 项目不存在或尚未发布。')
const { p: profile, project } = page
const requestUrl = useRequestURL()

usePublicSeo({
  title: `${project.title} · AI Lab · ${profile.name}`,
  description: project.summary,
  path: `/ai/${project.slug}`,
  imagePath: `/og/ai/${project.slug}.png`,
  type: 'article',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.summary,
    url: new URL(`/ai/${project.slug}`, requestUrl.origin).toString(),
    applicationCategory: 'DeveloperApplication',
    author: { '@type': 'Person', name: profile.name },
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader :profile="profile" subtitle="AI LAB" back-to="/ai" back-label="← AI Lab" />
  <main class="detail-shell">
    <section class="detail-hero ai-detail-hero">
      <div class="ai-card-top"><span>AI EXPERIMENT / {{ project.slug.toUpperCase() }}</span><b>{{ project.status }}</b></div>
      <h1>{{ project.title }}</h1>
      <p>{{ project.summary }}</p>
      <dl class="detail-meta">
        <div v-if="project.models"><dt>模型 / 服务</dt><dd>{{ project.models }}</dd></div>
        <div><dt>技术栈</dt><dd>{{ project.stack.join(' · ') || '—' }}</dd></div>
        <div><dt>状态</dt><dd>{{ project.status }}</dd></div>
      </dl>
      <div class="hero-actions">
        <a
          v-if="project.demoUrl"
          class="button button--primary"
          :href="project.demoUrl"
          target="_blank"
          rel="noopener"
        >在线体验 ↗</a>
        <a
          v-if="project.repoUrl"
          class="button button--ghost"
          :href="project.repoUrl"
          target="_blank"
          rel="noopener"
        >代码仓库 ↗</a>
      </div>
    </section>
    <MarkdownContent :html="page.contentHtml" />
    <nav class="detail-footer">
      <NuxtLink to="/ai">← 返回 AI Lab</NuxtLink>
      <span>{{ page.views }} 次独立访问</span>
    </nav>
  </main>
  <SiteFooter :profile="profile" secondary="AI LAB" />
</template>
