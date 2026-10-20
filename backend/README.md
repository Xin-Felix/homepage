# Backend

独立 Spring Boot REST 后端，负责领域模型、数据库、认证、限流、访问统计和邮件。

- `/api/public/**`：前台 SSR 使用的白名单接口；
- `/api/admin/**`：Bearer token 保护的管理接口；
- `/api/messages`：公开留言接口；
- `/internal/health`：仅供容器内健康检查。

后端不再托管 HTML、CSS 或 JavaScript，也不映射到宿主端口。
