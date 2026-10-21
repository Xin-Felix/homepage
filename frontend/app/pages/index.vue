<script setup lang="ts">
import { ref } from 'vue'
import ContactDialog from '~/components/public/ContactDialog.vue'
import HomeAbout from '~/components/public/HomeAbout.vue'
import HomeAiLab from '~/components/public/HomeAiLab.vue'
import HomeContact from '~/components/public/HomeContact.vue'
import HomeExperience from '~/components/public/HomeExperience.vue'
import HomeHero from '~/components/public/HomeHero.vue'
import HomeProjects from '~/components/public/HomeProjects.vue'
import ScrollProgress from '~/components/public/ScrollProgress.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import SiteHeader from '~/components/public/SiteHeader.vue'
import type { PublicHomePageData } from '~/types/public'

// 兼容旧公开入口；主 canonical 始终保持为根路径。
definePageMeta({ alias: ['/index', '/index.html'] })

const { data, error } = await usePublicPageData<PublicHomePageData>('public-home', '/api/page/home')
const page = requirePublicPage(data, error, '你要找的页面不存在。')
const site = page.site
const profile = site.profile
const aiProjects = site.aiProjects || []
const contactDialog = ref<InstanceType<typeof ContactDialog> | null>(null)
const requestUrl = useRequestURL()
const homeUrl = new URL('/', requestUrl.origin).toString()

usePublicSeo({
  title: profile.siteTitle,
  description: profile.description || '',
  keywords: profile.keywords,
  path: '/',
  imagePath: '/og/home.png',
  provided: page.seo,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: homeUrl,
    jobTitle: 'Java 后端工程师',
    sameAs: site.contacts.map(item => item.href).filter(href => href?.startsWith('http')),
    knowsAbout: profile.tags,
  },
})
usePublicInteractions()

const openContact = () => contactDialog.value?.open()
</script>

<template>
  <ScrollProgress />
  <div class="page-glow" aria-hidden="true" />
  <SiteHeader
    :profile="profile"
    :has-experiences="site.experiences.length > 0"
    :has-projects="site.projects.length > 0"
    :has-ai="aiProjects.length > 0"
  />

  <main class="site-shell">
    <HomeHero
      :profile="profile"
      :project-count="site.projects.length"
      :views="page.views"
      :has-experiences="site.experiences.length > 0"
      @open-contact="openContact"
    />
    <HomeExperience v-if="site.experiences.length" :experiences="site.experiences" />
    <HomeProjects v-if="site.projects.length" :projects="site.projects" />
    <HomeAbout :profile="profile" />
    <HomeAiLab v-if="aiProjects.length" :projects="aiProjects" />
    <HomeContact
      :contacts="site.contacts"
      :message-enabled="profile.messageEnabled"
      :has-ai="aiProjects.length > 0"
      @open-contact="openContact"
    />
  </main>

  <SiteFooter :profile="profile" secondary="DESIGNED TO LAST · BUILT WITH JAVA" />
  <ContactDialog v-if="profile.messageEnabled" ref="contactDialog" />
</template>
