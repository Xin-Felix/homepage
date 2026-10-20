import { randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ejs from 'ejs';
import express from 'express';
import helmet from 'helmet';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import { createOgImage } from './og-image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://backend:8080';
const SITE_URL = normalizeSiteUrl(process.env.SITE_URL || 'http://localhost:8080');
const MAX_PROXY_BODY = 2 * 1024 * 1024;
const OG_CACHE_TTL_MS = 60 * 60 * 1000;
const OG_CACHE_MAX_ITEMS = 100;
const OG_RATE_LIMIT_PER_MINUTE = 30;
const ogCache = new Map();
const ogInFlight = new Map();
const ogRateState = new Map();

const app = express();
app.disable('x-powered-by');
app.enable('strict routing');
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.set('views', path.join(ROOT, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);

// JSON-LD 使用随机 nonce，保持 script-src 不启用 unsafe-inline。
app.use((req, res, next) => {
  res.locals.cspNonce = randomBytes(16).toString('base64');
  next();
});
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  hsts: false,
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null,
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use((req, res, next) => {
  if (req.path === '/admin' || req.path.startsWith('/admin/')) {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

app.get('/admin', (req, res) => res.redirect(302, '/admin/'));
app.get('/admin/', (req, res) => res.sendFile(path.join(ROOT, 'public/admin/index.html')));
app.post('/admin/markdown-preview', express.json({ limit: '100kb' }), async (req, res) => {
  try {
    await backendJson('/api/admin/me', { method: 'GET' }, req);
    res.json({ status: 'success', data: { html: renderMarkdown(String(req.body?.markdown || '')) } });
  } catch (error) {
    res.status(error.statusCode || 401).json({ status: 'error', reason: error.publicMessage || '未登录或登录已过期' });
  }
});
app.use(express.static(path.join(ROOT, 'public'), { index: false, etag: true }));

app.get('/healthz', (req, res) => res.json({ status: 'UP' }));
app.get('/readyz', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/internal/health`, { signal: AbortSignal.timeout(3000) });
    res.status(response.ok ? 200 : 503).json({ status: response.ok ? 'UP' : 'DOWN' });
  } catch {
    res.status(503).json({ status: 'DOWN' });
  }
});

/** 浏览器同源 /api 透明代理；转发头从可信 req.ip 重建。 */
app.use('/api', async (req, res) => {
  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readRequestBody(req);
    const response = await fetch(`${BACKEND_ORIGIN}${req.originalUrl}`, {
      method: req.method, headers: forwardedHeaders(req), body,
      redirect: 'manual', signal: AbortSignal.timeout(15000),
    });
    for (const name of ['content-type', 'cache-control', 'retry-after', 'x-robots-tag']) {
      const value = response.headers.get(name);
      if (value) res.set(name, value);
    }
    res.status(response.status);
    if (response.body) Readable.fromWeb(response.body).pipe(res);
    else res.end();
  } catch (error) {
    if (!res.headersSent) res.status(error.statusCode || 502)
      .json({ status: 'error', reason: error.publicMessage || '后端服务暂时不可用' });
  }
});

async function renderHome(req, res) {
  const [home, aiProjects] = await Promise.all([
    backendJson('/api/public/home', { method: 'GET' }, req),
    backendJson('/api/public/ai-projects', { method: 'GET' }, req),
  ]);
  home.aiProjects = aiProjects;
  const views = await recordPageVisit(req, home.views);
  const seo = buildSeo({
    title: home.profile.siteTitle,
    description: home.profile.description,
    path: '/', imagePath: '/og/home.png',
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Person', name: home.profile.name,
      url: absolute('/'), jobTitle: 'Java 后端工程师',
      sameAs: home.contacts.map(item => item.href).filter(href => href?.startsWith('http')),
      knowsAbout: home.profile.tags,
    },
  });
  res.render('index', { site: home, p: home.profile, views, year: new Date().getFullYear(), seo });
}
app.get(['/', '/index', '/index.html'], renderHome);
app.head(['/', '/index', '/index.html'], renderHome);

app.get('/projects/:slug', async (req, res, next) => {
  if (!validSlug(req.params.slug)) return next();
  try {
    const [home, project] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson(`/api/public/projects/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    const seo = buildSeo({
      title: `${project.name} · ${home.profile.name}`,
      description: project.description,
      path: `/projects/${project.slug}`, imagePath: `/og/project/${project.slug}.png`, type: 'article',
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'CreativeWork', name: project.name,
        description: project.description, url: absolute(`/projects/${project.slug}`),
        author: { '@type': 'Person', name: home.profile.name }, keywords: project.meta.join(', '),
      },
    });
    res.render('project', {
      p: home.profile, project, contentHtml: renderMarkdown(project.contentMarkdown),
      views, year: new Date().getFullYear(), seo,
    });
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).render('error', { status: 404, message: '这个项目案例不存在或尚未发布。' });
    next(error);
  }
});

app.get('/notes', async (req, res, next) => {
  try {
    const [home, notes] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson('/api/public/notes', { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    const description = '关于后端工程、系统迁移、实时风控与稳定性治理的技术笔记。';
    const seo = buildSeo({
      title: `技术笔记 · ${home.profile.name}`, description, path: '/notes', imagePath: '/og/notes.png',
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: '技术笔记',
        description, url: absolute('/notes'), author: { '@type': 'Person', name: home.profile.name },
      },
    });
    res.render('notes', { p: home.profile, notes, views, year: new Date().getFullYear(), seo });
  } catch (error) { next(error); }
});

app.get('/notes/:slug', async (req, res, next) => {
  if (!validSlug(req.params.slug)) return next();
  try {
    const [home, note] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson(`/api/public/notes/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    const seo = buildSeo({
      title: `${note.title} · ${home.profile.name}`, description: note.summary,
      path: `/notes/${note.slug}`, imagePath: `/og/note/${note.slug}.png`, type: 'article',
      publishedTime: note.publishedAt, modifiedTime: note.updatedAt,
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'TechArticle', headline: note.title,
        description: note.summary, url: absolute(`/notes/${note.slug}`),
        datePublished: note.publishedAt, dateModified: note.updatedAt,
        author: { '@type': 'Person', name: home.profile.name }, keywords: note.tags.join(', '),
      },
    });
    res.render('note', {
      p: home.profile, note, contentHtml: renderMarkdown(note.contentMarkdown),
      views, year: new Date().getFullYear(), formatDate, seo,
    });
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).render('error', { status: 404, message: '这篇技术笔记不存在或尚未发布。' });
    next(error);
  }
});

app.get('/ai', async (req, res, next) => {
  try {
    const [home, projects] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson('/api/public/ai-projects', { method: 'GET' }, req),
    ]);
    if (!projects.length) return next();
    const views = await recordPageVisit(req, home.views);
    const description = 'AI、Agent、RAG、MCP 与模型工程实验项目。';
    const seo = buildSeo({
      title: `AI Lab · ${home.profile.name}`, description, path: '/ai', imagePath: '/og/ai.png',
      jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'AI Lab', description, url: absolute('/ai') },
    });
    res.render('ai', { p: home.profile, projects, views, year: new Date().getFullYear(), seo });
  } catch (error) { next(error); }
});

app.get('/ai/:slug', async (req, res, next) => {
  if (!validSlug(req.params.slug)) return next();
  try {
    const [home, project] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson(`/api/public/ai-projects/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    const seo = buildSeo({
      title: `${project.title} · AI Lab · ${home.profile.name}`, description: project.summary,
      path: `/ai/${project.slug}`, imagePath: `/og/ai/${project.slug}.png`, type: 'article',
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: project.title,
        description: project.summary, url: absolute(`/ai/${project.slug}`),
        applicationCategory: 'DeveloperApplication', author: { '@type': 'Person', name: home.profile.name },
      },
    });
    res.render('ai-detail', {
      p: home.profile, project, contentHtml: renderMarkdown(project.contentMarkdown),
      views, year: new Date().getFullYear(), seo,
    });
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).render('error', { status: 404, message: '这个 AI 项目不存在或尚未发布。' });
    next(error);
  }
});

// 搜索引擎与订阅输出，不记录访问量。
app.get('/robots.txt', (req, res) => res.type('text/plain').send(
  `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${absolute('/sitemap.xml')}\n`));
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const [home, notes, aiProjects] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson('/api/public/notes', { method: 'GET' }, req),
      backendJson('/api/public/ai-projects', { method: 'GET' }, req),
    ]);
    const urls = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/notes', changefreq: 'weekly', priority: '0.8' },
      ...home.projects.filter(p => p.detailPublished && p.slug).map(p => ({ path: `/projects/${p.slug}`, changefreq: 'monthly', priority: '0.8' })),
      ...notes.map(n => ({ path: `/notes/${n.slug}`, lastmod: n.publishedAt, changefreq: 'monthly', priority: '0.7' })),
      ...(aiProjects.length ? [{ path: '/ai', changefreq: 'weekly', priority: '0.7' }] : []),
      ...aiProjects.map(p => ({ path: `/ai/${p.slug}`, changefreq: 'monthly', priority: '0.7' })),
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(sitemapEntry).join('\n')}\n</urlset>`;
    res.type('application/xml').set('Cache-Control', 'public, max-age=1800').send(body);
  } catch (error) { next(error); }
});
app.get(['/rss.xml', '/feed.xml'], async (req, res, next) => {
  try {
    const [home, notes] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson('/api/public/notes', { method: 'GET' }, req),
    ]);
    const items = notes.map(note => `<item><title>${escapeXml(note.title)}</title><link>${escapeXml(absolute(`/notes/${note.slug}`))}</link><guid isPermaLink="true">${escapeXml(absolute(`/notes/${note.slug}`))}</guid><description>${escapeXml(note.summary)}</description><pubDate>${new Date(note.publishedAt).toUTCString()}</pubDate></item>`).join('');
    const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(home.profile.name)}的技术笔记</title><link>${escapeXml(absolute('/notes'))}</link><description>${escapeXml(home.profile.description || '')}</description><language>zh-CN</language>${items}</channel></rss>`;
    res.type('application/rss+xml').set('Cache-Control', 'public, max-age=900').send(rss);
  } catch (error) { next(error); }
});

// 动态 Open Graph PNG：每 IP 限速，按页面 key 缓存并合并并发渲染。
app.get('/og/home.png', ogRateLimit, (req, res, next) => sendOg('home', req, res, next, async () => {
  const home = await backendJson('/api/public/home', { method: 'GET' }, req);
  return { title: home.profile.siteTitle, description: home.profile.description, kicker: 'HUANGXIN.WORK · PORTFOLIO' };
}));
app.get('/og/notes.png', ogRateLimit, (req, res, next) => sendOg('notes', req, res, next, async () => ({
  title: '技术笔记', description: '系统设计、迁移实践、实时风控与稳定性治理', kicker: 'ENGINEERING NOTES',
})));
app.get('/og/ai.png', ogRateLimit, (req, res, next) => sendOg('ai', req, res, next, async () => ({
  title: 'AI Lab', description: 'AI、Agent、RAG、MCP 与模型工程实验', kicker: 'HUANGXIN.WORK · AI LAB',
})));
app.get('/og/project/:slug.png', ogRateLimit, (req, res, next) => sendOg(`project:${req.params.slug}`, req, res, next, async () => {
  const project = await backendJson(`/api/public/projects/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req);
  return { title: project.name, description: project.description, kicker: 'PROJECT CASE STUDY' };
}));
app.get('/og/note/:slug.png', ogRateLimit, (req, res, next) => sendOg(`note:${req.params.slug}`, req, res, next, async () => {
  const note = await backendJson(`/api/public/notes/${encodeURIComponent(req.params.slug)}?count=false`, { method: 'GET' }, req);
  return { title: note.title, description: note.summary, kicker: 'ENGINEERING NOTE' };
}));
app.get('/og/ai/:slug.png', ogRateLimit, (req, res, next) => sendOg(`ai:${req.params.slug}`, req, res, next, async () => {
  const project = await backendJson(`/api/public/ai-projects/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req);
  return { title: project.title, description: project.summary, kicker: 'AI LAB · EXPERIMENT' };
}));

app.use((req, res) => res.status(404).render('error', { status: 404, message: '你要找的页面不存在。' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.statusCode || 500).render('error', {
    status: error.statusCode || 500,
    message: error.publicMessage || '服务暂时不可用，请稍后再试。',
  });
});

function ogRateLimit(req, res, next) {
  const now = Date.now();
  let state = ogRateState.get(req.ip);
  if (!state || now - state.startedAt >= 60_000) {
    state = { startedAt: now, count: 0 };
    ogRateState.set(req.ip, state);
  }
  state.count++;
  if (state.count > OG_RATE_LIMIT_PER_MINUTE) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((60_000 - (now - state.startedAt)) / 1000))));
    return res.status(429).end();
  }
  if (ogRateState.size > 10_000) {
    for (const [key, value] of ogRateState) if (now - value.startedAt >= 60_000) ogRateState.delete(key);
  }
  next();
}

async function sendOg(cacheKey, req, res, next, contentLoader) {
  res.type('image/png').set('Cache-Control', 'public, max-age=3600');
  if (req.method === 'HEAD') return res.end();
  try {
    const now = Date.now();
    let cached = ogCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      // Map 删除再插入以维持简单 LRU 顺序。
      ogCache.delete(cacheKey);
      ogCache.set(cacheKey, cached);
      return res.send(cached.png);
    }
    if (cached) ogCache.delete(cacheKey);

    let rendering = ogInFlight.get(cacheKey);
    if (!rendering) {
      rendering = Promise.resolve().then(contentLoader).then(createOgImage);
      ogInFlight.set(cacheKey, rendering);
    }
    const png = await rendering;
    ogInFlight.delete(cacheKey);
    ogCache.set(cacheKey, { png, expiresAt: now + OG_CACHE_TTL_MS });
    while (ogCache.size > OG_CACHE_MAX_ITEMS) ogCache.delete(ogCache.keys().next().value);
    return res.send(png);
  } catch (error) {
    ogInFlight.delete(cacheKey);
    if (error.statusCode === 404) return res.status(404).end();
    next(error);
  }
}

function buildSeo({ title, description, path: pagePath, imagePath, type = 'website', jsonLd, publishedTime, modifiedTime }) {
  return {
    title, description: description || '', type,
    canonical: absolute(pagePath), image: absolute(imagePath),
    publishedTime, modifiedTime,
    jsonLd: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  };
}

function sitemapEntry(entry) {
  return `<url><loc>${escapeXml(absolute(entry.path))}</loc>${entry.lastmod ? `<lastmod>${escapeXml(String(entry.lastmod).slice(0, 10))}</lastmod>` : ''}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`;
}
function absolute(urlPath) { return new URL(urlPath, `${SITE_URL}/`).toString(); }
function validSlug(value) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
function normalizeSiteUrl(value) {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('SITE_URL 必须是 http/https 地址');
  return parsed.toString().replace(/\/$/, '');
}
function escapeXml(value) {
  return String(value ?? '').replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
}
function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
function renderMarkdown(markdown) {
  const unsafe = marked.parse(markdown || '', { gfm: true, breaks: false });
  return sanitizeHtml(unsafe, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'del', 'a', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title'] }, allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: { a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }) },
  });
}

async function recordPageVisit(req, fallbackViews) {
  if (req.method === 'HEAD') return fallbackViews;
  try {
    const counted = await backendJson('/api/public/visits', { method: 'POST', body: JSON.stringify({ path: req.path }) }, req);
    return counted.views;
  } catch (error) {
    console.error('visit tracking failed:', error.message);
    return fallbackViews;
  }
}
function forwardedHeaders(req) {
  const headers = { accept: req.get('accept') || 'application/json', 'user-agent': req.get('user-agent') || '', 'x-forwarded-for': req.ip, 'x-forwarded-proto': req.protocol, 'x-forwarded-host': req.get('host') || '' };
  for (const name of ['authorization', 'content-type', 'referer']) { const value = req.get(name); if (value) headers[name] = value; }
  return headers;
}
async function backendJson(apiPath, options, req) {
  const headers = forwardedHeaders(req); headers.accept = 'application/json';
  if (options.body) headers['content-type'] = 'application/json';
  const response = await fetch(`${BACKEND_ORIGIN}${apiPath}`, { ...options, headers, signal: AbortSignal.timeout(10000) });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.status !== 'success') {
    const error = new Error(payload?.reason || `backend responded ${response.status}`);
    error.statusCode = response.status >= 500 ? 503 : response.status;
    error.publicMessage = response.status >= 500 ? '服务暂时不可用，请稍后再试。' : payload?.reason;
    throw error;
  }
  return payload.data;
}
async function readRequestBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_PROXY_BODY) { const error = new Error('request body too large'); error.statusCode = 413; error.publicMessage = '请求内容过大'; throw error; }
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

const server = app.listen(PORT, '0.0.0.0', () => console.log(`frontend listening on :${PORT}, backend=${BACKEND_ORIGIN}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
