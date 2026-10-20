<script setup lang="ts">
import type { PublicProfile } from '~/types/public'

defineProps<{
  profile: PublicProfile
  projectCount: number
  views: number
}>()

const emit = defineEmits<{ openContact: [] }>()
const { text: clockText, datetime: clockDatetime } = usePublicClock()
const year = usePublicYear()
</script>

<template>
  <section id="top" class="hero-grid section-anchor" aria-labelledby="hero-title">
    <article class="bento-card hero-card interactive-card reveal">
      <div class="card-no">PORTFOLIO / {{ year }}</div>
      <div class="hero-copy">
        <div class="eyebrow"><span />JAVA BACKEND · HANGZHOU</div>
        <h1 id="hero-title">
          <span class="hero-hello"><em>{{ profile.greeting || '' }}</em> <b>{{ profile.name }}</b></span>
          <span>让复杂系统</span>
          <span>保持 <mark>可靠</mark> 与清晰。</span>
        </h1>
        <p>{{ profile.intro }}</p>
        <div class="hero-actions">
          <NuxtLink class="button button--primary" to="#projects">查看项目 <span aria-hidden="true">↘</span></NuxtLink>
          <button
            v-if="profile.messageEnabled"
            class="button button--ghost"
            type="button"
            @click="emit('openContact')"
          >聊点什么 <span aria-hidden="true">↗</span></button>
          <NuxtLink v-else class="button button--ghost" to="#contact">联系我 <span aria-hidden="true">↗</span></NuxtLink>
        </div>
      </div>
      <div class="system-orbit" aria-hidden="true">
        <div class="orbit orbit--one"><i /></div>
        <div class="orbit orbit--two"><i /></div>
        <div class="orbit-core">HX<span>JAVA</span></div>
        <code class="orbit-label orbit-label--api">API</code>
        <code class="orbit-label orbit-label--db">DB</code>
        <code class="orbit-label orbit-label--mq">MQ</code>
      </div>
    </article>

    <aside class="bento-card identity-card interactive-card reveal" aria-label="个人名片">
      <div class="identity-top"><span>PROFILE / 001</span><span class="cross" aria-hidden="true">✦</span></div>
      <div class="portrait" aria-hidden="true">
        <div class="portrait-grid" />
        <div class="portrait-ring portrait-ring--one" />
        <div class="portrait-ring portrait-ring--two" />
        <div class="portrait-name">{{ profile.name }}</div>
        <span class="code-chip code-chip--one">&lt;/&gt;</span>
        <span class="code-chip code-chip--two">01</span>
      </div>
      <div class="identity-bottom">
        <div><small>ROLE</small><strong>Java 后端工程师</strong></div>
        <span class="identity-arrow" aria-hidden="true">↗</span>
      </div>
    </aside>

    <article class="bento-card signal-card interactive-card reveal">
      <div class="signal-head"><span class="signal-label"><i /> LOCAL SIGNAL</span><span>HZ / CN</span></div>
      <div class="signal-location"><strong>杭州</strong><time :datetime="clockDatetime">{{ clockText }}</time></div>
      <div class="mini-stats">
        <div><strong>4<span>+</span></strong><small>年工程经验</small></div>
        <div><strong>{{ projectCount }}</strong><small>个公开项目</small></div>
        <div><strong>{{ views }}</strong><small>次独立访问</small></div>
      </div>
    </article>

    <article v-if="profile.tags.length" class="bento-card stack-strip reveal" aria-label="技术栈">
      <div class="stack-title"><span>CORE STACK</span><i aria-hidden="true" /></div>
      <div class="marquee">
        <div class="marquee-track">
          <span v-for="(tag, index) in profile.tags" :key="`stack-${index}-${tag}`">{{ tag }}</span>
          <span
            v-for="(tag, index) in profile.tags"
            :key="`stack-copy-${index}-${tag}`"
            aria-hidden="true"
          >{{ tag }}</span>
        </div>
      </div>
      <div class="stack-end" aria-hidden="true">{ BUILD → SHIP }</div>
    </article>
  </section>
</template>
