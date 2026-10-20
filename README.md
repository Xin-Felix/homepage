# huangxin.work 个人技术主页

一个前后端分离、可后台管理的个人技术品牌站。

- `frontend/`：Node.js + Express + EJS，负责 SSR 页面、静态资源与同源 API 代理；
- `backend/`：Spring Boot REST API，负责内容、认证、统计、留言和邮件；
- `mysql`：内容与日志持久化；
- Docker Compose 统一构建运行，不依赖宿主机 JDK、Maven、Node.js 或 MySQL。

前台设计参考 MIT 开源项目 [Bentofolio](https://github.com/mkhoirulwafa18/bentofolio) 和 [Magic UI Portfolio](https://github.com/dillionverma/portfolio)，后端最初参考 [jasonpyau.com](https://github.com/jasonpyau/jasonpyau.com)。版权说明见 [LICENSE](LICENSE)。

## 当前能力

- 深色 Bento 响应式主页与明暗主题；
- 管理员账号 + 密码、Bearer token、IP 登录失败锁定；
- 基本信息、经历、项目、联系方式后台管理；
- 项目案例详情页、Markdown 编辑与安全预览；
- 技术笔记的草稿/发布、标签、Markdown 和阅读量；
- 24 小时 IP 去重访问统计、访问日志与 7/30/90 天图表看板；
- 留言、限流、蜜罐反机器人和可选 SMTP 通知；
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
├── frontend/                  # 页面层，不接触数据库和任何业务密钥
│   ├── src/server.js          # SSR、/api 代理、安全头、健康检查
│   ├── views/                 # EJS 服务端模板
│   ├── public/                # CSS、浏览器 JS、管理后台
│   ├── Dockerfile
│   └── package.json
├── backend/                   # REST 业务层
│   ├── src/main/java/work/huangxin/homepage/
│   │   ├── auth/              # 后台认证与 token
│   │   ├── controller/        # 公开、后台和内部接口
│   │   ├── domain/            # JPA 实体
│   │   ├── repository/        # Spring Data JPA
│   │   ├── service/           # 业务逻辑
│   │   ├── ratelimit/         # Bucket4j 与登录锁定
│   │   └── config/            # 配置、安全头、初始数据
│   ├── src/main/resources/    # application 配置
│   ├── Dockerfile
│   └── pom.xml
├── docs/                      # 架构与部署文档
├── docker-compose.yml
└── .env.example
```

更详细的边界与请求链路见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，部署步骤见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)，内容编辑说明见 [docs/CONTENT.md](docs/CONTENT.md)，统计口径见 [docs/ANALYTICS.md](docs/ANALYTICS.md)。

## 环境变量

真实配置只写入被 Git 忽略的 `.env`。

| 变量 | 用途 | 默认 |
|---|---|---|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 后台凭据 | 必填 |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` | 数据库凭据 | 必填 |
| `VISITOR_HASH_SALT` | IP 指纹独立盐值 | 必填 |
| `VISITOR_UNIQUE_WINDOW` | 同 IP 去重窗口 | 24h |
| `VISITOR_LOG_RETENTION` | 访问日志保留期 | 90d |
| `APP_PORT` / `MYSQL_PORT` | 本地端口 | 8080 / 3307 |
| `SITE_URL` | 站点公网根地址 | http://localhost:8080 |
| `NOTIFY_EMAIL` | 留言通知收件人 | 空，不发送 |
| `MAIL_*` | SMTP 参数 | 见 `.env.example` |

访问日志只保存脱敏网段、加盐指纹、来源站点和粗粒度设备分类；不保存明文 IP、完整 Referer 或原始 User-Agent。

## API 约定

浏览器只访问 frontend，frontend 将 `/api/**` 原样代理到内部 backend。成功响应：

```json
{"status":"success","data":{}}
```

失败响应：

```json
{"status":"error","reason":"错误原因","invalidFields":{}}
```

除登录外，`/api/admin/**` 都需要 `Authorization: Bearer <token>`。

## License

MIT，见 [LICENSE](LICENSE)。
