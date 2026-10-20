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

检查：

```bash
docker compose ps
curl -fsS http://127.0.0.1:8080/healthz
curl -fsS http://127.0.0.1:8080/readyz
```

## 更新

```bash
git pull
docker compose up -d --build frontend backend
docker compose ps
```

## Nginx

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

公网必须使用 HTTPS，尤其是 `/admin` 登录页面。

## 数据备份

```bash
docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction homepage' \
  > homepage-$(date +%Y%m%d-%H%M%S).sql
```

恢复前请停止 backend，并先备份当前数据库。不要执行 `docker compose down -v`，除非明确要删除所有数据。
