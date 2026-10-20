<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import MarkdownContent from '~/components/public/MarkdownContent.vue'
import ScrollProgress from '~/components/public/ScrollProgress.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import type { PublicProjectPageData } from '~/types/public'

definePageMeta({ key: route => route.path })

const route = useRoute()
const slug = route.params.slug
if (!isPublicSlug(slug)) {
  throw createError({ statusCode: 404, message: '这个项目案例不存在或尚未发布。' })
}

const { data, error } = await usePublicPageData<PublicProjectPageData>(
  `public-project:${slug}`,
  `/api/page/projects/${encodeURIComponent(slug)}`,
)
const page = requirePublicPage(data, error, '这个项目案例不存在或尚未发布。')
const { p: profile, project } = page
const requestUrl = useRequestURL()
const canonical = new URL(`/projects/${project.slug}`, requestUrl.origin).toString()

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
    subtitle="PROJECT CASE"
    back-to="/#projects"
    back-label="← 返回项目"
  />
  <main class="detail-shell">
    <section class="detail-hero reveal is-visible">
      <div class="card-no">PROJECT CASE / {{ project.slug.toUpperCase() }}</div>
      <h1>{{ project.name }}</h1>
      <p>{{ project.description || '' }}</p>
      <dl class="detail-meta">
        <div v-if="project.role"><dt>我的角色</dt><dd>{{ project.role }}</dd></div>
        <div v-if="project.period"><dt>项目时间</dt><dd>{{ project.period }}</dd></div>
        <div><dt>技术标签</dt><dd>{{ project.meta.join(' · ') || '—' }}</dd></div>
      </dl>
      <a
        v-if="project.link"
        class="button button--primary"
        :href="project.link"
        target="_blank"
        rel="noopener"
      >查看代码 / 项目 ↗</a>
    </section>

    <MarkdownContent :html="page.contentHtml" />
    <nav class="detail-footer">
      <NuxtLink to="/#projects">← 返回全部项目</NuxtLink>
      <span>{{ page.views }} 次独立访问</span>
    </nav>
  </main>
  <SiteFooter :profile="profile" secondary="PROJECT CASE STUDY" />
</template>
