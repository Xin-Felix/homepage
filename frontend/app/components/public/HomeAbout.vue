<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'
import type { PublicProfile } from '~/types/public'
import SectionHeading from './SectionHeading.vue'

defineProps<{ profile: PublicProfile }>()
const { isEnglish } = useLocale()
const kicker = computed(() => (isEnglish.value ? 'ABOUT' : 'ABOUT / 关于我'))
const copy = computed(() => isEnglish.value
  ? {
      emptyStory: 'Stay curious, keep building.',
      principles: [
        { tag: 'SIMPLE', note: 'Remove unnecessary complexity first' },
        { tag: 'DIRECT', note: 'Make writing as direct as the code' },
        { tag: 'LONG-TERM', note: 'Trust time and compounding' },
      ],
      focusLabel: 'Focus areas',
      focusTags: ['Monetization systems', 'Real-time risk control', 'Complex migration'],
    }
  : {
      emptyStory: '保持好奇，持续构建。',
      principles: [
        { tag: 'SIMPLE', note: '先消除不必要的复杂度' },
        { tag: 'DIRECT', note: '让表达和代码一样直接' },
        { tag: 'LONG-TERM', note: '相信时间与复利' },
      ],
      focusLabel: '关注方向',
      focusTags: ['商业化系统', '实时风控', '复杂系统迁移'],
    })
</script>

<template>
  <section id="about" class="content-section section-anchor" aria-labelledby="about-title">
    <SectionHeading number="03" :kicker="kicker" title-id="about-title">
      <template v-if="isEnglish">Beyond the code,<br><em>building my own coordinate system.</em></template>
      <template v-else>代码之外，<br><em>也在构建自己的坐标系。</em></template>
    </SectionHeading>
    <div class="about-grid">
      <article class="bento-card about-story interactive-card reveal">
        <div class="card-no">BACKGROUND</div>
        <div class="story-mark" aria-hidden="true">“</div>
        <div class="story-copy">
          <template v-if="profile.aboutParagraphs.length">
            <p v-for="(paragraph, index) in profile.aboutParagraphs" :key="`${index}-${paragraph}`">{{ paragraph }}</p>
          </template>
          <p v-else>{{ copy.emptyStory }}</p>
        </div>
        <div class="story-footer"><span>FROM SHAANXI</span><span>BASED IN HANGZHOU</span><span>SINCE 2000</span></div>
      </article>

      <article class="bento-card manifesto-card interactive-card reveal">
        <div class="manifesto-top"><span>ENGINEERING PRINCIPLES</span><span>03</span></div>
        <ol>
          <li v-for="(item, index) in copy.principles" :key="item.tag">
            <span>0{{ index + 1 }}</span><strong>{{ item.tag }}</strong><small>{{ item.note }}</small>
          </li>
        </ol>
      </article>

      <article class="bento-card radar-card interactive-card reveal" :aria-label="copy.focusLabel">
        <div class="card-no">CURRENT FOCUS</div>
        <div class="radar" aria-hidden="true">
          <i class="radar-circle radar-circle--one" />
          <i class="radar-circle radar-circle--two" />
          <i class="radar-line" />
          <span class="radar-dot radar-dot--one" />
          <span class="radar-dot radar-dot--two" />
          <b>FOCUS</b>
        </div>
        <div class="radar-tags"><span v-for="tag in copy.focusTags" :key="tag">{{ tag }}</span></div>
      </article>
    </div>
  </section>
</template>
