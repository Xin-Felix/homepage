<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'
import type { PublicProjectSummary } from '~/types/public'
import SectionHeading from './SectionHeading.vue'
import TagList from './TagList.vue'

defineProps<{ projects: PublicProjectSummary[] }>()
const { isEnglish, localePath } = useLocale()
const kicker = computed(() => (isEnglish.value ? 'SELECTED WORK / PROJECTS' : 'SELECTED WORK / 项目'))
const readCase = computed(() => (isEnglish.value ? 'Read case study' : '阅读案例'))
const viewProject = computed(() => (isEnglish.value ? 'View project' : '查看项目'))

const cardClass = (index: number) => {
  if (index === 0) return 'project-card--feature project-card--lime'
  return index % 3 === 1 ? 'project-card--violet' : 'project-card--peach'
}
const hasInternalDetail = (project: PublicProjectSummary) => Boolean(project.detailPublished && project.slug)
// 站内详情链接带语言前缀；外部链接保持原样。
const projectHref = (project: PublicProjectSummary) => hasInternalDetail(project)
  ? localePath(`/projects/${project.slug}`)
  : project.link
</script>

<template>
  <section id="projects" class="content-section section-anchor" aria-labelledby="projects-title">
    <SectionHeading number="02" :kicker="kicker" title-id="projects-title">
      <template v-if="isEnglish">From idea to launch,<br><em>the work speaks for me.</em></template>
      <template v-else>从想法到上线，<br><em>作品会替我继续说话。</em></template>
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
            <span>{{ readCase }}</span><i aria-hidden="true">↗</i>
          </NuxtLink>
          <a
            v-else-if="projectHref(project)"
            class="project-link"
            :href="projectHref(project) || undefined"
            target="_blank"
            rel="noopener"
          ><span>{{ viewProject }}</span><i aria-hidden="true">↗</i></a>
        </div>
      </article>
    </div>
  </section>
</template>
