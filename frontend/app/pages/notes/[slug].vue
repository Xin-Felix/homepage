<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import MarkdownContent from '~/components/public/MarkdownContent.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import TagList from '~/components/public/TagList.vue'
import type { PublicNotePageData } from '~/types/public'

definePageMeta({ key: route => route.path })

const route = useRoute()
const slug = route.params.slug
if (!isPublicSlug(slug)) {
  throw createError({ statusCode: 404, message: '这篇技术笔记不存在或尚未发布。' })
}

const { data, error } = await usePublicPageData<PublicNotePageData>(
  `public-note:${slug}`,
  `/api/page/notes/${encodeURIComponent(slug)}`,
)
const page = requirePublicPage(data, error, '这篇技术笔记不存在或尚未发布。')
const { p: profile, note } = page
const requestUrl = useRequestURL()

usePublicSeo({
  title: `${note.title} · ${profile.name}`,
  description: note.summary,
  path: `/notes/${note.slug}`,
  imagePath: `/og/note/${note.slug}.png`,
  type: 'article',
  provided: page.seo,
  publishedTime: note.publishedAt,
  modifiedTime: note.updatedAt,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: note.title,
    description: note.summary,
    url: new URL(`/notes/${note.slug}`, requestUrl.origin).toString(),
    datePublished: note.publishedAt,
    dateModified: note.updatedAt,
    author: { '@type': 'Person', name: profile.name },
    keywords: note.tags.join(', '),
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader
    :profile="profile"
    subtitle="ENGINEERING NOTE"
    back-to="/notes"
    back-label="← 全部笔记"
  />
  <main class="detail-shell note-detail">
    <header class="detail-hero">
      <TagList :tags="note.tags" variant="note" />
      <h1>{{ note.title }}</h1>
      <p>{{ note.summary }}</p>
      <div class="note-byline">
        <span>发布于 {{ formatPublicDate(note.publishedAt) }}</span>
        <span>更新于 {{ formatPublicDate(note.updatedAt) }}</span>
        <span>阅读 {{ note.readCount }}</span>
      </div>
    </header>
    <MarkdownContent :html="page.contentHtml" />
    <nav class="detail-footer">
      <NuxtLink to="/notes">← 返回技术笔记</NuxtLink>
      <span>{{ page.views }} 次独立访问</span>
    </nav>
  </main>
  <SiteFooter :profile="profile" secondary="ENGINEERING NOTES" />
</template>
