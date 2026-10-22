# huangxin.work 个人技术主页

一个前后端分离、可后台管理的个人技术品牌站。

- `frontend/`：Nuxt 4 + Vue 3 + TypeScript，负责 SSR 页面、Vue 管理后台、Nitro BFF 与同源 API 代理；
- `backend/`：Spring Boot REST API，负责内容、认证、统计、留言和邮件；
- `mysql`：内容与日志持久化；
- Docker Compose 统一构建运行，不依赖宿主机 JDK、Maven、Node.js 或 MySQL。

前台设计参考 MIT 开源项目 [Bentofolio](https://github.com/mkhoirulwafa18/bentofolio) 和 [Magic UI Portfolio](https://github.com/dillionverma/portfolio)。Vue 管理后台的信息架构参考 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) 与 [Nuxt Dashboard Template](https://github.com/nuxt-ui-pro/dashboard)，并评估过 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)；项目只借鉴布局和模块化思路，没有搬入其业务代码。后端最初参考 [jasonpyau.com](https://github.com/jasonpyau/jasonpyau.com)。版权说明见 [LICENSE](LICENSE) 与 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 当前能力

- 克制的深色技术履历主页、默认跟随系统且支持手动覆盖的明暗主题、Vue 可复用区块；
- Nuxt SSR、路由级 SEO、客户端 hydration 和统一错误页；
- Vue 管理后台、管理员账号 + 密码、Bearer token、IP 登录失败锁定与可选 TOTP；
- 基本信息、经历、项目、联系方式后台管理；
- 项目案例详情页、Markdown 编辑与安全预览；
- 技术笔记的草稿/发布、标签、Markdown 和阅读量；
- AI Lab 独立展示真实 AI 工程项目，无公开项目时自动隐藏入口；
- 24 小时 IP 去重访问统计、访问日志与 7/30/90 天图表看板；
- 留言、限流、蜜罐反机器人和可选 SMTP 通知；
- Canonical、JSON-LD、Sitemap、RSS 与 1200×630 动态 Open Graph PNG；
- 前后端均设置 CSP、安全响应头和独立健康检查。

## 快速启动

```bash
cp .env.example .env
# 修改 .env 中所有 change-me 配置
docker compose up -d --build
docker compose ps
```

访问地址：

- 主页：http://localhost:8080
- 后台：http://localhost:8080/admin
- MySQL 调试端口：`127.0.0.1:3307`

常用命令：

```bash
docker compose logs -f frontend backend
docker compose up -d --build frontend backend
docker compose stop                    # 停止，数据保留
docker compose down                    # 删除容器，数据卷保留
docker compose down -v                 # 删除容器和数据库，谨慎
```

## 项目结构

```text
homepage/
├── frontend/                       # Nuxt 页面/BFF，不接触数据库和业务密钥
│   ├── app/
│   │   ├── components/public/      # 公开站可复用 Vue 组件
│   │   ├── components/admin/       # 后台 Shell、表单、图表和资源管理组件
│   │   ├── composables/            # 页面数据、SEO、交互、后台会话与 API
│   │   ├── layouts/                # 公开站与后台布局
│   │   └── pages/                  # 文件路由：首页、详情、笔记、AI、后台
│   ├── server/
│   │   ├── api/                    # 页面 BFF 与 `/api/**` Spring 透明代理
│   │   ├── middleware/             # 请求上下文、后台 no-store/noindex
│   │   ├── routes/                 # 健康检查、RSS、Sitemap、OG、Markdown 预览
│   │   └── utils/                  # 后端调用、Markdown、SEO、OG、真实 IP
│   ├── nuxt.config.ts
│   ├── Dockerfile
│   └── package.json
├── backend/                        # Spring REST 业务层
│   ├── src/main/java/work/huangxin/homepage/
│   │   ├── auth/                   # 后台认证与 token
│   │   ├── controller/             # 公开、后台和内部接口
│   │   ├── domain/                 # JPA 实体
│   │   ├── repository/             # Spring Data JPA
│   │   ├── service/                # 业务逻辑
│   │   ├── ratelimit/              # Bucket4j 与登录锁定
│   │   └── config/                 # 配置、安全头、SQL 初始化入口
│   ├── src/main/resources/
│   │   └── db/                     # 新库 seed 与幂等内容升级 SQL
│   ├── Dockerfile
│   └── pom.xml
├── docs/                           # 架构、内容、安全、SEO 与部署文档
├── docker-compose.yml
└── .env.example
```

更详细的边界与请求链路见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，部署步骤见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)，内容编辑说明见 [docs/CONTENT.md](docs/CONTENT.md)，统计口径见 [docs/ANALYTICS.md](docs/ANALYTICS.md)，后台安全与 TOTP 见 [docs/SECURITY.md](docs/SECURITY.md)，搜索与分享配置见 [docs/SEO.md](docs/SEO.md)。

## 环境变量

真实配置只写入被 Git 忽略的 `.env`。

| 变量 | 用途 | 默认 |
|---|---|---|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 后台凭据，仅注入 backend | 必填 |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` | 数据库凭据 | 必填 |
| `VISITOR_HASH_SALT` | IP 指纹独立盐值 | 必填 |
| `TOTP_ENCRYPTION_KEY` | TOTP secret 的独立 AES-256 密钥 | 必填 |
| `TOTP_ISSUER` | Authenticator 中显示的发行者 | huangxin.work |
| `VISITOR_UNIQUE_WINDOW` | 同 IP 去重窗口 | 24h |
| `VISITOR_LOG_RETENTION` | 访问日志保留期 | 90d |
| `APP_PORT` / `MYSQL_PORT` | 本地端口 | 8080 / 3307 |
| `SITE_URL` | SSR canonical、RSS、Sitemap 和 OG 的公网根地址 | http://localhost:8080 |
| `BACKEND_ORIGIN` | frontend 访问 Spring 的 Docker 内网地址 | http://backend:8080 |
| `NOTIFY_EMAIL` | 留言通知收件人 | 空，不发送 |
| `MAIL_*` | SMTP 参数 | 见 `.env.example` |

访问日志保存完整 IP、创建时离线解析的地区快照、加盐指纹、来源站点和粗粒度设备分类。完整 IP 与地区仅通过登录后的后台访问日志 API 返回，不进入公开页面、SSR payload、应用日志或第三方地区服务；历史脱敏记录无法反推出完整 IP。

## API 约定

浏览器只访问 frontend。Nitro 将 `/api/**` 原样代理到内部 backend，公开页面则通过 `/api/page/**` BFF 聚合 Spring 数据、统计和 SEO。成功响应：

```json
{"status":"success","data":{}}
```

失败响应：

```json
{"status":"error","reason":"错误原因","invalidFields":{}}
```

除登录外，`/api/admin/**` 都需要 `Authorization: Bearer <token>`。令牌只保存在当前标签页的 `sessionStorage`，不会进入 SSR payload。

登录请求：

```json
{"username":"...","password":"...","totpCode":"启用后填写 6 位验证码"}
```

TOTP 管理接口位于 `/api/admin/totp/status|setup|confirm|disable`，详细流程见安全文档。

## License

MIT，见 [LICENSE](LICENSE)。第三方运行依赖许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
