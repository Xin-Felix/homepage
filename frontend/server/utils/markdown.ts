import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

/** Markdown 只在服务端转换，并用与旧 Express 服务相同的白名单净化。 */
export function renderMarkdown(markdown: unknown): string {
  const unsafe = marked.parse(String(markdown || ''), {
    gfm: true,
    breaks: false,
  }) as string

  return sanitizeHtml(unsafe, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'blockquote',
      'pre', 'code', 'strong', 'em', 'del', 'a', 'hr', 'br',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, rel: 'noopener noreferrer' },
      }),
    },
  })
}
