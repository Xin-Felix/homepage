<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import TagList from '~/components/public/TagList.vue'
import type { PublicAiPageData } from '~/types/public'

const { messages, localePath } = useLocale()
const t = computed(() => messages.value)

// 无公开 AI 项目时，页面 BFF 会直接返回 404，本页不伪造空状态。
const { data, error } = await usePublicPageData<PublicAiPageData>('public-ai', '/api/page/ai')
const page = requirePublicPage(data, error, t.value.errors.notFound)
const { p: profile, projects } = page
const description = computed(() => t.value.ai.description)
const requestUrl = useRequestURL()

usePublicSeo({
  title: `${t.value.ai.title} · ${profile.name}`,
  description: description.value,
  path: '/ai',
  imagePath: '/og/ai.png',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.value.ai.title,
    description: description.value,
    url: new URL(localePath('/ai'), requestUrl.origin).toString(),
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader :profile="profile" :subtitle="t.ai.subtitle" :back-to="localePath('/')" :back-label="t.ai.backHome" />
  <main class="notes-shell">
    <header class="notes-hero ai-list-hero">
      <div class="card-no">AI LAB / EXPERIMENTS</div>
      <h1>{{ t.ai.heroLead }}<br><em>{{ t.ai.heroEmphasis }}</em></h1>
      <p>{{ t.ai.heroDesc }}</p>
    </header>
    <section class="ai-list" :aria-label="t.ai.listLabel">
      <NuxtLink
        v-for="(project, index) in projects"
        :key="project.id"
        class="ai-list-card"
        :to="localePath(`/ai/${project.slug}`)"
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
    :secondary="t.project.uniqueVisits(page.views)"
    :back-to="localePath('/')"
    :back-label="t.ai.backHomeUp"
  />
</template>
