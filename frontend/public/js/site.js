// 前台交互：主题、Bento 卡片聚光、滚动揭示、移动导航、杭州时钟和留言弹窗。
// 页面由独立 frontend SSR 服务渲染，业务数据和表单 API 由 backend 提供。
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  // 在首屏绘制前恢复主题，减少闪烁。
  try {
    const saved = localStorage.getItem('homepage.theme');
    root.dataset.theme = saved === 'light' ? 'light' : 'dark';
  } catch (_) {
    root.dataset.theme = 'dark';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ------------------------------------------------------------ 主题
    const themeToggle = $('#theme-toggle');
    const syncThemeUi = () => {
      if (!themeToggle) return;
      const light = root.dataset.theme === 'light';
      themeToggle.setAttribute('aria-label', light ? '切换为深色主题' : '切换为浅色主题');
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = light ? '#e9e9e3' : '#0b0d0f';
    };
    syncThemeUi();
    themeToggle?.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('homepage.theme', root.dataset.theme); } catch (_) { /* noop */ }
      syncThemeUi();
    });

    // ------------------------------------------------------------ 移动导航
    const menuButton = $('#menu-toggle');
    const mobileMenu = $('#mobile-menu');
    const setMenu = (open) => {
      if (!menuButton || !mobileMenu) return;
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      menuButton.classList.toggle('is-open', open);
      mobileMenu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    $$('#mobile-menu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 760) setMenu(false); });

    // ------------------------------------------------------------ 滚动进度与当前导航
    const progress = $('#scroll-progress-bar');
    let progressFrame = 0;
    const updateProgress = () => {
      progressFrame = 0;
      if (!progress) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const value = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      progress.style.transform = `scaleX(${value})`;
    };
    window.addEventListener('scroll', () => {
      if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
    }, { passive: true });
    updateProgress();

    const navLinks = $$('.desktop-nav a');
    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${visible.target.id}`));
      }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.2, 0.5] });
      $$('.section-anchor[id]').forEach((section) => sectionObserver.observe(section));
    }

    // ------------------------------------------------------------ 进入视口动画
    const revealItems = $$('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealItems.forEach((item, index) => {
        item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
        revealObserver.observe(item);
      });
    }

    // ------------------------------------------------------------ 卡片指针聚光与轻微倾斜
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
      $$('.interactive-card').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const rx = ((y / rect.height) - 0.5) * -2.2;
          const ry = ((x / rect.width) - 0.5) * 2.2;
          card.style.setProperty('--spot-x', `${x}px`);
          card.style.setProperty('--spot-y', `${y}px`);
          card.style.setProperty('--tilt-x', `${rx}deg`);
          card.style.setProperty('--tilt-y', `${ry}deg`);
          card.classList.add('has-pointer');
        });
        card.addEventListener('pointerleave', () => {
          card.classList.remove('has-pointer');
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      });
    }

    // ------------------------------------------------------------ 杭州时钟
    const clock = $('#hangzhou-time');
    if (clock) {
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      const updateClock = () => {
        const now = new Date();
        clock.textContent = formatter.format(now);
        clock.dateTime = now.toISOString();
      };
      updateClock();
      window.setInterval(updateClock, 1000);
    }

    // ------------------------------------------------------------ 留言弹窗
    const dialog = $('#contact-dialog');
    const form = $('#msg-form');
    const openDialog = () => {
      if (!dialog) return;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.classList.add('dialog-open');
      window.setTimeout(() => $('input[name="name"]', dialog)?.focus(), 80);
    };
    const closeDialog = () => {
      if (!dialog) return;
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      document.body.classList.remove('dialog-open');
    };
    $$('[data-open-contact]').forEach((button) => button.addEventListener('click', openDialog));
    $$('[data-close-contact]').forEach((button) => button.addEventListener('click', closeDialog));
    dialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));
    dialog?.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });

    if (form) {
      const status = $('.msg-status', form);
      const submit = $('button[type="submit"]', form);
      const setStatus = (message, type = '') => {
        if (!status) return;
        status.textContent = message;
        status.className = `msg-status${type ? ` msg-status--${type}` : ''}`;
      };

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = {
          name: form.elements.namedItem('name').value.trim(),
          contact: form.elements.namedItem('contact').value.trim(),
          content: form.elements.namedItem('content').value.trim(),
          website: form.elements.namedItem('website').value,
        };
        if (!payload.name || payload.content.length < 2) {
          setStatus('请填写称呼和至少 2 个字的内容', 'error');
          return;
        }
        submit.disabled = true;
        setStatus('正在发送…');
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await response.json().catch(() => null);
          if (!response.ok || !result || result.status !== 'success') {
            throw new Error((result && result.reason) || '发送失败，请稍后重试');
          }
          form.reset();
          setStatus('收到，我会尽快回复你。', 'success');
          window.setTimeout(closeDialog, 1400);
        } catch (error) {
          setStatus(error.message || '发送失败，请稍后重试', 'error');
        } finally {
          submit.disabled = false;
        }
      });
    }
  });
})();
