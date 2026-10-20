<script setup lang="ts">
import type { PublicAiProjectSummary } from '~/types/public'
import SectionHeading from './SectionHeading.vue'
import TagList from './TagList.vue'

defineProps<{ projects: PublicAiProjectSummary[] }>()
</script>

<template>
  <section id="ai-lab" class="content-section section-anchor" aria-labelledby="ai-title">
    <SectionHeading number="04" kicker="AI LAB / 实验项目" title-id="ai-title">
      探索模型能力，<br><em>也关注它如何成为可靠系统。</em>
    </SectionHeading>
    <div class="ai-home-grid">
      <NuxtLink
        v-for="(project, index) in projects"
        :key="project.id"
        class="ai-home-card interactive-card reveal"
        :to="`/ai/${project.slug}`"
      >
        <div class="ai-card-top"><span>LAB_0{{ index + 1 }}</span><b>{{ project.status }}</b></div>
        <div class="ai-node" aria-hidden="true"><i /><i /><strong>AI</strong></div>
        <h3>{{ project.title }}</h3>
        <p>{{ project.summary }}</p>
        <TagList :tags="project.stack" />
      </NuxtLink>
    </div>
    <NuxtLink class="ai-all-link" to="/ai">查看全部 AI Lab 项目 ↗</NuxtLink>
  </section>
</template>
