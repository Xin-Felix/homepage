import { nextTick, onBeforeUnmount, onMounted } from 'vue'

/**
 * Nuxt 页面生命周期内注册 Bento 视觉交互，并在离开页面时完整清理。
 * 这里替代旧 public/js/site.js，不再依赖全局 IIFE 或重复 DOMContentLoaded。
 */
export function usePublicInteractions() {
  const cleanups: Array<() => void> = []

  onMounted(async () => {
    await nextTick()
    document.documentElement.classList.add('js')

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 滚动进度使用 rAF 合并高频 scroll 事件。
    const progress = document.querySelector<HTMLElement>('#scroll-progress-bar')
    if (progress) {
      let frame = 0
      const update = () => {
        frame = 0
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const value = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0
        progress.style.transform = `scaleX(${value})`
      }
      const onScroll = () => {
        if (!frame) frame = window.requestAnimationFrame(update)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      update()
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll)
        if (frame) window.cancelAnimationFrame(frame)
      })
    }

    // 当前主页 section 同步到桌面导航高亮。
    const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a'))
    if ('IntersectionObserver' in window && navLinks.length) {
      const sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.hash === `#${visible.target.id}`)
        })
      }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.2, 0.5] })
      document.querySelectorAll<HTMLElement>('.section-anchor[id]').forEach(section => sectionObserver.observe(section))
      cleanups.push(() => sectionObserver.disconnect())
    }

    // 元素首次进入视口后揭示；减少动态偏好时直接显示。
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(item => item.classList.add('is-visible'))
    }
    else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          revealObserver.unobserve(entry.target)
        })
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
      revealItems.forEach((item, index) => {
        item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`)
        revealObserver.observe(item)
      })
      cleanups.push(() => revealObserver.disconnect())
    }

    // 精细指针设备才启用聚光和轻微倾斜，触屏与 reduced-motion 不启用。
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll<HTMLElement>('.interactive-card').forEach((card) => {
        const onPointerMove = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          const rotateX = ((y / rect.height) - 0.5) * -2.2
          const rotateY = ((x / rect.width) - 0.5) * 2.2
          card.style.setProperty('--spot-x', `${x}px`)
          card.style.setProperty('--spot-y', `${y}px`)
          card.style.setProperty('--tilt-x', `${rotateX}deg`)
          card.style.setProperty('--tilt-y', `${rotateY}deg`)
          card.classList.add('has-pointer')
        }
        const onPointerLeave = () => {
          card.classList.remove('has-pointer')
          card.style.setProperty('--tilt-x', '0deg')
          card.style.setProperty('--tilt-y', '0deg')
        }
        card.addEventListener('pointermove', onPointerMove)
        card.addEventListener('pointerleave', onPointerLeave)
        cleanups.push(() => {
          card.removeEventListener('pointermove', onPointerMove)
          card.removeEventListener('pointerleave', onPointerLeave)
        })
      })
    }
  })

  onBeforeUnmount(() => {
    cleanups.splice(0).forEach(cleanup => cleanup())
  })
}
