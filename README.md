# huangxin.work 个人主页

前台展示 + 管理后台，一个 Spring Boot 应用搞定。后台架构源自 [jasonpyau.com](https://github.com/jasonpyau/jasonpyau.com)；前台已重新设计为深色 Bento 作品集，主要参考 [Bentofolio](https://github.com/mkhoirulwafa18/bentofolio) 的信息架构和 [Magic UI Portfolio](https://github.com/dillionverma/portfolio) 的交互方式。三个上游项目均使用 MIT 协议。

- 前台 `/`：全新响应式 Bento 设计，支持明暗主题、滚动动效、动态卡片和弹窗留言；Thymeleaf 服务端渲染，内容全部来自数据库
- 后台 `/admin`：管理员账号 + 密码登录并带 IP 失败锁定；可编辑基本信息、工作经历、项目、联系方式，查看访问日志和处理留言
- 留言板：访客在主页留言，后台查看；可选邮件提醒；后台可一键关闭

## 相比原项目改了什么

| | 原项目 | 现在 |
|---|---|---|
| 后台 | 命令行 `AdminPanel.java`，每次请求带明文密码 | Web 后台，密码登录换 token，路径级统一鉴权 |
| 页面 | 英文，Bootstrap | 深色 Bento Grid，明暗主题、项目画布、滚动动效与弹窗留言 |
| 内容模型 | 博客 / 技能 / 多职位经历等 | 精简为：基本信息、经历、项目、联系方式、留言 |
| 数据库 | MariaDB，需自行安装 | Docker Compose 一键起 MySQL 8.4；不用 Docker 时可用 H2 |
| 限流 | Bucket4j + Guava | Bucket4j + Caffeine，另加登录失败、留言专用限流 |
| 安全 | 开放 CORS | 同源 + CSP 等安全头，链接协议白名单，蜜罐防机器人 |

## 用 Docker 运行（推荐）

应用和数据库都跑在容器里，本机只需要 Docker，不依赖本机的 JDK / Maven / MySQL。留言提醒直接连接真实 SMTP，不需要 Mailpit。

| 服务 | 镜像 | 本机地址 |
|---|---|---|
| app | 由 `Dockerfile` 构建（容器内 Maven 打包，JRE 17 运行） | http://localhost:8080 ，后台 http://localhost:8080/admin |
| mysql | `mysql:8.4.11`，数据在命名卷 `homepage_mysql-data` | `127.0.0.1:3307`，库 / 用户都是 `homepage` |

```bash
cp .env.example .env      # 填后台、数据库密码；需要邮件提醒时再填 SMTP
docker compose up -d --build
```

首次启动会写入你的初始履历与项目内容，之后都在后台改。端口都只绑定 `127.0.0.1`，局域网访问不到。

常用命令：

```bash
docker compose ps                 # 状态
docker compose logs -f app        # 看应用日志
docker compose up -d --build app  # 改完代码后重新构建并重启应用
docker compose stop               # 停止（数据保留）
docker compose down               # 删除容器（数据卷保留）
docker compose down -v            # 连数据一起删除，谨慎
```

## 不用 Docker 的开发方式

需要本机 JDK 17+，数据存在 `./data/` 下的 H2 文件库（已 gitignore）：

```bash
ADMIN_USERNAME='管理员账号' ADMIN_PASSWORD='换成你的密码' ./mvnw spring-boot:run
```

不设账号时开发环境默认使用 `admin`；不设密码时会随机生成临时密码并打印在启动日志里。生产环境必须同时配置两者。

## 部署到服务器

服务器装好 Docker 后，同样用 `docker compose up -d --build`；`.env` 里换成正式密码并配置真实 SMTP（见 `.env.example`）。
应用用 `prod` 配置运行，表结构由 Hibernate 自动创建（`ddl-auto: update`），没设置 `ADMIN_USERNAME` 或 `ADMIN_PASSWORD` 会拒绝启动。

不用 Docker 的话，`./mvnw -DskipTests package` 打包后：

```bash
export ADMIN_USERNAME='管理员账号'
export ADMIN_PASSWORD='足够长的密码'
export DB_URL='jdbc:mysql://127.0.0.1:3306/homepage?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai'
export DB_USERNAME=homepage
export DB_PASSWORD='数据库密码'
java -jar target/homepage-1.0.0.jar --spring.profiles.active=prod
```

建议前面挂 Nginx 并开启 HTTPS（后台登录会传输密码）：

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

prod 配置开启了 `server.forward-headers-strategy=native`，只信任内网代理传来的 `X-Forwarded-For`，限流按访客真实 IP 计算。

## 配置项

用 Docker 时在不会提交的 `.env` 里配置，变量示例见 `.env.example`。真实 SMTP 授权码不要写进 `.env.example`。

| 环境变量 | 说明 | 默认 |
|---|---|---|
| `ADMIN_USERNAME` | 后台管理员账号 | 生产环境必填 |
| `ADMIN_PASSWORD` | 后台管理员密码 | 生产环境必填 |
| `APP_PORT` | Docker 映射的应用端口 | 8080 |
| `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` | MySQL 密码 | 必填 |
| `NOTIFY_EMAIL` | 新留言通知到这个邮箱 | 空，不发送 |
| `NOTIFY_FROM` | 发件人；设置了 `MAIL_USERNAME` 时优先用后者 | 空 |
| `MAIL_HOST` / `MAIL_PORT` | SMTP 地址与端口 | host 空 / 465 |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP 用户和授权码 | 空 |
| `MAIL_AUTH` | 是否启用 SMTP 认证 | true |
| `MAIL_SSL` | 直接 SSL（常见端口 465） | false |
| `MAIL_STARTTLS` | STARTTLS（常见端口 587） | false |
| `VISITOR_UNIQUE_WINDOW` | 同一 IP 再次计数前的等待时间 | 24h |
| `VISITOR_LOG_RETENTION` | 访问日志保留时间（不影响累计数） | 90d |
| `VISITOR_HASH_SALT` | IP 指纹独立盐值，生产环境必填 | 必填 |

独立访问统计默认对同一 IP 去重 24 小时。每个窗口写入一条持久化访问日志，同一窗口内刷新只增加日志的请求次数；日志仅保存脱敏网段、加盐 SHA-256 指纹、来源站点和粗粒度设备分类，不保存明文 IP、完整来源 URL 或原始 User-Agent。日志默认 90 天自动清理，累计独立访问数不会减少；日志保留期必须大于或等于 IP 去重窗口。

QQ 邮箱通常使用 `MAIL_PORT=465`、`MAIL_SSL=true`；Gmail 等 STARTTLS 服务通常使用 `MAIL_PORT=587`、`MAIL_STARTTLS=true`。修改 `.env` 后执行：

```bash
docker compose up -d --force-recreate app
docker compose logs -f app
```

限流、登录有效期等其它参数见 `src/main/resources/application.yml` 的 `homepage.*`。

## 目录结构

```
docker-compose.yml   app + mysql 编排
Dockerfile           多阶段构建：Maven 打包 → JRE 运行
.env.example         环境变量模板；真实密码只放在 .env
src/main/java/work/huangxin/homepage
├── auth/          后台登录、token、鉴权拦截器
├── ratelimit/     @RateLimit 注解 + Bucket4j 限流
├── domain/        实体：Profile / Experience / Project / ContactLink / Message
├── repository/    Spring Data JPA
├── service/       业务逻辑（主页数据带缓存，后台写操作自动清缓存）
├── controller/    前台页面、留言接口；admin/ 下是后台接口
├── config/        配置、安全头、初始数据
└── common/        统一返回、异常处理、工具类
src/main/resources
├── templates/     前台 Thymeleaf 模板
└── static/        前台 css/js，admin/ 后台单页
```

## 后台接口

除登录外都需要 `Authorization: Bearer <token>`。

| 接口 | 说明 |
|---|---|
| `POST /api/admin/login` | `{"username": "...", "password": "..."}` → token |
| `GET /api/admin/visits?page=0&size=20` | 访问日志分页 |
| `GET/PUT /api/admin/profile` | 基本信息 |
| `GET/POST /api/admin/{experiences,projects,contacts}` | 列表 / 新增 |
| `PUT/DELETE /api/admin/{...}/{id}` | 修改 / 删除 |
| `PUT /api/admin/{...}/order` | 排序，body 为 id 数组 |
| `GET /api/admin/messages?page=0&size=20` | 留言分页 |
| `PUT /api/admin/messages/{id}/read`、`DELETE /api/admin/messages/{id}` | 标记已读 / 删除 |
| `POST /api/messages` | 前台留言（公开，限流） |

## License

MIT，保留原项目版权声明，见 [LICENSE](LICENSE)。
