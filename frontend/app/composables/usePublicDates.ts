/**
 * 后端 LocalDateTime 不带时区；直接取日期部分可保证 SSR 与浏览器 hydration 一致。
 */
export function publicDatePart(value: string | null | undefined) {
  return value?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || ''
}

export function formatPublicDate(value: string | null | undefined) {
  const date = publicDatePart(value)
  return date ? date.replaceAll('-', '/') : ''
}
