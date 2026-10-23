interface PublicFetchError {
  status?: number
  statusCode?: number
  statusMessage?: string
  data?: { reason?: string; statusMessage?: string }
  response?: { status?: number }
}

interface ReadonlyValue<T> {
  readonly value: T
}

interface ServerRequestContext {
  homepageClientIp?: string
  homepageRootMethod?: string
  homepageProtocol?: string
  homepageHost?: string
  homepageUserAgent?: string
  homepageReferer?: string
}

/**
 * 所有公开页统一使用 requestFetch，让 SSR 请求继承当前请求上下文；
 * useAsyncData 会把结果写入 Nuxt payload，hydration 时不会再请求一次。
 */
export function usePublicPageData<T>(key: string, path: string) {
  const requestFetch = useRequestFetch()
  const headers: Record<string, string> = {}

  // 把当前语言传给 BFF，再由 BFF 转发给后端，使同一组页面组件按语言取到不同内容。
  const { locale } = useLocale()
  if (locale.value === 'en') headers['x-site-lang'] = 'en'

  if (import.meta.server) {
    const context = useRequestEvent()?.context as ServerRequestContext | undefined
    const inherited = [
      ['x-homepage-client-ip', context?.homepageClientIp],
      ['x-homepage-root-method', context?.homepageRootMethod],
      ['x-homepage-protocol', context?.homepageProtocol],
      ['x-homepage-host', context?.homepageHost],
      ['x-homepage-user-agent', context?.homepageUserAgent],
      ['x-homepage-referer', context?.homepageReferer],
    ] as const
    for (const [name, value] of inherited) {
      if (value) headers[name] = value
    }
  }

  const fetchPage = requestFetch as unknown as <Result>(
    url: string,
    options: { headers: Record<string, string> },
  ) => Promise<Result>

  // key 带上语言，避免中英文内容共用同一份缓存。
  const scopedKey = locale.value === 'en' ? `${key}:en` : key

  return useAsyncData<T>(
    scopedKey,
    () => fetchPage<T>(path, { headers }),
    {
      deep: false,
      server: true,
      lazy: false,
    },
  )
}

/** 将 BFF 错误转换为公开、安全且可由 error.vue 呈现的页面错误。 */
export function requirePublicPage<T>(
  data: ReadonlyValue<T | null | undefined>,
  error: ReadonlyValue<unknown>,
  notFoundMessage: string,
): T {
  if (!error.value && data.value) return data.value

  const source = (error.value || {}) as PublicFetchError
  const statusCode = Number(
    source.statusCode
      || source.status
      || source.response?.status
      || 500,
  )

  let message = '服务暂时不可用，请稍后再试。'
  if (statusCode === 404) message = notFoundMessage
  else if (statusCode === 429) message = '请求过于频繁，请稍后再试。'

  throw createError({ statusCode, message })
}

/** 动态公开 URL 只接受与旧站一致的小写 kebab-case slug。 */
export function isPublicSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}
