import { computed } from 'vue'
import { DEFAULT_LOCALE, EN_PREFIX, MESSAGES, type Locale, type Messages } from '~/i18n/messages'

/** 路径是否属于英文站（/en 或 /en/...）。 */
function isEnPath(path: string): boolean {
  return path === EN_PREFIX || path.startsWith(`${EN_PREFIX}/`)
}

/** 去掉 /en 前缀，得到对应的中文（默认）路径。 */
export function stripLocalePrefix(path: string): string {
  if (isEnPath(path)) {
    const stripped = path.slice(EN_PREFIX.length)
    return stripped.startsWith('/') ? stripped : `/${stripped}`
  }
  return path
}

/** 给定逻辑路径（始终以中文/默认视角，如 '/projects/x'），按语言加上前缀。 */
export function withLocalePrefix(path: string, locale: Locale): string {
  const clean = stripLocalePrefix(path) || '/'
  if (locale === 'en') {
    return clean === '/' ? EN_PREFIX : `${EN_PREFIX}${clean}`
  }
  return clean
}

/**
 * 公开站语言上下文。
 * locale 的权威来源是 URL 路径前缀（/en = 英文），SSR 与客户端一致，利于 SEO 与缓存。
 */
export function useLocale() {
  const route = useRoute()

  const locale = computed<Locale>(() => (isEnPath(route.path) ? 'en' : DEFAULT_LOCALE))
  const messages = computed<Messages>(() => MESSAGES[locale.value])
  const isEnglish = computed(() => locale.value === 'en')
  const htmlLang = computed(() => (locale.value === 'en' ? 'en' : 'zh-CN'))
  const ogLocale = computed(() => (locale.value === 'en' ? 'en_US' : 'zh_CN'))

  /** 当前逻辑路径（去掉 /en 前缀），用于生成另一语言的对应链接。 */
  const logicalPath = computed(() => stripLocalePrefix(route.path) || '/')

  /** 把逻辑路径转成当前语言下的实际链接，供 NuxtLink 使用。 */
  const localePath = (path: string) => withLocalePrefix(path, locale.value)

  /** 另一种语言下当前页面的链接，供语言开关使用。 */
  const alternatePath = computed(() =>
    withLocalePrefix(logicalPath.value, locale.value === 'en' ? 'zh' : 'en'))

  return {
    locale,
    messages,
    isEnglish,
    htmlLang,
    ogLocale,
    logicalPath,
    localePath,
    alternatePath,
  }
}
