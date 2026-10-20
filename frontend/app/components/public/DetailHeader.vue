<script setup lang="ts">
import type { PublicProfile } from '~/types/public'
import SiteBrand from './SiteBrand.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{
  profile: PublicProfile
  subtitle: string
  backTo: string
  backLabel: string
}>()
</script>

<template>
  <header class="detail-header">
    <SiteBrand :name="profile.name" :subtitle="subtitle" />
    <div class="detail-actions">
      <NuxtLink class="button button--ghost" :to="backTo">{{ backLabel }}</NuxtLink>
      <ThemeToggle />
    </div>
  </header>
</template>
