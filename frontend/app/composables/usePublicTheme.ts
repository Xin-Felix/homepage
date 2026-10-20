import { computed, onMounted } from 'vue'

type PublicTheme = 'dark' | 'light'

function applyTheme(theme: PublicTheme, persist: boolean) {
  if (!import.meta.client) return

  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.add('js')

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeMeta) themeMeta.content = theme === 'light' ? '#e9e9e3' : '#0b0d0f'

  if (persist) {
    try {
      localStorage.setItem('homepage.theme', theme)
    }
    catch {
      // 隐私模式或禁用存储时仍允许本次页面切换主题。
    }
  }
}

/** 主题状态跨公开路由共享，并与首屏内联脚本设置的 data-theme 对齐。 */
export function usePublicTheme() {
  const theme = useState<PublicTheme>('public-theme', () => 'dark')

  onMounted(() => {
    const restored = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    theme.value = restored
    applyTheme(restored, false)
  })

  const isLight = computed(() => theme.value === 'light')
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value, true)
  }

  return { theme, isLight, toggleTheme }
}
