import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ejs from 'ejs';
import express from 'express';
import helmet from 'helmet';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://backend:8080';
const MAX_PROXY_BODY = 2 * 1024 * 1024;

const app = express();
app.disable('x-powered-by');
app.enable('strict routing');
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.set('views', path.join(ROOT, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  hsts: false, // TLS/HSTS 由公网最外层反向代理负责。
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
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

/** Markdown 预览不读取业务数据，但仍要求有效后台 token。 */
app.post('/admin/markdown-preview', express.json({ limit: '100kb' }), async (req, res) => {
  try {
    await backendJson('/api/admin/me', { method: 'GET' }, req);
    res.json({ status: 'success', data: { html: renderMarkdown(String(req.body?.markdown || '')) } });
  } catch (error) {
    res.status(error.statusCode || 401).json({ status: 'error', reason: error.publicMessage || '未登录或登录已过期' });
  }
});

app.use(express.static(path.join(ROOT, 'public'), { index: false, etag: true }));

/** 不访问业务页面、不污染访问统计的容器健康检查。 */
app.get('/healthz', (req, res) => res.json({ status: 'UP' }));
app.get('/readyz', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/internal/health`, { signal: AbortSignal.timeout(3000) });
    res.status(response.ok ? 200 : 503).json({ status: response.ok ? 'UP' : 'DOWN' });
  } catch {
    res.status(503).json({ status: 'DOWN' });
  }
});

/**
 * 浏览器始终同源访问 /api；frontend 透明转发到内部 backend。
 * 客户端原始转发头不会透传，而是从 Express 的可信代理结果重建。
 */
app.use('/api', async (req, res) => {
  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readRequestBody(req);
    const response = await fetch(`${BACKEND_ORIGIN}${req.originalUrl}`, {
      method: req.method,
      headers: forwardedHeaders(req),
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    for (const name of ['content-type', 'cache-control', 'retry-after', 'x-robots-tag']) {
      const value = response.headers.get(name);
      if (value) res.set(name, value);
    }
    res.status(response.status);
    if (response.body) Readable.fromWeb(response.body).pipe(res);
    else res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(error.statusCode || 502).json({ status: 'error', reason: error.publicMessage || '后端服务暂时不可用' });
    }
  }
});

async function renderHome(req, res) {
  const [home, aiProjects] = await Promise.all([
    backendJson('/api/public/home', { method: 'GET' }, req),
    backendJson('/api/public/ai-projects', { method: 'GET' }, req),
  ]);
  home.aiProjects = aiProjects;
  const views = await recordPageVisit(req, home.views);
  res.render('index', { site: home, p: home.profile, views, year: new Date().getFullYear() });
}

app.get(['/', '/index', '/index.html'], renderHome);
app.head(['/', '/index', '/index.html'], renderHome);

app.get('/projects/:slug', async (req, res, next) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug)) return next();
  try {
    const [home, project] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson(`/api/public/projects/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    res.render('project', {
      p: home.profile,
      project,
      contentHtml: renderMarkdown(project.contentMarkdown),
      views,
      year: new Date().getFullYear(),
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).render('error', { status: 404, message: '这个项目案例不存在或尚未发布。' });
    }
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
    res.render('notes', { p: home.profile, notes, views, year: new Date().getFullYear() });
  } catch (error) {
    next(error);
  }
});

app.get('/notes/:slug', async (req, res, next) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug)) return next();
  try {
    const [home, note] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson(`/api/public/notes/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    res.render('note', {
      p: home.profile, note, contentHtml: renderMarkdown(note.contentMarkdown),
      views, year: new Date().getFullYear(), formatDate,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).render('error', { status: 404, message: '这篇技术笔记不存在或尚未发布。' });
    }
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
    res.render('ai', { p: home.profile, projects, views, year: new Date().getFullYear() });
  } catch (error) { next(error); }
});

app.get('/ai/:slug', async (req, res, next) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug)) return next();
  try {
    const [home, project] = await Promise.all([
      backendJson('/api/public/home', { method: 'GET' }, req),
      backendJson(`/api/public/ai-projects/${encodeURIComponent(req.params.slug)}`, { method: 'GET' }, req),
    ]);
    const views = await recordPageVisit(req, home.views);
    res.render('ai-detail', {
      p: home.profile, project, contentHtml: renderMarkdown(project.contentMarkdown),
      views, year: new Date().getFullYear(),
    });
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).render('error', { status: 404, message: '这个 AI 项目不存在或尚未发布。' });
    next(error);
  }
});

app.use((req, res) => res.status(404).render('error', { status: 404, message: '你要找的页面不存在。' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.statusCode || 500).render('error', {
    status: error.statusCode || 500,
    message: error.publicMessage || '服务暂时不可用，请稍后再试。',
  });
});

async function recordPageVisit(req, fallbackViews) {
  if (req.method === 'HEAD') return fallbackViews;
  try {
    const counted = await backendJson('/api/public/visits', {
      method: 'POST', body: JSON.stringify({ path: req.path }),
    }, req);
    return counted.views;
  } catch (error) {
    console.error('visit tracking failed:', error.message);
    return fallbackViews;
  }
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}

function renderMarkdown(markdown) {
  const unsafe = marked.parse(markdown || '', { gfm: true, breaks: false });
  return sanitizeHtml(unsafe, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'strong', 'em', 'del', 'a', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
    },
  });
}

function forwardedHeaders(req) {
  const headers = {
    accept: req.get('accept') || 'application/json',
    'user-agent': req.get('user-agent') || '',
    'x-forwarded-for': req.ip,
    'x-forwarded-proto': req.protocol,
    'x-forwarded-host': req.get('host') || '',
  };
  for (const name of ['authorization', 'content-type', 'referer']) {
    const value = req.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

async function backendJson(apiPath, options, req) {
  const headers = forwardedHeaders(req);
  headers.accept = 'application/json';
  if (options.body) headers['content-type'] = 'application/json';
  const response = await fetch(`${BACKEND_ORIGIN}${apiPath}`, {
    ...options, headers, signal: AbortSignal.timeout(10000),
  });
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
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_PROXY_BODY) {
      const error = new Error('request body too large');
      error.statusCode = 413;
      error.publicMessage = '请求内容过大';
      throw error;
    }
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`frontend listening on :${PORT}, backend=${BACKEND_ORIGIN}`);
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
