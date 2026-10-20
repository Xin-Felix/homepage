/*
 * 主页管理后台（无构建步骤的原生 JS 单页）。
 * 所有用户数据都通过 textContent 写入 DOM，不拼接 innerHTML，避免留言内容造成 XSS。
 */
(() => {
  'use strict';

  const TOKEN_KEY = 'homepage.admin.token';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** 创建 DOM 元素：h('div', {class: 'x', onclick: fn}, '文本', childNode) */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  // ---------------------------------------------------------------- API

  const getToken = () => sessionStorage.getItem(TOKEN_KEY);
  const setToken = (token) => (token ? sessionStorage.setItem(TOKEN_KEY, token) : sessionStorage.removeItem(TOKEN_KEY));

  async function api(method, path, body) {
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const init = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(path, init);
    } catch (_) {
      throw new Error('网络异常，请检查服务是否在运行');
    }
    const json = await res.json().catch(() => null);
    if (res.status === 401 && path !== '/api/admin/login') {
      setToken(null);
      showLogin('登录已过期，请重新登录');
      throw new Error('登录已过期，请重新登录');
    }
    if (!res.ok || !json || json.status !== 'success') {
      const err = new Error((json && json.reason) || `请求失败（HTTP ${res.status}）`);
      err.fields = (json && json.invalidFields) || null;
      throw err;
    }
    return json.data;
  }

  // ---------------------------------------------------------------- 提示

  let toastTimer;
  function toast(message, type) {
    const el = $('#toast');
    el.textContent = message;
    el.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2600);
  }

  // ---------------------------------------------------------------- 表单配置

  const PROFILE_FIELDS = [
    { key: 'name', label: '名字', required: true, max: 30 },
    { key: 'siteTitle', label: '网页标题', required: true, max: 60, hint: '浏览器标签页和搜索结果里显示的标题' },
    { key: 'greeting', label: '问候语', max: 30, placeholder: '你好，我是' },
    { key: 'intro', label: '一句话介绍', type: 'textarea', rows: 2, required: true, max: 300, hint: '显示在名字下方' },
    { key: 'tags', label: '技能标签', type: 'list', placeholder: 'Java, Spring Boot, MySQL', hint: '用逗号分隔' },
    { key: 'about', label: '关于我', type: 'textarea', rows: 6, max: 2000, hint: '每行一段' },
    { key: 'description', label: 'SEO 描述', type: 'textarea', rows: 2, max: 300, hint: '搜索引擎结果里的摘要' },
    { key: 'keywords', label: 'SEO 关键词', max: 200, placeholder: '用逗号分隔' },
    { key: 'footerText', label: '页脚文字', max: 100, hint: '会显示为「© 年份 + 这里的文字」' },
    { key: 'messageEnabled', label: '在主页开放留言', type: 'checkbox' },
  ];

  const VISIBLE_FIELD = { key: 'visible', label: '在主页显示', type: 'checkbox', default: true };

  const RESOURCES = {
    experiences: {
      title: '工作经历',
      desc: '按列表顺序显示在主页时间线上',
      noun: '经历',
      path: '/api/admin/experiences',
      fields: [
        { key: 'period', label: '时间', required: true, max: 50, placeholder: '2022.07 — 至今' },
        { key: 'role', label: '职位 / 角色', required: true, max: 50, placeholder: 'Java 后端工程师' },
        { key: 'org', label: '公司 / 组织', max: 50, hint: '可留空' },
        { key: 'description', label: '描述', type: 'textarea', max: 1000 },
        VISIBLE_FIELD,
      ],
      summary: (e) => ({ title: e.org ? `${e.role} · ${e.org}` : e.role, sub: e.period }),
    },
    projects: {
      title: '开源与项目',
      desc: '首页卡片与 Markdown 案例详情',
      noun: '项目',
      path: '/api/admin/projects',
      fields: [
        { key: 'name', label: '项目名称', required: true, max: 50 },
        { key: 'slug', label: '详情路径', max: 80, placeholder: 'product-migration', hint: '仅小写字母、数字和连字符；发布详情时必填' },
        { key: 'link', label: '外部链接', type: 'url', max: 300, placeholder: 'https://github.com/…', hint: '可留空' },
        { key: 'description', label: '卡片摘要', type: 'textarea', rows: 3, max: 1000 },
        { key: 'role', label: '我的角色', max: 100, placeholder: '技术负责人' },
        { key: 'period', label: '项目时间', max: 50, placeholder: '2025.05 — 2025.08' },
        { key: 'meta', label: '卡片标签', type: 'list', placeholder: 'Java, 灰度迁移, 15,000+ 商品', hint: '用逗号分隔，显示在卡片和详情页' },
        { key: 'contentMarkdown', label: '案例详情（Markdown）', type: 'textarea', rows: 16, max: 50000, hint: '支持标题、列表、引用、代码块、表格和链接' },
        { key: 'detailPublished', label: '发布案例详情', type: 'checkbox' },
        VISIBLE_FIELD,
      ],
      summary: (p) => ({ title: p.name, sub: p.slug ? `/projects/${p.slug}` : (p.link || '仅首页卡片') }),
    },
    notes: {
      title: '技术笔记',
      desc: 'Markdown 技术文章，草稿不会出现在公开页面',
      noun: '笔记',
      path: '/api/admin/notes',
      sortable: false,
      fields: [
        { key: 'title', label: '标题', required: true, max: 120 },
        { key: 'slug', label: '文章路径', required: true, max: 100, placeholder: 'system-migration-double-write' },
        { key: 'summary', label: '摘要', type: 'textarea', rows: 3, required: true, max: 500 },
        { key: 'tags', label: '标签', type: 'list', placeholder: '系统迁移, 双写, 灰度' },
        { key: 'contentMarkdown', label: '正文（Markdown）', type: 'textarea', rows: 18, required: true, max: 100000 },
        { key: 'published', label: '公开发布', type: 'checkbox' },
      ],
      summary: (n) => ({ title: n.title, sub: `${n.published ? '已发布' : '草稿'} · /notes/${n.slug} · 阅读 ${n.readCount || 0}` }),
    },
    'ai-projects': {
      title: 'AI Lab',
      desc: '没有公开项目时，前台入口和区块会自动隐藏',
      noun: 'AI 项目',
      path: '/api/admin/ai-projects',
      fields: [
        { key: 'title', label: '项目名称', required: true, max: 100 },
        { key: 'slug', label: '详情路径', max: 100, placeholder: 'my-ai-agent' },
        { key: 'summary', label: '一句话介绍', type: 'textarea', rows: 3, required: true, max: 500 },
        { key: 'status', label: '项目状态', type: 'select', options: [
          ['IDEA', '构思中'], ['BUILDING', '开发中'], ['LIVE', '已上线'], ['ARCHIVED', '已归档'],
        ] },
        { key: 'models', label: '模型 / 服务', max: 100, placeholder: 'Claude / GPT / 本地模型' },
        { key: 'stack', label: '技术栈', type: 'list', placeholder: 'RAG, Agent, MCP, Spring AI' },
        { key: 'demoUrl', label: '在线体验', type: 'url', max: 300, placeholder: 'https://…' },
        { key: 'repoUrl', label: '代码仓库', type: 'url', max: 300, placeholder: 'https://github.com/…' },
        { key: 'contentMarkdown', label: '项目详情（Markdown）', type: 'textarea', rows: 18, max: 100000 },
        { key: 'visible', label: '公开发布', type: 'checkbox', default: false },
      ],
      summary: (p) => ({ title: p.title, sub: `${p.status} · ${p.visible ? `/ai/${p.slug}` : '未公开'}` }),
    },
    contacts: {
      title: '联系方式',
      desc: '主页「联系我」里的条目',
      noun: '联系方式',
      path: '/api/admin/contacts',
      fields: [
        { key: 'label', label: '名称', required: true, max: 20, placeholder: 'GitHub / Email / 微信' },
        { key: 'text', label: '显示文字', required: true, max: 100 },
        { key: 'href', label: '链接', max: 300, placeholder: 'https://…  或  mailto:…', hint: '留空则只显示文字（比如微信号）' },
        VISIBLE_FIELD,
      ],
      summary: (c) => ({ title: `${c.label}：${c.text}`, sub: c.href || '无链接，仅显示文字' }),
    },
  };

  let fieldSeq = 0;

  function buildFields(fields, values) {
    const frag = document.createDocumentFragment();
    for (const f of fields) {
      const id = `fld-${++fieldSeq}`;
      const value = values[f.key];
      const error = h('div', { class: 'field-error', 'data-error-for': f.key, id: id + '-err' });

      if (f.type === 'checkbox') {
        const input = h('input', { type: 'checkbox', id, name: f.key });
        input.checked = value === undefined || value === null ? !!f.default : !!value;
        frag.append(h('div', { class: 'field check', 'data-field': f.key }, input, h('label', { for: id }, f.label), error));
        continue;
      }

      if (f.type === 'select') {
        const select = h('select', { id, name: f.key, required: !!f.required });
        for (const [optionValue, optionLabel] of f.options || []) {
          const option = h('option', { value: optionValue }, optionLabel);
          if (optionValue === value) option.selected = true;
          select.append(option);
        }
        frag.append(h('div', { class: 'field', 'data-field': f.key },
          h('label', { for: id }, f.label), select, error));
        continue;
      }

      const common = {
        id,
        name: f.key,
        maxlength: f.max,
        required: !!f.required,
        placeholder: f.placeholder,
        'aria-describedby': id + '-err' + (f.hint ? ` ${id}-hint` : ''),
      };
      const input = f.type === 'textarea'
        ? h('textarea', { ...common, rows: f.rows || 4 })
        : h('input', { ...common, type: f.type === 'url' ? 'url' : 'text' });
      input.value = f.type === 'list' ? (value || []).join(', ') : (value ?? '');

      frag.append(h('div', { class: 'field', 'data-field': f.key },
        h('label', { for: id }, f.label, f.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, '*') : null),
        input,
        f.hint ? h('small', { class: 'hint', id: id + '-hint' }, f.hint) : null,
        error));
    }
    return frag;
  }

  function readFields(form, fields) {
    const data = {};
    for (const f of fields) {
      const el = form.elements.namedItem(f.key);
      if (f.type === 'checkbox') data[f.key] = el.checked;
      else if (f.type === 'list') data[f.key] = el.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      else data[f.key] = el.value.trim();
    }
    return data;
  }

  /** 把后端返回的 invalidFields 显示到对应字段下面 */
  function showFieldErrors(form, fieldErrors) {
    $$('.field', form).forEach((el) => el.classList.remove('invalid'));
    $$('.field-error', form).forEach((el) => { el.textContent = ''; });
    if (!fieldErrors) return;
    let first = null;
    for (const [path, message] of Object.entries(fieldErrors)) {
      const key = path.split(/[.[]/)[0];
      const slot = form.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
      if (!slot) continue;
      slot.textContent = message;
      slot.parentElement.classList.add('invalid');
      first = first || slot.parentElement.querySelector('input, textarea');
    }
    if (first) first.focus();
  }

  function panelHead(title, desc, ...actions) {
    return h('div', { class: 'panel-head' },
      h('div', {}, h('h2', {}, title), desc ? h('p', {}, desc) : null),
      actions.length ? h('div', { class: 'row-actions' }, ...actions) : null);
  }

  // ---------------------------------------------------------------- 路由

  const state = { analyticsDays: 30, visitPage: 0, messagePage: 0 };
  let renderSeq = 0;

  const TABS = {
    dashboard: renderDashboard,
    visits: () => renderVisits(state.visitPage),
    profile: renderProfile,
    experiences: () => renderList('experiences'),
    projects: () => renderList('projects'),
    notes: () => renderList('notes'),
    'ai-projects': () => renderList('ai-projects'),
    contacts: () => renderList('contacts'),
    messages: () => renderMessages(state.messagePage),
  };

  function currentTab() {
    const tab = location.hash.slice(1);
    return Object.prototype.hasOwnProperty.call(TABS, tab) ? tab : 'dashboard';
  }

  /** 渲染面板；快速切换时只保留最后一次的结果 */
  async function show(render, { focus = false } = {}) {
    const seq = ++renderSeq;
    const panel = $('#panel');
    panel.setAttribute('aria-busy', 'true');
    try {
      const node = await render();
      if (seq !== renderSeq) return;
      panel.replaceChildren(node);
      if (focus) {
        // 切换标签时回到顶部，并把焦点交给面板（不触发浏览器自动滚动，否则标题会被吸顶栏挡住）
        window.scrollTo(0, 0);
        panel.focus({ preventScroll: true });
      }
    } catch (err) {
      if (seq !== renderSeq) return;
      panel.replaceChildren(h('div', { class: 'empty' }, err.message));
    } finally {
      if (seq === renderSeq) panel.removeAttribute('aria-busy');
    }
    refreshUnreadBadge();
  }

  function route(options) {
    const tab = currentTab();
    $$('.nav-item').forEach((a) => {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    return show(TABS[tab], options);
  }

  async function refreshUnreadBadge() {
    try {
      const d = await api('GET', '/api/admin/dashboard');
      const badge = $('#unread-badge');
      badge.textContent = String(d.unreadMessages);
      badge.hidden = d.unreadMessages === 0;
      badge.setAttribute('aria-label', `${d.unreadMessages} 条未读`);
    } catch (_) { /* 忽略 */ }
  }

  // ---------------------------------------------------------------- 概览

  async function renderDashboard() {
    const [d, analytics] = await Promise.all([
      api('GET', '/api/admin/dashboard'),
      api('GET', `/api/admin/analytics?days=${state.analyticsDays}`),
    ]);
    const stat = (label, value, href, highlight) =>
      h('a', { class: 'stat' + (highlight ? ' highlight' : ''), href },
        h('div', { class: 'stat-value' }, value), h('div', { class: 'stat-label' }, label));
    const ranges = h('div', { class: 'range-switch', 'aria-label': '统计时间范围' },
      ...[7, 30, 90].map((days) => h('button', {
        type: 'button', class: days === state.analyticsDays ? 'is-active' : '',
        onclick: () => { state.analyticsDays = days; show(renderDashboard); },
      }, `${days} 天`)));

    return h('section', {},
      panelHead('概览', '主页数据与访问趋势', ranges),
      h('div', { class: 'stats' },
        stat('累计独立访问', d.views, '#visits', false),
        stat(`${analytics.days} 天独立访问`, analytics.uniqueVisitors, '#visits', true),
        stat(`${analytics.days} 天请求`, analytics.requests, '#visits'),
        stat('刷新请求', analytics.refreshes, '#visits'),
        stat('未读留言', d.unreadMessages, '#messages', d.unreadMessages > 0),
        stat('技术笔记', d.notes, '#notes'),
        stat('AI 项目', d.aiProjects, '#ai-projects')),
      h('div', { class: 'analytics-grid' },
        analyticsTrend(analytics.daily),
        analyticsHours(analytics.hourly),
        analyticsRank('访问来源', analytics.sources),
        analyticsRank('热门页面', analytics.paths),
        analyticsRank('浏览器', analytics.browsers),
        analyticsRank('设备', analytics.devices)),
      h('p', { class: 'muted analytics-note' }, '独立访问按 IP 窗口去重；图表只使用脱敏、最小化的自建日志。'));
  }

  function analyticsTrend(points) {
    const max = Math.max(1, ...points.map((point) => point.uniqueVisitors));
    return h('article', { class: 'analytics-card analytics-wide' },
      h('h3', {}, '独立访问趋势'),
      h('div', { class: 'trend-chart' }, ...points.map((point, index) => {
        const height = Math.max(3, Math.round(point.uniqueVisitors / max * 100));
        const showLabel = points.length <= 7 || index === 0 || index === points.length - 1 || index % 5 === 0;
        return h('div', { class: 'trend-column', title: `${point.date}：${point.uniqueVisitors} 位 / ${point.requests} 次请求` },
          h('span', { class: 'trend-value' }, point.uniqueVisitors || ''),
          h('i', { style: `height:${height}%` }),
          h('small', {}, showLabel ? point.date.slice(5) : ''));
      })));
  }

  function analyticsHours(points) {
    const max = Math.max(1, ...points.map((point) => point.visitors));
    return h('article', { class: 'analytics-card' },
      h('h3', {}, '首次访问时段'),
      h('div', { class: 'hour-grid' }, ...points.map((point) => {
        const level = point.visitors ? Math.max(.18, point.visitors / max) : .05;
        return h('div', { title: `${String(point.hour).padStart(2, '0')}:00 · ${point.visitors} 位` },
          h('i', { style: `opacity:${level}` }), h('small', {}, point.hour % 6 === 0 ? String(point.hour).padStart(2, '0') : ''));
      })));
  }

  function analyticsRank(title, items) {
    const max = Math.max(1, ...items.map((item) => item.value));
    return h('article', { class: 'analytics-card' }, h('h3', {}, title),
      items.length ? h('ol', { class: 'rank-list' }, ...items.map((item) => h('li', {},
        h('div', {}, h('span', {}, item.name), h('b', {}, item.value)),
        h('i', { style: `width:${Math.max(4, Math.round(item.value / max * 100))}%` }))))
        : h('p', { class: 'empty analytics-empty' }, '暂无数据'));
  }

  // ---------------------------------------------------------------- 基本信息

  async function renderProfile() {
    const profile = await api('GET', '/api/admin/profile');
    const submit = h('button', { type: 'submit', class: 'btn primary' }, '保存');
    const form = h('form', { class: 'form card' }, buildFields(PROFILE_FIELDS, profile), h('div', { class: 'form-actions' }, submit));
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        await api('PUT', '/api/admin/profile', readFields(form, PROFILE_FIELDS));
        showFieldErrors(form, null);
        toast('已保存，主页已更新');
      } catch (err) {
        showFieldErrors(form, err.fields);
        toast(err.message, 'error');
      } finally {
        submit.disabled = false;
      }
    });
    return h('section', {}, panelHead('基本信息', '主页顶部、关于我、页脚和 SEO 信息'), form);
  }

  // ---------------------------------------------------------------- 列表（经历 / 项目 / 联系方式）

  async function renderList(key) {
    const cfg = RESOURCES[key];
    const items = await api('GET', cfg.path);
    const list = h('ul', { class: 'list' });
    if (!items.length) {
      list.append(h('li', { class: 'empty' }, `还没有${cfg.noun}，点右上角新增一条吧`));
    }
    items.forEach((item, index) => {
      const s = cfg.summary(item);
      const reorderActions = cfg.sortable === false ? [] : [
        h('button', {
          type: 'button', class: 'btn icon', 'data-act': 'up', 'aria-label': `上移：${s.title}`, title: '上移',
          disabled: index === 0, onclick: () => move(key, items, index, -1),
        }, '↑'),
        h('button', {
          type: 'button', class: 'btn icon', 'data-act': 'down', 'aria-label': `下移：${s.title}`, title: '下移',
          disabled: index === items.length - 1, onclick: () => move(key, items, index, 1),
        }, '↓'),
      ];
      list.append(h('li', { class: 'row' + (item.visible === false ? ' is-hidden' : ''), 'data-id': item.id },
        h('div', { class: 'row-main' },
          h('div', { class: 'row-title' }, s.title,
            item.visible === false ? h('span', { class: 'badge' }, '已隐藏') : null,
            item.published === false && key === 'notes' ? h('span', { class: 'badge' }, '草稿') : null),
          h('div', { class: 'row-sub' }, s.sub || '')),
        h('div', { class: 'row-actions' },
          ...reorderActions,
          h('button', { type: 'button', class: 'btn', 'data-act': 'edit', onclick: () => openEditor(key, item) }, '编辑'),
          h('button', { type: 'button', class: 'btn danger', onclick: () => removeItem(key, item, s.title) }, '删除'))));
    });
    const addBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => openEditor(key, null) }, `＋ 新增${cfg.noun}`);
    return h('section', {}, panelHead(cfg.title, cfg.desc, addBtn), list);
  }

  async function move(key, items, index, delta) {
    const ids = items.map((x) => x.id);
    const target = index + delta;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const movedId = items[index].id;
    try {
      await api('PUT', RESOURCES[key].path + '/order', ids);
      await route();
      // 保持键盘焦点在刚移动的条目上
      const row = $(`.row[data-id="${movedId}"]`);
      if (row) {
        const btn = $(`[data-act="${delta < 0 ? 'up' : 'down'}"]`, row);
        (btn && !btn.disabled ? btn : $('[data-act="edit"]', row)).focus();
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function removeItem(key, item, title) {
    const extra = key === 'notes' ? '' : '\n（只是暂时不想展示的话，可以在编辑里取消展示或发布）';
    if (!confirm(`确定删除「${title}」吗？删除后无法恢复。${extra}`)) return;
    try {
      await api('DELETE', `${RESOURCES[key].path}/${item.id}`);
      toast('已删除');
      route();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function openEditor(key, item) {
    const cfg = RESOURCES[key];
    const dialog = $('#editor');
    const isNew = !item;
    const isMarkdownEditor = key === 'projects' || key === 'notes' || key === 'ai-projects';
    dialog.classList.toggle('editor-wide', isMarkdownEditor);

    const submit = h('button', { type: 'submit', class: 'btn primary' }, '保存');
    const cancel = h('button', { type: 'button', class: 'btn ghost', onclick: () => dialog.close() }, '取消');
    const preview = isMarkdownEditor
      ? h('section', { class: 'markdown-preview', hidden: true }, h('div', { class: 'muted' }, 'Markdown 预览'))
      : null;
    const previewButton = isMarkdownEditor
      ? h('button', { type: 'button', class: 'btn' }, '预览 Markdown')
      : null;
    const actions = h('div', { class: 'form-actions' }, previewButton, cancel, submit);
    const form = h('form', { class: 'form' },
      h('h3', { id: 'editor-title' }, (isNew ? '新增' : '编辑') + cfg.noun),
      buildFields(cfg.fields, item || {}), preview, actions);

    if (previewButton) {
      previewButton.addEventListener('click', async () => {
        previewButton.disabled = true;
        try {
          const markdown = form.elements.namedItem('contentMarkdown').value;
          const data = await api('POST', '/admin/markdown-preview', { markdown });
          // 服务端已经过 sanitize-html 白名单过滤，这里只用于受保护的编辑预览。
          preview.innerHTML = data.html || '<p>暂无内容</p>';
          preview.hidden = false;
          preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (err) {
          toast(err.message, 'error');
        } finally {
          previewButton.disabled = false;
        }
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        const data = readFields(form, cfg.fields);
        if (isNew) await api('POST', cfg.path, data);
        else await api('PUT', `${cfg.path}/${item.id}`, data);
        dialog.close();
        toast(isNew ? '已新增' : '已保存');
        route();
      } catch (err) {
        showFieldErrors(form, err.fields);
        toast(err.message, 'error');
      } finally {
        submit.disabled = false;
      }
    });

    dialog.replaceChildren(form);
    dialog.showModal();
    const first = $('input, textarea', form);
    if (first) first.focus();
  }

  // ---------------------------------------------------------------- 访问日志

  async function renderVisits(page) {
    const data = await api('GET', `/api/admin/visits?page=${page}&size=20`);
    if (data.items.length === 0 && page > 0) {
      state.visitPage = page - 1;
      return renderVisits(page - 1);
    }
    state.visitPage = page;

    const list = h('ul', { class: 'list' });
    if (!data.items.length) list.append(h('li', { class: 'empty' }, '还没有访问日志'));

    for (const visit of data.items) {
      const refreshes = Math.max(0, Number(visit.hits || 1) - 1);
      list.append(h('li', { class: 'visit' },
        h('div', { class: 'visit-head' },
          h('strong', {}, visit.source || 'unknown'),
          h('span', { class: 'badge', title: '加盐后的来源指纹' }, '#' + visit.fingerprint),
          h('span', { class: 'badge' }, `请求 ${visit.hits} 次`),
          refreshes ? h('span', { class: 'muted' }, `其中刷新 ${refreshes} 次`) : null),
        h('dl', { class: 'visit-grid' },
          h('div', {}, h('dt', {}, '首次访问'), h('dd', {}, formatTime(visit.firstVisitedAt))),
          h('div', {}, h('dt', {}, '最后访问'), h('dd', {}, formatTime(visit.lastVisitedAt))),
          h('div', {}, h('dt', {}, '访问路径'), h('dd', {}, visit.path || '/')),
          h('div', {}, h('dt', {}, '来源页面'), h('dd', {}, visit.referer || '直接访问')),
          h('div', { class: 'visit-wide' }, h('dt', {}, '浏览器 / 设备'), h('dd', {}, visit.userAgent || '未提供')))));
    }

    const pager = data.totalPages > 1
      ? h('div', { class: 'pager' },
        h('button', { type: 'button', class: 'btn', disabled: page === 0, onclick: () => show(() => renderVisits(page - 1)) }, '上一页'),
        h('span', {}, `${page + 1} / ${data.totalPages}`),
        h('button', { type: 'button', class: 'btn', disabled: page >= data.totalPages - 1, onclick: () => show(() => renderVisits(page + 1)) }, '下一页'))
      : null;

    return h('section', {}, panelHead('访问日志', `共 ${data.total} 条独立访问记录`), list, pager);
  }

  // ---------------------------------------------------------------- 留言

  function formatTime(value) {
    return value ? String(value).replace('T', ' ').slice(0, 16) : '';
  }

  async function renderMessages(page) {
    const data = await api('GET', `/api/admin/messages?page=${page}&size=20`);
    if (data.items.length === 0 && page > 0) {
      state.messagePage = page - 1;
      return renderMessages(page - 1);
    }
    state.messagePage = page;

    const list = h('ul', { class: 'list' });
    if (!data.items.length) list.append(h('li', { class: 'empty' }, '还没有留言'));

    for (const m of data.items) {
      const actions = h('div', { class: 'row-actions' });
      if (!m.read) {
        actions.append(h('button', {
          type: 'button', class: 'btn',
          onclick: async () => {
            try { await api('PUT', `/api/admin/messages/${m.id}/read`); route(); } catch (err) { toast(err.message, 'error'); }
          },
        }, '标记已读'));
      }
      actions.append(h('button', {
        type: 'button', class: 'btn danger',
        onclick: async () => {
          if (!confirm(`确定删除 ${m.name} 的这条留言吗？`)) return;
          try { await api('DELETE', `/api/admin/messages/${m.id}`); toast('已删除'); route(); } catch (err) { toast(err.message, 'error'); }
        },
      }, '删除'));

      list.append(h('li', { class: 'msg' + (m.read ? '' : ' unread') },
        h('div', { class: 'msg-head' },
          h('strong', {}, m.name),
          m.contact ? h('span', {}, m.contact) : h('span', { class: 'muted' }, '未留联系方式'),
          h('time', { class: 'muted', datetime: m.createdAt }, formatTime(m.createdAt)),
          m.read ? null : h('span', { class: 'badge new' }, '未读'),
          m.ipHash ? h('span', { class: 'muted', title: '来源 IP 摘要，相同表示同一来源' }, '#' + m.ipHash.slice(0, 6)) : null),
        h('p', { class: 'msg-body' }, m.content),
        actions));
    }

    const pager = data.totalPages > 1
      ? h('div', { class: 'pager' },
        h('button', { type: 'button', class: 'btn', disabled: page === 0, onclick: () => show(() => renderMessages(page - 1)) }, '上一页'),
        h('span', {}, `${page + 1} / ${data.totalPages}`),
        h('button', { type: 'button', class: 'btn', disabled: page >= data.totalPages - 1, onclick: () => show(() => renderMessages(page + 1)) }, '下一页'))
      : null;

    return h('section', {}, panelHead('留言', `共 ${data.total} 条`), list, pager);
  }

  // ---------------------------------------------------------------- 登录 / 退出

  function showLogin(message) {
    $('#app-view').hidden = true;
    $('#login-view').hidden = false;
    $('#login-error').textContent = message || '';
    const username = $('#login-username');
    const password = $('#login-password');
    password.value = '';
    if (username.value.trim()) password.focus();
    else username.focus();
  }

  function showApp() {
    $('#login-view').hidden = true;
    $('#app-view').hidden = false;
    route({ focus: false });
  }

  async function onLogin(event) {
    event.preventDefault();
    const button = $('button[type="submit"]', event.currentTarget);
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    button.disabled = true;
    $('#login-error').textContent = '';
    try {
      const data = await api('POST', '/api/admin/login', { username, password });
      setToken(data.token);
      showApp();
    } catch (err) {
      $('#login-error').textContent = err.message;
      $('#login-password').select();
    } finally {
      button.disabled = false;
    }
  }

  async function onLogout() {
    try { await api('POST', '/api/admin/logout'); } catch (_) { /* 忽略 */ }
    setToken(null);
    history.replaceState(null, '', location.pathname);
    showLogin();
  }

  async function init() {
    $('#login-form').addEventListener('submit', onLogin);
    $('#logout-btn').addEventListener('click', onLogout);
    window.addEventListener('hashchange', () => {
      if (getToken()) route({ focus: true });
    });
    if (!getToken()) {
      showLogin();
      return;
    }
    try {
      await api('GET', '/api/admin/me');
      showApp();
    } catch (_) {
      showLogin();
    }
  }

  init();
})();
