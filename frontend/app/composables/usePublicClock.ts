import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 客户端杭州时钟；SSR 保持固定占位，避免时区造成 hydration 不一致。 */
export function usePublicClock() {
  const text = ref('--:--:--')
  const datetime = ref('')
  let timer: number | undefined

  onMounted(() => {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const update = () => {
      const now = new Date()
      text.value = formatter.format(now)
      datetime.value = now.toISOString()
    }
    update()
    timer = window.setInterval(update, 1000)
  })

  onBeforeUnmount(() => {
    if (timer !== undefined) window.clearInterval(timer)
  })

  return { text, datetime }
}
