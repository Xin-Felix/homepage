import { onBeforeUnmount, onMounted } from 'vue'

/** 注册公开页必要交互：滚动进度与当前章节导航；不再启用卡片倾斜或延迟揭示。 */
export function usePublicInteractions() {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    document.documentElement.classList.add('js')

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
  })

  onBeforeUnmount(() => {
    cleanups.splice(0).forEach(cleanup => cleanup())
  })
}
