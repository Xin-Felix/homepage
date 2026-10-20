import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ejs from 'ejs';
import express from 'express';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://backend:8080';
const MAX_PROXY_BODY = 2 * 1024 * 1024;

const app = express();
app.disable('x-powered-by');
app.enable('strict routing');
// 只信任本机、Docker 私网和链路本地代理；不能直接使用 true，否则客户端可伪造 IP。
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.set('views', path.join(ROOT, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  hsts: false,
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
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

// 管理后台目录路由必须先于静态中间件，避免 express.static 对目录做额外重定向。
app.get('/admin', (req, res) => res.redirect(302, '/admin/'));
app.get('/admin/', (req, res) => res.sendFile(path.join(ROOT, 'public/admin/index.html')));
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
 * 不转发客户端自带的 Forwarded/X-Forwarded-*，而是从 Express 的可信代理结果重建。
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
    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(error.statusCode || 502).json({ status: 'error', reason: error.publicMessage || '后端服务暂时不可用' });
    }
  }
});

async function renderHome(req, res) {
  const home = await backendJson('/api/public/home', { method: 'GET' }, req);
  let views = home.views;
  if (req.method !== 'HEAD') {
    try {
      const counted = await backendJson('/api/public/visits', {
        method: 'POST',
        body: JSON.stringify({ path: req.path }),
      }, req);
      views = counted.views;
    } catch (error) {
      // 统计失败不应让公开主页不可用；错误仍会进入容器日志供排查。
      console.error('visit tracking failed:', error.message);
    }
  }
  res.render('index', { site: home, p: home.profile, views, year: new Date().getFullYear() });
}

app.get(['/', '/index', '/index.html'], renderHome);
app.head(['/', '/index', '/index.html'], renderHome);

app.use((req, res) => res.status(404).render('error', { status: 404, message: '你要找的页面不存在。' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.statusCode || 500).render('error', {
    status: error.statusCode || 500,
    message: error.publicMessage || '服务暂时不可用，请稍后再试。',
  });
});

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
    ...options,
    headers,
    signal: AbortSignal.timeout(10000),
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
