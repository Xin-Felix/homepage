declare module 'sanitize-html' {
  type Attributes = Record<string, string>

  interface Options {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
    allowedSchemes?: string[]
    transformTags?: Record<string, (tagName: string, attributes: Attributes) => {
      tagName: string
      attribs: Attributes
    }>
  }

  export default function sanitizeHtml(html: string, options?: Options): string
}
