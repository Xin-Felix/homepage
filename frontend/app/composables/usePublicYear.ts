/** 年份在 SSR 时写入 Nuxt state，避免跨年瞬间出现 hydration 文本差异。 */
export function usePublicYear() {
  return useState<number>('public-year', () => new Date().getFullYear())
}
