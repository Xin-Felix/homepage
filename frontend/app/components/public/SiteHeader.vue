<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '~/composables/useLocale'
import type { PublicProfile } from '~/types/public'
import LocaleToggle from './LocaleToggle.vue'
import SiteBrand from './SiteBrand.vue'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{
  profile: PublicProfile
  hasExperiences: boolean
  hasProjects: boolean
  hasAi: boolean
}>()

const route = useRoute()
const menuOpen = ref(false)
const { messages, localePath } = useLocale()
const t = computed(() => messages.value)

// 锚点链接在首页内滚动，其余链接带语言前缀。
const desktopLinks = computed(() => [
  ...(props.hasExperiences ? [{ to: '#experience', label: t.value.nav.experience }] : []),
  ...(props.hasProjects ? [{ to: '#projects', label: t.value.nav.projects }] : []),
  { to: '#about', label: t.value.nav.about },
  { to: localePath('/notes'), label: t.value.nav.notes },
  ...(props.hasAi ? [{ to: '#ai-lab', label: t.value.nav.aiLab }] : []),
  { to: '#contact', label: t.value.nav.contact },
])

const mobileLinks = computed(() => desktopLinks.value.map((link, index) => ({
  ...link,
  number: String(index + 1).padStart(2, '0'),
})))

const closeMenu = () => {
  menuOpen.value = false
}

const onResize = () => {
  if (window.innerWidth > 1080) closeMenu()
}

watch(menuOpen, (open) => {
  if (import.meta.client) document.body.classList.toggle('menu-open', open)
})
watch(() => route.fullPath, closeMenu)

onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  document.body.classList.remove('menu-open')
})
</script>

<template>
  <header class="header-shell">
    <nav class="topbar" :aria-label="t.header.primaryNav">
      <SiteBrand
        :name="profile.name"
        :subtitle="t.header.role"
        to="#top"
        :label="t.header.backToTop"
      />

      <div class="desktop-nav">
        <NuxtLink v-for="link in desktopLinks" :key="link.to" :to="link.to">
          {{ link.label }}
        </NuxtLink>
      </div>

      <div class="nav-actions">
        <span class="status-pill"><i aria-hidden="true" />{{ t.header.statusOpen }}</span>
        <LocaleToggle />
        <ThemeToggle />
        <button
          id="menu-toggle"
          class="icon-button menu-button"
          :class="{ 'is-open': menuOpen }"
          type="button"
          :aria-label="menuOpen ? t.header.closeMenu : t.header.openMenu"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          @click="menuOpen = !menuOpen"
        >
          <span />
          <span />
        </button>
      </div>
    </nav>

    <div id="mobile-menu" class="mobile-menu" :hidden="!menuOpen">
      <NuxtLink
        v-for="link in mobileLinks"
        :key="`${link.number}-${link.to}`"
        :to="link.to"
        @click="closeMenu"
      >
        <span>{{ link.number }}</span>{{ link.label }}
      </NuxtLink>
    </div>
  </header>
</template>
