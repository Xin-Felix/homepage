# Docker 部署

## 首次部署

```bash
git clone -b feat/personal-homepage https://github.com/Xin-Felix/homepage.git
cd homepage
cp .env.example .env
openssl rand -hex 32   # VISITOR_HASH_SALT
openssl rand -hex 32   # TOTP_ENCRYPTION_KEY
# 编辑 .env，并把 SITE_URL 改为最终 HTTPS 域名
docker compose up -d --build
```

前端 Dockerfile 使用固定 Node.js 镜像、`package-lock.json` 和 `npm ci`，先执行 `nuxt typecheck` 再构建 Nuxt `.output`；宿主机无需安装 Node.js、JDK、Maven 或 MySQL。

检查：

```bash
docker compose ps
curl -fsS http://127.0.0.1:8080/healthz
curl -fsS http://127.0.0.1:8080/readyz
curl -I http://127.0.0.1:8080/admin       # 应为 302 → /admin/
curl -I http://127.0.0.1:8080/admin/      # 应为 200、no-store、noindex
curl -I http://127.0.0.1:8080/og/home.png # 应为 200 image/png
```

确认 `/`、项目详情、`/notes` 和后台能打开；没有已发布 AI 项目时 `/ai` 返回 404 属于预期行为。

## 更新

更新前先按下方“数据备份”生成 MySQL 备份，再执行：

```bash
git pull
docker compose up -d --build frontend backend
docker compose ps
```

backend 启动时会检查 `db/content-updates/`：只有仍与上一版仓库默认文案一致的字段才会升级，后台自行编辑过的内容不会被覆盖，也不会重置访问数、排序或显隐状态。

只修改 Vue/Nuxt 前端时可单独更新，不重建 backend 或 MySQL：

```bash
docker compose build frontend
docker compose up -d --no-deps frontend
```

上述操作不会改变 `homepage_mysql-data`。不要为了更新代码执行 `docker compose down -v`。

## Nginx

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

公网必须使用 HTTPS，尤其是 `/admin/` 登录页面。`SITE_URL` 必须填写最终 HTTPS 根地址且不带尾斜杠，例如 `https://huangxin.work`，否则 SSR canonical、RSS、Sitemap 和分享图 URL 会指向本地地址。

## 数据备份

```bash
docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction homepage' \
  > homepage-$(date +%Y%m%d-%H%M%S).sql
```

恢复前请停止 backend，并先备份当前数据库。不要执行 `docker compose down -v`，除非明确要删除所有数据。
