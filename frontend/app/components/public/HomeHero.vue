<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'
import type { PublicProfile } from '~/types/public'

const props = defineProps<{
  profile: PublicProfile
  projectCount: number
  views: number
  hasExperiences: boolean
}>()

const emit = defineEmits<{ openContact: [] }>()
const year = usePublicYear()
const { messages, isEnglish } = useLocale()
const t = computed(() => messages.value)

const primaryTarget = computed(() => props.hasExperiences
  ? '#experience'
  : (props.projectCount > 0 ? '#projects' : '#contact'))

// Hero 右侧职业摘要的固定文案（装饰性，不来自后台）。
const copy = computed(() => isEnglish.value
  ? {
      heroTitle: 'Keeping complex systems reliable and clear.',
      viewExperience: 'View experience',
      viewProjects: 'View projects',
      contactMe: 'Contact me',
      contactWay: 'Contact',
      profileSummary: 'Professional summary',
      stackLabel: 'Tech stack',
      role: 'Role',
      roleValue: 'Java Backend Engineer',
      exp: 'Experience',
      expValue: '4+ yrs on core systems',
      focus: 'Focus',
      focusValue: 'Migration, risk control, reliability',
      location: 'Location',
      locationValue: 'Hangzhou, China',
      publicProjects: 'public projects',
      uniqueVisits: 'unique visits',
      defaultGreeting: 'Hi, I\u2019m',
    }
  : {
      heroTitle: '让复杂系统保持可靠与清晰。',
      viewExperience: '查看经历',
      viewProjects: '查看项目',
      contactMe: '联系我',
      contactWay: '联系方式',
      profileSummary: '职业摘要',
      stackLabel: '技术栈',
      role: '角色',
      roleValue: 'Java 后端工程师',
      exp: '经验',
      expValue: '4+ 年核心系统研发',
      focus: '关注',
      focusValue: '系统迁移、实时风控、稳定性',
      location: '所在地',
      locationValue: '杭州',
      publicProjects: '个公开项目',
      uniqueVisits: '次独立访问',
      defaultGreeting: '你好，我是',
    })
</script>

<template>
  <section id="top" class="hero-grid section-anchor" aria-labelledby="hero-title">
    <div class="hero-intro">
      <div class="hero-kicker">
        <span>PORTFOLIO / {{ year }}</span>
        <span class="hero-availability"><i aria-hidden="true" />{{ t.header.statusOpen }}</span>
      </div>
      <p class="hero-role">JAVA BACKEND ENGINEER · HANGZHOU</p>
      <h1 id="hero-title">
        <span class="hero-greeting">{{ profile.greeting || copy.defaultGreeting }} {{ profile.name }}</span>
        <span>{{ copy.heroTitle }}</span>
      </h1>
      <p class="hero-summary">{{ profile.intro }}</p>
      <div class="hero-actions">
        <NuxtLink class="button button--primary" :to="primaryTarget">
          {{ hasExperiences ? copy.viewExperience : copy.viewProjects }} <span aria-hidden="true">↓</span>
        </NuxtLink>
        <button
          v-if="profile.messageEnabled"
          class="button button--ghost"
          type="button"
          @click="emit('openContact')"
        >{{ copy.contactMe }} <span aria-hidden="true">↗</span></button>
        <NuxtLink v-else class="button button--ghost" to="#contact">{{ copy.contactWay }} <span aria-hidden="true">↗</span></NuxtLink>
      </div>
    </div>

    <aside class="hero-profile" :aria-label="copy.profileSummary">
      <div class="hero-profile-head"><span>PROFILE</span><span>CN / HZ</span></div>
      <dl>
        <div><dt>{{ copy.role }}</dt><dd>{{ copy.roleValue }}</dd></div>
        <div><dt>{{ copy.exp }}</dt><dd>{{ copy.expValue }}</dd></div>
        <div><dt>{{ copy.focus }}</dt><dd>{{ copy.focusValue }}</dd></div>
        <div><dt>{{ copy.location }}</dt><dd>{{ copy.locationValue }}</dd></div>
      </dl>
      <div class="hero-metrics">
        <span><strong>{{ projectCount }}</strong> {{ copy.publicProjects }}</span>
        <span><strong>{{ views }}</strong> {{ copy.uniqueVisits }}</span>
      </div>
    </aside>

    <div v-if="profile.tags.length" class="hero-stack" :aria-label="copy.stackLabel">
      <span class="hero-stack-label">CORE STACK</span>
      <ul>
        <li v-for="(tag, index) in profile.tags" :key="`stack-${index}-${tag}`">{{ tag }}</li>
      </ul>
    </div>
  </section>
</template>
