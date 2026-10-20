<script setup lang="ts">
import type { PublicProfile } from '~/types/public'

withDefaults(defineProps<{
  profile: PublicProfile
  secondary: string
  backTo?: string
  backLabel?: string
}>(), {
  backTo: '#top',
  backLabel: 'BACK TO TOP ↑',
})

const year = usePublicYear()
</script>

<template>
  <footer class="footer">
    <div>
      <span>© {{ year }} {{ profile.footerText || '' }}</span>
      <span>{{ secondary }}</span>
    </div>
    <NuxtLink :to="backTo">{{ backLabel }}</NuxtLink>
  </footer>
</template>
