# 后台安全与 TOTP

## 登录链路

后台使用固定管理员账号、密码和可选 TOTP。登录成功后签发随机 Bearer token，保存在服务端内存和浏览器 `sessionStorage`，默认 12 小时过期，backend 重启后全部失效。

同一 IP 的登录验证与失败记账位于同一互斥区：连续失败 5 次后锁定 15 分钟；账号、密码、TOTP 缺失或错误使用统一 401 文案。

## 启用 TOTP

1. 用账号和密码登录后台；
2. 打开“安全设置”；
3. 再次输入密码，生成二维码；
4. 使用 Google Authenticator、Microsoft Authenticator、1Password 等扫描；
5. 输入当前 6 位验证码确认；
6. 所有旧 token 会被撤销，重新使用三项凭据登录。

二维码和手工密钥只在受 Bearer token 保护的响应中返回，不调用第三方二维码服务，也不会写入浏览器存储。

## 密钥存储与防重放

- TOTP secret 使用 AES-256-GCM、随机 96-bit nonce 和用途绑定 AAD 加密；
- `TOTP_ENCRYPTION_KEY` 只注入 backend，不进入 frontend 或数据库；
- pending secret 与 active secret 分离，未确认的绑定不会覆盖现有凭据；
- 数据库保存最后一次接受的 TOTP 时间步，同一码不能重复登录；
- 服务器允许前后各一个 30 秒时间步，部署机器必须保持 NTP 对时。

请将 `.env`/Secret Manager 中的 `TOTP_ENCRYPTION_KEY` 与 MySQL 备份分开保存。丢失该密钥后无法解密已有 TOTP secret。

## 丢失设备的离线恢复

当前不提供公开恢复接口，避免它成为绕过 TOTP 的后门。恢复期间必须保持公网入口关闭，并同时轮换已经暴露风险的后台密码：

```bash
# 1. 先停止公网入口和应用，避免出现密码单因子登录窗口
docker compose stop frontend backend

# 2. 修改 .env 中的 ADMIN_PASSWORD 为全新强密码

# 3. 清除失效的 TOTP 绑定
docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot homepage -e "DELETE FROM admin_totp_credential;"'

# 4. 用新 .env 重建容器，但先不要恢复公网 Nginx/负载均衡入口
docker compose up -d --force-recreate backend frontend
```

随后只通过服务器本机或 SSH 隧道访问 `127.0.0.1:8080/admin`，使用新密码登录并重新绑定 TOTP。确认三因子登录成功后再恢复公网入口。操作前建议备份数据库。

## 部署建议

- 公网必须使用 HTTPS；
- backend 不映射宿主端口；
- 定期更换后台密码，但不要随意丢失 TOTP 加密密钥；
- 单 backend 实例下 IP 锁定状态位于内存；横向扩容前应迁移到 Redis/MySQL 共享状态；
- 真实秘密只写 `.env` 或 Secret Manager，不提交 Git。
