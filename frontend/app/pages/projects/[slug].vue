<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import MarkdownContent from '~/components/public/MarkdownContent.vue'
import ScrollProgress from '~/components/public/ScrollProgress.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import type { PublicProjectPageData } from '~/types/public'

definePageMeta({ key: route => route.path })

const { messages, localePath } = useLocale()
const t = computed(() => messages.value)

const route = useRoute()
const slug = route.params.slug
if (!isPublicSlug(slug)) {
  throw createError({ statusCode: 404, message: t.value.errors.projectNotFound })
}

const { data, error } = await usePublicPageData<PublicProjectPageData>(
  `public-project:${slug}`,
  `/api/page/projects/${encodeURIComponent(slug)}`,
)
const page = requirePublicPage(data, error, t.value.errors.projectNotFound)
const { p: profile, project } = page
const requestUrl = useRequestURL()
const canonical = new URL(localePath(`/projects/${project.slug}`), requestUrl.origin).toString()

usePublicSeo({
  title: `${project.name} · ${profile.name}`,
  description: project.description || project.name,
  path: `/projects/${project.slug}`,
  imagePath: `/og/project/${project.slug}.png`,
  type: 'article',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.name,
    description: project.description,
    url: canonical,
    author: { '@type': 'Person', name: profile.name },
    keywords: project.meta.join(', '),
  },
})
usePublicInteractions()
</script>

<template>
  <ScrollProgress />
  <DetailHeader
    :profile="profile"
    :subtitle="t.project.caseKicker"
    :back-to="localePath('/') + '#projects'"
    :back-label="t.project.backToProjects"
  />
  <main class="detail-shell">
    <section class="detail-hero reveal is-visible">
      <div class="card-no">PROJECT CASE / {{ project.slug.toUpperCase() }}</div>
      <h1>{{ project.name }}</h1>
      <p>{{ project.description || '' }}</p>
      <dl class="detail-meta">
        <div v-if="project.role"><dt>{{ t.project.myRole }}</dt><dd>{{ project.role }}</dd></div>
        <div v-if="project.period"><dt>{{ t.project.period }}</dt><dd>{{ project.period }}</dd></div>
        <div><dt>{{ t.project.techTags }}</dt><dd>{{ project.meta.join(' · ') || '—' }}</dd></div>
      </dl>
      <a
        v-if="project.link"
        class="button button--primary"
        :href="project.link"
        target="_blank"
        rel="noopener"
      >{{ t.project.viewCode }}</a>
    </section>

    <MarkdownContent :html="page.contentHtml" />
    <nav class="detail-footer">
      <NuxtLink :to="localePath('/') + '#projects'">{{ t.project.backToAllProjects }}</NuxtLink>
      <span>{{ t.project.uniqueVisits(page.views) }}</span>
    </nav>
  </main>
  <SiteFooter :profile="profile" :secondary="t.project.caseStudy" />
</template>
