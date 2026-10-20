# SEO、RSS 与分享图

## SITE_URL

生产环境必须把 `.env` 中的 `SITE_URL` 设置为最终 HTTPS 根地址，例如：

```env
SITE_URL=https://huangxin.work
```

Canonical、Open Graph、Sitemap、RSS 和 JSON-LD URL 都从该值生成。改动后重建 frontend。

## 输出

- `/robots.txt`：禁止抓取后台/API，并声明 Sitemap；
- `/sitemap.xml`：主页、已发布项目案例、笔记和 AI Lab；
- `/rss.xml`、`/feed.xml`：已发布技术笔记 RSS 2.0；
- 页面 `<head>`：Canonical、Open Graph、Twitter Card、JSON-LD；
- `/og/home.png`、`/og/notes.png`、`/og/project/{slug}.png`、`/og/note/{slug}.png`、`/og/ai/{slug}.png`：1200×630 动态 PNG。

JSON-LD 类型：主页 `Person`、项目 `CreativeWork`、技术文章 `TechArticle`、AI 项目 `SoftwareApplication`。JSON-LD 使用每请求 CSP nonce，不开放内联可执行脚本。

## 分享图

frontend 使用 `@resvg/resvg-js` 在本地把 SVG 模板渲染为 PNG，容器安装 Noto CJK 字体以支持中文。生成过程不请求第三方制图服务。图片在应用内使用最多 100 项、1 小时的 LRU 缓存；同一图片的并发请求会合并，并按 IP 限制为每分钟 30 次，避免同步渲染阻塞服务。

## 上线检查

```bash
curl -I https://your-domain.example/og/home.png
curl https://your-domain.example/sitemap.xml
curl https://your-domain.example/rss.xml
```

还应在搜索引擎站长平台提交 Sitemap，并使用各社交平台的分享调试工具刷新旧缓存。
