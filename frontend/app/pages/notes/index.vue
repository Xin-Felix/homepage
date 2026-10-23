<script setup lang="ts">
import DetailHeader from '~/components/public/DetailHeader.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import TagList from '~/components/public/TagList.vue'
import type { PublicNotesPageData } from '~/types/public'

const { messages, localePath, isEnglish } = useLocale()
const t = computed(() => messages.value)
const nc = computed(() => isEnglish.value
  ? {
      kicker: 'ENGINEERING NOTES',
      heroLead: 'Turning what I\u2019ve done',
      heroEmphasis: 'into reusable methods.',
      heroDesc: 'Notes on system design, reliability, migration practice and continuous learning.',
      listLabel: 'Notes list',
      readPrefix: 'reads',
      empty: 'Notes are being organized.',
    }
  : {
      kicker: 'ENGINEERING NOTES / 技术笔记',
      heroLead: '把做过的事，',
      heroEmphasis: '沉淀成可以复用的方法。',
      heroDesc: '记录系统设计、稳定性治理、迁移实践和持续学习。',
      listLabel: '技术笔记列表',
      readPrefix: '阅读',
      empty: '笔记正在整理中。',
    })

const { data, error } = await usePublicPageData<PublicNotesPageData>('public-notes', '/api/page/notes')
const page = requirePublicPage(data, error, t.value.errors.notFound)
const { p: profile, notes } = page
const description = computed(() => t.value.notes.description)
const requestUrl = useRequestURL()

usePublicSeo({
  title: `${t.value.notes.title} · ${profile.name}`,
  description: description.value,
  path: '/notes',
  imagePath: '/og/notes.png',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.value.notes.title,
    description: description.value,
    url: new URL(localePath('/notes'), requestUrl.origin).toString(),
    author: { '@type': 'Person', name: profile.name },
  },
})
usePublicInteractions()
</script>

<template>
  <DetailHeader
    :profile="profile"
    subtitle="ENGINEERING NOTES"
    :back-to="localePath('/')"
    :back-label="t.notes.backHome"
  />
  <main class="notes-shell">
    <header class="notes-hero">
      <div class="card-no">{{ nc.kicker }}</div>
      <h1>{{ nc.heroLead }}<br><em>{{ nc.heroEmphasis }}</em></h1>
      <p>{{ nc.heroDesc }}</p>
    </header>

    <section v-if="notes.length" class="notes-list" :aria-label="nc.listLabel">
      <NuxtLink v-for="(note, index) in notes" :key="note.id" class="note-card" :to="localePath(`/notes/${note.slug}`)">
        <span class="note-index">0{{ index + 1 }}</span>
        <div>
          <TagList :tags="note.tags" variant="note" />
          <h2>{{ note.title }}</h2>
          <p>{{ note.summary }}</p>
          <small>{{ publicDatePart(note.publishedAt) }} · {{ nc.readPrefix }} {{ note.readCount }}</small>
        </div>
        <i aria-hidden="true">↗</i>
      </NuxtLink>
    </section>
    <div v-else class="notes-empty">{{ nc.empty }}</div>
  </main>
  <SiteFooter
    :profile="profile"
    :secondary="t.project.uniqueVisits(page.views)"
    :back-to="localePath('/')"
    :back-label="t.ai.backHomeUp"
  />
</template>
