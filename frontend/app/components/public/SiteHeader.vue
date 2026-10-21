<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PublicProfile } from '~/types/public'
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

const desktopLinks = computed(() => [
  ...(props.hasExperiences ? [{ to: '#experience', label: '经历' }] : []),
  ...(props.hasProjects ? [{ to: '#projects', label: '项目' }] : []),
  { to: '#about', label: '关于' },
  { to: '/notes', label: '笔记' },
  ...(props.hasAi ? [{ to: '#ai-lab', label: 'AI Lab' }] : []),
  { to: '#contact', label: '联系' },
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
    <nav class="topbar" aria-label="主导航">
      <SiteBrand
        :name="profile.name"
        subtitle="BACKEND ENGINEER"
        to="#top"
        label="回到页面顶部"
      />

      <div class="desktop-nav">
        <NuxtLink v-for="link in desktopLinks" :key="link.to" :to="link.to">
          {{ link.label }}
        </NuxtLink>
      </div>

      <div class="nav-actions">
        <span class="status-pill"><i aria-hidden="true" />开放合适机会</span>
        <ThemeToggle />
        <button
          id="menu-toggle"
          class="icon-button menu-button"
          :class="{ 'is-open': menuOpen }"
          type="button"
          :aria-label="menuOpen ? '关闭导航菜单' : '打开导航菜单'"
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
