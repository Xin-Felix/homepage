import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { PublicSeoPayload } from '~/types/public'

export interface PublicSeoInput {
  title: string
  description: string
  path: string
  imagePath: string
  type?: 'website' | 'article'
  keywords?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
  jsonLd?: Record<string, unknown> | string | null
  provided?: PublicSeoPayload
}

function safeJsonLd(value: Record<string, unknown> | string | null | undefined) {
  if (!value) return ''
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  // 防止动态内容提前闭合 JSON-LD script；数据本身不会作为可执行脚本解释。
  return serialized.replace(/</g, '\\u003c')
}

/** 为每个公开页面生成可在 SSR HTML 中直接读取的 canonical、OG、Twitter 与 JSON-LD。 */
export function usePublicSeo(source: MaybeRefOrGetter<PublicSeoInput>) {
  const requestUrl = useRequestURL()
  const input = computed(() => toValue(source))
  const absolute = (value: string) => new URL(value, requestUrl.origin).toString()

  const title = computed(() => input.value.provided?.title || input.value.title)
  const description = computed(() => input.value.provided?.description ?? input.value.description)
  const canonical = computed(() => {
    const value = input.value.provided?.canonical || input.value.path
    return absolute(value)
  })
  const image = computed(() => {
    const value = input.value.provided?.image || input.value.imagePath
    return absolute(value)
  })
  const type = computed(() => input.value.provided?.type || input.value.type || 'website')
  const publishedTime = computed(() => input.value.provided?.publishedTime ?? input.value.publishedTime ?? undefined)
  const modifiedTime = computed(() => input.value.provided?.modifiedTime ?? input.value.modifiedTime ?? undefined)
  const jsonLd = computed(() => safeJsonLd(input.value.provided?.jsonLd ?? input.value.jsonLd))

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    ogLocale: 'zh_CN',
    ogType: () => type.value,
    ogSiteName: 'huangxin.work',
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogUrl: () => canonical.value,
    ogImage: () => image.value,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: () => image.value,
    articlePublishedTime: () => publishedTime.value,
    articleModifiedTime: () => modifiedTime.value,
  })

  useHead(() => ({
    meta: input.value.keywords
      ? [{ name: 'keywords', content: input.value.keywords }]
      : [],
    link: [
      { rel: 'canonical', href: canonical.value },
      { rel: 'alternate', type: 'application/rss+xml', title: '黄鑫的技术笔记', href: '/rss.xml' },
    ],
    script: jsonLd.value
      ? [{ key: 'public-json-ld', type: 'application/ld+json', innerHTML: jsonLd.value }]
      : [],
  }))
}
