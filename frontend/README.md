# Frontend

独立的 Node.js + Express + EJS SSR 前端。

- 页面和静态资源由本服务提供；
- 浏览器的 `/api/**` 请求同源转发到 Spring Boot backend；
- 页面数据在服务端请求 backend 后渲染，兼顾 SEO 与前后端边界；
- 动态输出 Sitemap、RSS、JSON-LD 和 Open Graph PNG；
- frontend 不持有数据库、管理员、SMTP 或访问指纹密钥。

开发环境由根目录 Docker Compose 统一启动，避免依赖宿主机 Node.js。
