# Frontend

独立的 Nuxt 4 + Vue 3 + TypeScript SSR 前端，同时承载公开站、管理后台和 Nitro BFF。

## 目录职责

- `app/pages/`：公开页和 `/admin/` 文件路由；
- `app/components/public/`：技术履历首页、详情页、Markdown、主题和留言组件；
- `app/components/admin/`：后台 Shell、通用资源编辑器、统计、留言和 TOTP 组件；
- `app/composables/`：SSR 页面数据、SEO、公开交互、后台会话和 API；
- `server/api/page/`：面向页面的 BFF 聚合端点；
- `server/api/[...path].ts`：将浏览器 `/api/**` 原样代理到 Spring Boot；
- `server/routes/`：健康检查、RSS、Sitemap、Open Graph PNG 和 Markdown 预览；
- `server/utils/`：可信代理、后端请求、Markdown 清洗、SEO 和图片生成。

## 关键约束

- 公开页面使用 Nuxt SSR，`useAsyncData` payload 在 hydration 时复用，不重复访问 backend；
- SSR 内部 BFF 请求只继承根请求中间件已校验的 IP、方法、协议和客户端元数据；
- 根 `HEAD` 请求不产生访问或阅读副作用；
- 后台仅在客户端渲染，Bearer token 只进入 `sessionStorage`，不会写入 HTML 或 SSR payload；
- 原始 Markdown 只在服务端通过 `marked` 解析并由 `sanitize-html` 白名单清洗；
- CSP nonce 由 `nuxt-security` 按请求生成，脚本策略不启用 `unsafe-inline`；
- frontend 不持有数据库、管理员、SMTP、TOTP 或访问指纹密钥。

## Docker 构建

依赖版本由 `package.json` 和 `package-lock.json` 精确固定，镜像使用 `npm ci`，并在生产构建前执行 `nuxt typecheck`。开发、构建和运行统一通过根目录 Docker Compose，不要求宿主机安装 Node.js：

```bash
docker compose build frontend
docker compose up -d --no-deps frontend
docker compose logs -f frontend
```

健康检查：

```bash
curl -fsS http://127.0.0.1:8080/healthz
curl -fsS http://127.0.0.1:8080/readyz
```
