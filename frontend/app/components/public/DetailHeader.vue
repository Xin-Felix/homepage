<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'
import type { PublicProfile } from '~/types/public'
import LocaleToggle from './LocaleToggle.vue'
import SiteBrand from './SiteBrand.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{
  profile: PublicProfile
  subtitle: string
  backTo: string
  backLabel: string
}>()

const { messages, localePath } = useLocale()
const homeLabel = computed(() => messages.value.header.backToTop)
</script>

<template>
  <header class="detail-header">
    <SiteBrand :name="profile.name" :subtitle="subtitle" :to="localePath('/')" :label="homeLabel" />
    <div class="detail-actions">
      <NuxtLink class="button button--ghost" :to="backTo">{{ backLabel }}</NuxtLink>
      <LocaleToggle />
      <ThemeToggle />
    </div>
  </header>
</template>
