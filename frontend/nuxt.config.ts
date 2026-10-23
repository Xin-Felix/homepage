export default defineNuxtConfig({
  modules: ['@pinia/nuxt', 'nuxt-security'],

  devtools: { enabled: false },

  // 为每个公开页面克隆一份 /en 前缀路由，指向同一组件；组件内通过 useLocale()
  // 依据路径前缀切换语言。admin 页面不参与双语。克隆时清掉 alias，避免生成 /en/index.html。
  hooks: {
    'pages:extend'(pages) {
      const isPublic = (file?: string) =>
        typeof file === 'string'
        && file.includes('/pages/')
        && !file.includes('/pages/admin/')
      const clones = pages
        .filter(page => isPublic(page.file) && typeof page.path === 'string' && !page.path.startsWith('/en'))
        .map(page => ({
          ...page,
          name: page.name ? `${page.name}___en` : undefined,
          path: page.path === '/' ? '/en' : `/en${page.path}`,
          alias: undefined,
          children: undefined,
        }))
      pages.push(...clones)
    },
  },

  // 仅放服务端配置，避免将 backend 内网地址暴露到客户端 payload。
  runtimeConfig: {
    backendOrigin: 'http://backend:8080',
    siteUrl: 'http://localhost:8080',
  },

  nitro: {
    preset: 'node-server',
    // Resvg 包含平台相关的原生二进制，必须由 Nitro 作为运行时依赖追踪。
    externals: {
      external: ['@resvg/resvg-js'],
    },
  },

  security: {
    enabled: true,
    strict: false,
    hidePoweredBy: true,
    nonce: true,
    // 代理和 OG 均有与旧服务一致的专用大小/限速策略，关闭模块的通用拦截器。
    requestSizeLimiter: false,
    rateLimiter: false,
    xssValidator: false,
    corsHandler: false,
    allowedMethodsRestricter: false,
    csrf: false,
    removeLoggers: false,
    ssg: false,
    sri: true,
    headers: {
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      strictTransportSecurity: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      xFrameOptions: 'DENY',
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        // Nuxt Security 会为 SSR 内联脚本生成并注入每请求 nonce；禁止 unsafe-inline。
        'script-src': ["'self'", "'nonce-{{nonce}}'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': false,
      },
    },
  },
})
