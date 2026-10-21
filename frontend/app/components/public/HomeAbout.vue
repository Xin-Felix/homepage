<script setup lang="ts">
import type { PublicProfile } from '~/types/public'
import SectionHeading from './SectionHeading.vue'

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <section id="about" class="content-section section-anchor" aria-labelledby="about-title">
    <SectionHeading number="03" kicker="ABOUT / 关于我" title-id="about-title">
      代码之外，<br><em>也在构建自己的坐标系。</em>
    </SectionHeading>
    <div class="about-grid">
      <article class="bento-card about-story interactive-card reveal">
        <div class="card-no">BACKGROUND</div>
        <div class="story-mark" aria-hidden="true">“</div>
        <div class="story-copy">
          <template v-if="profile.aboutParagraphs.length">
            <p v-for="(paragraph, index) in profile.aboutParagraphs" :key="`${index}-${paragraph}`">{{ paragraph }}</p>
          </template>
          <p v-else>保持好奇，持续构建。</p>
        </div>
        <div class="story-footer"><span>FROM SHAANXI</span><span>BASED IN HANGZHOU</span><span>SINCE 2000</span></div>
      </article>

      <article class="bento-card manifesto-card interactive-card reveal">
        <div class="manifesto-top"><span>ENGINEERING PRINCIPLES</span><span>03</span></div>
        <ol>
          <li><span>01</span><strong>SIMPLE</strong><small>先消除不必要的复杂度</small></li>
          <li><span>02</span><strong>DIRECT</strong><small>让表达和代码一样直接</small></li>
          <li><span>03</span><strong>LONG-TERM</strong><small>相信时间与复利</small></li>
        </ol>
      </article>

      <article class="bento-card radar-card interactive-card reveal" aria-label="关注方向">
        <div class="card-no">CURRENT FOCUS</div>
        <div class="radar" aria-hidden="true">
          <i class="radar-circle radar-circle--one" />
          <i class="radar-circle radar-circle--two" />
          <i class="radar-line" />
          <span class="radar-dot radar-dot--one" />
          <span class="radar-dot radar-dot--two" />
          <b>FOCUS</b>
        </div>
        <div class="radar-tags"><span>商业化系统</span><span>实时风控</span><span>复杂系统迁移</span></div>
      </article>
    </div>
  </section>
</template>
