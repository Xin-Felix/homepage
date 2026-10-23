<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { useLocale } from '~/composables/useLocale'

interface MessageResult {
  status: 'success' | 'error'
  reason?: string
}

interface FetchFailure {
  data?: MessageResult
}

const { isEnglish } = useLocale()
const c = computed(() => isEnglish.value
  ? {
      newMessage: 'NEW MESSAGE',
      title: 'What\u2019s on your mind?',
      close: 'Close message window',
      intro: 'Only I can see this in the back office. Leave your contact and I will reply soon.',
      name: 'Name', required: '*',
      namePlaceholder: 'What should I call you',
      contact: 'Contact',
      contactPlaceholder: 'Email / WeChat (optional)',
      content: 'Your message',
      contentPlaceholder: 'A project, a technical topic, or anything interesting\u2026',
      website: 'Website',
      send: 'Send message',
      validation: 'Please enter a name and at least 2 characters',
      sending: 'Sending\u2026',
      sendFail: 'Failed to send, please try again',
      success: 'Got it, I will reply as soon as possible.',
    }
  : {
      newMessage: 'NEW MESSAGE',
      title: '聊点什么？',
      close: '关闭留言窗口',
      intro: '留言只有我能在后台看到。留下联系方式，我会尽快回复。',
      name: '称呼', required: '*',
      namePlaceholder: '怎么称呼你',
      contact: '联系方式',
      contactPlaceholder: '邮箱 / 微信（选填）',
      content: '想说的话',
      contentPlaceholder: '项目、技术，或者任何有意思的话题…',
      website: '网站',
      send: '发送消息',
      validation: '请填写称呼和至少 2 个字的内容',
      sending: '正在发送…',
      sendFail: '发送失败，请稍后重试',
      success: '收到，我会尽快回复你。',
    })

const dialog = ref<HTMLDialogElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)
const submitting = ref(false)
const statusText = ref('')
const statusType = ref<'' | 'success' | 'error'>('')
const form = reactive({ name: '', contact: '', content: '', website: '' })
let focusTimer: number | undefined
let closeTimer: number | undefined

const setStatus = (message: string, type: '' | 'success' | 'error' = '') => {
  statusText.value = message
  statusType.value = type
}

const onDialogClose = () => {
  document.body.classList.remove('dialog-open')
}

const open = async () => {
  const element = dialog.value
  if (!element) return
  if (typeof element.showModal === 'function') {
    if (!element.open) element.showModal()
  }
  else {
    element.setAttribute('open', '')
  }
  document.body.classList.add('dialog-open')
  await nextTick()
  focusTimer = window.setTimeout(() => nameInput.value?.focus(), 80)
}

const close = () => {
  const element = dialog.value
  if (!element) return
  if (typeof element.close === 'function' && element.open) element.close()
  else element.removeAttribute('open')
  onDialogClose()
}

const onSubmit = async () => {
  const payload = {
    name: form.name.trim(),
    contact: form.contact.trim(),
    content: form.content.trim(),
    website: form.website,
  }
  if (!payload.name || payload.content.length < 2) {
    setStatus(c.value.validation, 'error')
    return
  }

  submitting.value = true
  setStatus(c.value.sending)
  try {
    const result = await $fetch<MessageResult>('/api/messages', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload,
    })
    if (!result || result.status !== 'success') {
      setStatus(result?.reason || c.value.sendFail, 'error')
      return
    }
    form.name = ''
    form.contact = ''
    form.content = ''
    form.website = ''
    setStatus(c.value.success, 'success')
    closeTimer = window.setTimeout(close, 1400)
  }
  catch (error) {
    const failure = error as FetchFailure
    setStatus(failure.data?.reason || c.value.sendFail, 'error')
  }
  finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (focusTimer !== undefined) window.clearTimeout(focusTimer)
  if (closeTimer !== undefined) window.clearTimeout(closeTimer)
  onDialogClose()
})

defineExpose({ open, close })
</script>

<template>
  <dialog
    id="contact-dialog"
    ref="dialog"
    class="contact-dialog"
    aria-labelledby="dialog-title"
    @close="onDialogClose"
    @click.self="close"
  >
    <div class="dialog-shell">
      <header class="dialog-head">
        <div>
          <span>{{ c.newMessage }}</span>
          <h2 id="dialog-title">{{ c.title }}</h2>
        </div>
        <button type="button" class="dialog-close" :aria-label="c.close" @click="close">×</button>
      </header>
      <p class="dialog-intro">{{ c.intro }}</p>

      <form id="msg-form" class="message-form" @submit.prevent="onSubmit">
        <div class="form-grid">
          <label>
            <span>{{ c.name }} <i>{{ c.required }}</i></span>
            <input
              ref="nameInput"
              v-model="form.name"
              name="name"
              maxlength="30"
              required
              autocomplete="name"
              :placeholder="c.namePlaceholder"
            >
          </label>
          <label>
            <span>{{ c.contact }}</span>
            <input
              v-model="form.contact"
              name="contact"
              maxlength="100"
              autocomplete="email"
              :placeholder="c.contactPlaceholder"
            >
          </label>
        </div>
        <label>
          <span>{{ c.content }} <i>{{ c.required }}</i></span>
          <textarea
            v-model="form.content"
            name="content"
            rows="6"
            minlength="2"
            maxlength="1000"
            required
            :placeholder="c.contentPlaceholder"
          ></textarea>
        </label>
        <div class="honeypot" aria-hidden="true">
          <label>{{ c.website }}<input v-model="form.website" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <div class="form-footer">
          <span
            class="msg-status"
            :class="statusType && `msg-status--${statusType}`"
            role="status"
            aria-live="polite"
          >{{ statusText }}</span>
          <button type="submit" class="button button--primary" :disabled="submitting">
            {{ c.send }} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
