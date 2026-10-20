<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import TagList from '~/components/public/TagList.vue'
import type { PublicNotesPageData } from '~/types/public'

const { data, error } = await usePublicPageData<PublicNotesPageData>('public-notes', '/api/page/notes')
const page = requirePublicPage(data, error, '你要找的页面不存在。')
const { p: profile, notes } = page
const description = '关于后端工程、系统迁移、实时风控与稳定性治理的技术笔记。'
const requestUrl = useRequestURL()

usePublicSeo({
  title: `技术笔记 · ${profile.name}`,
  description,
  path: '/notes',
  imagePath: '/og/notes.png',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '技术笔记',
    description,
    url: new URL('/notes', requestUrl.origin).toString(),
    author: { '@type': 'Person', name: profile.name },
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader
    :profile="profile"
    subtitle="ENGINEERING NOTES"
    back-to="/"
    back-label="← 回到主页"
  />
  <main class="notes-shell">
    <header class="notes-hero">
      <div class="card-no">ENGINEERING NOTES / 技术笔记</div>
      <h1>把做过的事，<br><em>沉淀成可以复用的方法。</em></h1>
      <p>记录系统设计、稳定性治理、迁移实践和持续学习。</p>
    </header>

    <section v-if="notes.length" class="notes-list" aria-label="技术笔记列表">
      <NuxtLink v-for="(note, index) in notes" :key="note.id" class="note-card" :to="`/notes/${note.slug}`">
        <span class="note-index">0{{ index + 1 }}</span>
        <div>
          <TagList :tags="note.tags" variant="note" />
          <h2>{{ note.title }}</h2>
          <p>{{ note.summary }}</p>
          <small>{{ publicDatePart(note.publishedAt) }} · 阅读 {{ note.readCount }}</small>
        </div>
        <i aria-hidden="true">↗</i>
      </NuxtLink>
    </section>
    <div v-else class="notes-empty">笔记正在整理中。</div>
  </main>
  <SiteFooter
    :profile="profile"
    :secondary="`${page.views} 次独立访问`"
    back-to="/"
    back-label="BACK HOME ↑"
  />
</template>
