<script setup lang="ts">
import { useLocale } from '~/composables/useLocale'
import type { PublicContact } from '~/types/public'
import SectionHeading from './SectionHeading.vue'

defineProps<{
  contacts: PublicContact[]
  messageEnabled: boolean
  hasAi: boolean
}>()

const emit = defineEmits<{ openContact: [] }>()
const { isEnglish } = useLocale()
const kicker = computed(() => (isEnglish.value ? 'CONTACT' : 'CONTACT / 联系我'))
const leaveMsg = computed(() => (isEnglish.value ? 'Leave a message' : '给我留言'))
const viewContact = computed(() => (isEnglish.value ? 'View contact info' : '查看联系方式'))
const openFormLabel = computed(() => (isEnglish.value ? 'Open message form' : '打开留言表单'))
const viewContactLabel = computed(() => (isEnglish.value ? 'View contact info' : '查看联系方式'))
</script>

<template>
  <section id="contact" class="content-section contact-section section-anchor" aria-labelledby="contact-title">
    <SectionHeading :number="hasAi ? '05' : '04'" :kicker="kicker" title-id="contact-title">
      <template v-if="isEnglish">If you are building too,<br><em>let us trade a few ideas.</em></template>
      <template v-else>如果你也在构建，<br><em>我们可以交换一些想法。</em></template>
    </SectionHeading>
    <div class="contact-grid">
      <article class="bento-card contact-links-card reveal">
        <div class="card-no">FIND ME ONLINE</div>
        <div v-if="contacts.length" class="contact-links">
          <template v-for="(contact, index) in contacts" :key="contact.id">
            <a
              v-if="contact.href"
              :href="contact.href"
              :target="contact.external ? '_blank' : undefined"
              :rel="contact.external ? 'noopener' : undefined"
            >
              <span class="contact-index">0{{ index + 1 }}</span>
              <span class="contact-label"><small>{{ contact.label }}</small><strong>{{ contact.text }}</strong></span>
              <i aria-hidden="true">↗</i>
            </a>
            <div v-else class="contact-static">
              <span class="contact-index">0{{ index + 1 }}</span>
              <span class="contact-label"><small>{{ contact.label }}</small><strong>{{ contact.text }}</strong></span>
              <i aria-hidden="true">·</i>
            </div>
          </template>
        </div>
      </article>

      <article class="bento-card contact-cta interactive-card reveal">
        <div class="contact-orb" aria-hidden="true"><i /><i /><b>HELLO</b></div>
        <div class="contact-cta-copy">
          <span>HAVE AN IDEA?</span>
          <h3>LET'S<br><em>CONNECT.</em></h3>
          <button
            v-if="messageEnabled"
            class="round-button"
            type="button"
            :aria-label="openFormLabel"
            @click="emit('openContact')"
          >
            <span>{{ leaveMsg }}</span><i aria-hidden="true">↗</i>
          </button>
          <NuxtLink v-else class="round-button" to="#contact" :aria-label="viewContactLabel">
            <span>{{ viewContact }}</span><i aria-hidden="true">↗</i>
          </NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>
