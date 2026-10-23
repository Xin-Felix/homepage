<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import MarkdownContent from '~/components/public/MarkdownContent.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import TagList from '~/components/public/TagList.vue'
import type { PublicNotePageData } from '~/types/public'

definePageMeta({ key: route => route.path })

const { messages, localePath, isEnglish } = useLocale()
const t = computed(() => messages.value)
const dc = computed(() => isEnglish.value
  ? { back: '← All notes', publishedAt: 'Published', updatedAt: 'Updated', reads: 'reads', backList: '← Back to notes' }
  : { back: '← 全部笔记', publishedAt: '发布于', updatedAt: '更新于', reads: '阅读', backList: '← 返回技术笔记' })

const route = useRoute()
const slug = route.params.slug
if (!isPublicSlug(slug)) {
  throw createError({ statusCode: 404, message: t.value.errors.noteNotFound })
}

const { data, error } = await usePublicPageData<PublicNotePageData>(
  `public-note:${slug}`,
  `/api/page/notes/${encodeURIComponent(slug)}`,
)
const page = requirePublicPage(data, error, t.value.errors.noteNotFound)
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
    url: new URL(localePath(`/notes/${note.slug}`), requestUrl.origin).toString(),
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
    :back-to="localePath('/notes')"
    :back-label="dc.back"
  />
  <main class="detail-shell note-detail">
    <header class="detail-hero">
      <TagList :tags="note.tags" variant="note" />
      <h1>{{ note.title }}</h1>
      <p>{{ note.summary }}</p>
      <div class="note-byline">
        <span>{{ dc.publishedAt }} {{ formatPublicDate(note.publishedAt) }}</span>
        <span>{{ dc.updatedAt }} {{ formatPublicDate(note.updatedAt) }}</span>
        <span>{{ dc.reads }} {{ note.readCount }}</span>
      </div>
    </header>
    <MarkdownContent :html="page.contentHtml" />
    <nav class="detail-footer">
      <NuxtLink :to="localePath('/notes')">{{ dc.backList }}</NuxtLink>
      <span>{{ t.project.uniqueVisits(page.views) }}</span>
    </nav>
  </main>
  <SiteFooter :profile="profile" secondary="ENGINEERING NOTES" />
</template>
