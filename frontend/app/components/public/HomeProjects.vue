<script setup lang="ts">
import type { PublicProjectSummary } from '~/types/public'
import SectionHeading from './SectionHeading.vue'
import TagList from './TagList.vue'

defineProps<{ projects: PublicProjectSummary[] }>()

const cardClass = (index: number) => {
  if (index === 0) return 'project-card--feature project-card--lime'
  return index % 3 === 1 ? 'project-card--violet' : 'project-card--peach'
}
const hasInternalDetail = (project: PublicProjectSummary) => Boolean(project.detailPublished && project.slug)
const projectHref = (project: PublicProjectSummary) => hasInternalDetail(project)
  ? `/projects/${project.slug}`
  : project.link
</script>

<template>
  <section id="projects" class="content-section section-anchor" aria-labelledby="projects-title">
    <SectionHeading number="02" kicker="SELECTED WORK / 项目" title-id="projects-title">
      从想法到上线，<br><em>作品会替我继续说话。</em>
    </SectionHeading>
    <div class="project-grid">
      <article
        v-for="(project, index) in projects"
        :key="project.id"
        class="project-card interactive-card reveal"
        :class="cardClass(index)"
      >
        <div class="project-visual" aria-hidden="true">
          <div class="visual-toolbar"><i /><i /><i /><span>PROJECT_0{{ index + 1 }}</span></div>
          <div class="visual-stage">
            <div class="visual-grid" />
            <div class="visual-window">
              <span /><span /><span />
              <div class="visual-code"><i /><i /><i /><i /></div>
            </div>
            <div class="project-glyph">{{ project.name.slice(0, 1) }}</div>
            <div class="visual-pulse" />
          </div>
        </div>
        <div class="project-copy">
          <div class="project-meta-top"><span>CASE / 0{{ index + 1 }}</span><span v-if="index === 0">FEATURED</span></div>
          <h3>{{ project.name }}</h3>
          <p v-if="project.description">{{ project.description }}</p>
          <TagList v-if="project.meta.length" :tags="project.meta" />
          <NuxtLink v-if="hasInternalDetail(project)" class="project-link" :to="projectHref(project) || '/'">
            <span>阅读案例</span><i aria-hidden="true">↗</i>
          </NuxtLink>
          <a
            v-else-if="projectHref(project)"
            class="project-link"
            :href="projectHref(project) || undefined"
            target="_blank"
            rel="noopener"
          ><span>查看项目</span><i aria-hidden="true">↗</i></a>
        </div>
      </article>
    </div>
  </section>
</template>
