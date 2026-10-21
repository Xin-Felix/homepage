<script setup lang="ts">
import type { PublicProfile } from '~/types/public'

const props = defineProps<{
  profile: PublicProfile
  projectCount: number
  views: number
  hasExperiences: boolean
}>()

const emit = defineEmits<{ openContact: [] }>()
const year = usePublicYear()
const primaryTarget = computed(() => props.hasExperiences
  ? '#experience'
  : (props.projectCount > 0 ? '#projects' : '#contact'))
</script>

<template>
  <section id="top" class="hero-grid section-anchor" aria-labelledby="hero-title">
    <div class="hero-intro">
      <div class="hero-kicker">
        <span>PORTFOLIO / {{ year }}</span>
        <span class="hero-availability"><i aria-hidden="true" />开放合适机会</span>
      </div>
      <p class="hero-role">JAVA BACKEND ENGINEER · HANGZHOU</p>
      <h1 id="hero-title">
        <span class="hero-greeting">{{ profile.greeting || '你好，我是' }} {{ profile.name }}</span>
        <span>让复杂系统保持可靠与清晰。</span>
      </h1>
      <p class="hero-summary">{{ profile.intro }}</p>
      <div class="hero-actions">
        <NuxtLink class="button button--primary" :to="primaryTarget">
          {{ hasExperiences ? '查看经历' : '查看项目' }} <span aria-hidden="true">↓</span>
        </NuxtLink>
        <button
          v-if="profile.messageEnabled"
          class="button button--ghost"
          type="button"
          @click="emit('openContact')"
        >联系我 <span aria-hidden="true">↗</span></button>
        <NuxtLink v-else class="button button--ghost" to="#contact">联系方式 <span aria-hidden="true">↗</span></NuxtLink>
      </div>
    </div>

    <aside class="hero-profile" aria-label="职业摘要">
      <div class="hero-profile-head"><span>PROFILE</span><span>CN / HZ</span></div>
      <dl>
        <div><dt>角色</dt><dd>Java 后端工程师</dd></div>
        <div><dt>经验</dt><dd>4+ 年核心系统研发</dd></div>
        <div><dt>关注</dt><dd>系统迁移、实时风控、稳定性</dd></div>
        <div><dt>所在地</dt><dd>杭州</dd></div>
      </dl>
      <div class="hero-metrics">
        <span><strong>{{ projectCount }}</strong> 个公开项目</span>
        <span><strong>{{ views }}</strong> 次独立访问</span>
      </div>
    </aside>

    <div v-if="profile.tags.length" class="hero-stack" aria-label="技术栈">
      <span class="hero-stack-label">CORE STACK</span>
      <ul>
        <li v-for="(tag, index) in profile.tags" :key="`stack-${index}-${tag}`">{{ tag }}</li>
      </ul>
    </div>
  </section>
</template>
