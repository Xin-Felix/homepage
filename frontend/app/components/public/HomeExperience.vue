<script setup lang="ts">
import type { PublicExperience } from '~/types/public'
import SectionHeading from './SectionHeading.vue'

defineProps<{ experiences: PublicExperience[] }>()
</script>

<template>
  <section id="experience" class="content-section section-anchor" aria-labelledby="experience-title">
    <SectionHeading number="02" kicker="JOURNEY / 工作经历" title-id="experience-title">
      一路构建，<br><em>一路把问题做深。</em>
    </SectionHeading>
    <div class="experience-list">
      <article
        v-for="(experience, index) in experiences"
        :key="experience.id"
        class="experience-card interactive-card reveal"
      >
        <div class="experience-index">0{{ index + 1 }}</div>
        <div class="experience-period">{{ experience.period }}</div>
        <div class="experience-role">
          <h3>{{ experience.role }}</h3>
          <p v-if="experience.org"><span>@</span> <b>{{ experience.org }}</b></p>
        </div>
        <p v-if="experience.description" class="experience-desc">{{ experience.description }}</p>
        <div class="experience-mark" aria-hidden="true"><span /><i /></div>
      </article>
    </div>
  </section>
</template>
