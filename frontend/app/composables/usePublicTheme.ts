import { computed, onBeforeUnmount, onMounted } from 'vue'

type PublicTheme = 'dark' | 'light'
type ThemePreference = PublicTheme | 'system'

const STORAGE_KEY = 'homepage.theme'

function systemTheme(media: MediaQueryList): PublicTheme {
  return media.matches ? 'light' : 'dark'
}

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  }
  catch {
    return 'system'
  }
}

function applyTheme(theme: PublicTheme) {
  if (!import.meta.client) return

  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.add('js')

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeMeta) themeMeta.content = theme === 'light' ? '#f4f3ed' : '#0b0d0f'
}

/** 默认跟随系统主题；用户点击后保存手动选择，并跨公开路由复用。 */
export function usePublicTheme() {
  const theme = useState<PublicTheme>('public-theme', () => 'dark')
  const preference = useState<ThemePreference>('public-theme-preference', () => 'system')
  let media: MediaQueryList | null = null
  let handleSystemChange: ((event: MediaQueryListEvent) => void) | null = null
  let handleStorageChange: ((event: StorageEvent) => void) | null = null

  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: light)')
    preference.value = readPreference()
    theme.value = preference.value === 'system' ? systemTheme(media) : preference.value
    applyTheme(theme.value)

    handleSystemChange = (event) => {
      if (preference.value !== 'system') return
      theme.value = event.matches ? 'light' : 'dark'
      applyTheme(theme.value)
    }
    media.addEventListener('change', handleSystemChange)

    // 同一站点的其他标签页修改或清除主题偏好时同步当前页面。
    handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY || !media) return
      preference.value = event.newValue === 'light' || event.newValue === 'dark'
        ? event.newValue
        : 'system'
      theme.value = preference.value === 'system' ? systemTheme(media) : preference.value
      applyTheme(theme.value)
    }
    window.addEventListener('storage', handleStorageChange)
  })

  onBeforeUnmount(() => {
    if (media && handleSystemChange) media.removeEventListener('change', handleSystemChange)
    if (handleStorageChange) window.removeEventListener('storage', handleStorageChange)
  })

  const isLight = computed(() => theme.value === 'light')
  const followsSystem = computed(() => preference.value === 'system')
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    preference.value = theme.value
    applyTheme(theme.value)
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    }
    catch {
      // 隐私模式或禁用存储时仍允许当前页面手动切换。
    }
  }

  return { theme, isLight, followsSystem, toggleTheme }
}
