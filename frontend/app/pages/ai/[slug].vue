<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import MarkdownContent from '~/components/public/MarkdownContent.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import type { PublicAiDetailPageData } from '~/types/public'

definePageMeta({ key: route => route.path })

const { messages, localePath, isEnglish } = useLocale()
const t = computed(() => messages.value)
const aiCopy = computed(() => isEnglish.value
  ? { models: 'Models / Services', stack: 'Tech', status: 'Status', demo: 'Live demo', repo: 'Repository', back: '← Back to AI Lab' }
  : { models: '模型 / 服务', stack: '技术栈', status: '状态', demo: '在线体验', repo: '代码仓库', back: '← 返回 AI Lab' })

const route = useRoute()
const slug = route.params.slug
if (!isPublicSlug(slug)) {
  throw createError({ statusCode: 404, message: t.value.errors.aiNotFound })
}

const { data, error } = await usePublicPageData<PublicAiDetailPageData>(
  `public-ai-detail:${slug}`,
  `/api/page/ai/${encodeURIComponent(slug)}`,
)
const page = requirePublicPage(data, error, t.value.errors.aiNotFound)
const { p: profile, project } = page
const requestUrl = useRequestURL()

usePublicSeo({
  title: `${project.title} · ${t.value.ai.title} · ${profile.name}`,
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
    url: new URL(localePath(`/ai/${project.slug}`), requestUrl.origin).toString(),
    applicationCategory: 'DeveloperApplication',
    author: { '@type': 'Person', name: profile.name },
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader :profile="profile" :subtitle="t.ai.subtitle" :back-to="localePath('/ai')" back-label="← AI Lab" />
  <main class="detail-shell">
    <section class="detail-hero ai-detail-hero">
      <div class="ai-card-top"><span>AI EXPERIMENT / {{ project.slug.toUpperCase() }}</span><b>{{ project.status }}</b></div>
      <h1>{{ project.title }}</h1>
      <p>{{ project.summary }}</p>
      <dl class="detail-meta">
        <div v-if="project.models"><dt>{{ aiCopy.models }}</dt><dd>{{ project.models }}</dd></div>
        <div><dt>{{ aiCopy.stack }}</dt><dd>{{ project.stack.join(' · ') || '—' }}</dd></div>
        <div><dt>{{ aiCopy.status }}</dt><dd>{{ project.status }}</dd></div>
      </dl>
      <div class="hero-actions">
        <a
          v-if="project.demoUrl"
          class="button button--primary"
          :href="project.demoUrl"
          target="_blank"
          rel="noopener"
        >{{ aiCopy.demo }} ↗</a>
        <a
          v-if="project.repoUrl"
          class="button button--ghost"
          :href="project.repoUrl"
          target="_blank"
          rel="noopener"
        >{{ aiCopy.repo }} ↗</a>
      </div>
    </section>
    <MarkdownContent :html="page.contentHtml" />
    <nav class="detail-footer">
      <NuxtLink :to="localePath('/ai')">{{ aiCopy.back }}</NuxtLink>
      <span>{{ t.project.uniqueVisits(page.views) }}</span>
    </nav>
  </main>
  <SiteFooter :profile="profile" :secondary="t.ai.subtitle" />
</template>
