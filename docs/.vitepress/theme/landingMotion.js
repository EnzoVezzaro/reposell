import { animate, createTimeline, createDrawable, stagger, utils } from 'animejs'

const REDUCE = '(prefers-reduced-motion: reduce)'
const prefersReduced = () =>
  window.matchMedia?.(REDUCE).matches === true

const clearBoot = () => document.documentElement.classList.remove('lx-boot')

/**
 * Landing-only choreography (anime.js v4).
 * Returns a cleanup fn. Everything degrades to the static CSS state.
 */
export function initLandingMotion() {
  if (prefersReduced()) {
    clearBoot()
    return () => {}
  }

  const cleanups = []
  /* safety net: never leave boot-hidden content stuck */
  const bootTimer = setTimeout(clearBoot, 3200)
  cleanups.push(() => clearTimeout(bootTimer))

  /* ---- 1 · nav logo: "RE" monogram line-draw ---------------- */
  try {
    const drawables = createDrawable('.rs-logo-draw')
    if (drawables.length) {
      animate(drawables, {
        draw: '0 1',
        ease: 'outExpo',
        duration: 720,
        delay: stagger(95),
      })
    }
  } catch {
    /* logo stays fully drawn */
  }

  /* ---- 2 · hero intro: DECRYPT text reveal ------------------ */
  try {
    const title = document.querySelector('.lx-title')
    if (title === null) throw new Error('no title')

    // Save the original markup so cleanup can restore it on route change.
    if (title.dataset.lxOriginal === undefined) {
      title.dataset.lxOriginal = title.innerHTML
    } else {
      title.innerHTML = title.dataset.lxOriginal
    }

    // Split every text node into per-char spans (keeps <em> and <br>).
    const chars = []
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT)
    const textNodes = []
    while (walker.nextNode()) textNodes.push(walker.currentNode)
    for (const node of textNodes) {
      const frag = document.createDocumentFragment()
      for (const ch of node.textContent) {
        if (ch.trim() === '') {
          frag.appendChild(document.createTextNode(ch))
          continue
        }
        const span = document.createElement('span')
        span.className = 'lx-scramble-char'
        span.textContent = ch
        frag.appendChild(span)
        chars.push(span)
      }
      node.parentNode.replaceChild(frag, node)
    }

    const GLYPHS = '#$%&()*+-/<>[]{}_01?!|~^'
    const revealChar = (span, index) => {
      const finalText = span.dataset.final
      const revealAt = 260 + index * 26
      const scrambleStart = performance.now() + Math.min(revealAt, 1400)
      const interval = setInterval(() => {
        if (performance.now() >= scrambleStart) {
          span.textContent = finalText
          clearInterval(interval)
          return
        }
        span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }, 42)
      cleanups.push(() => clearInterval(interval))
      animate(span, {
        opacity: [0, 1],
        translateY: [9, 0],
        duration: 420,
        delay: Math.min(revealAt, 1400),
        ease: 'outQuad',
      })
    }

    const tl = createTimeline({
      defaults: { ease: 'outQuint', duration: 760 },
      onComplete: clearBoot,
    })
    clearBoot()
    tl.add(
      '.lx-title',
      { opacity: [0, 1], duration: 240 },
      0,
    )
      .add('.lx-sub', { opacity: [0, 1], translateY: [24, 0] }, 320)
      .add('.lx-actions', { opacity: [0, 1], translateY: [18, 0], scale: [0.97, 1] }, '-=500')
      .add('.lx-cmdchip', { opacity: [0, 1], translateY: [14, 0], duration: 620 }, '-=450')
      .add(
        '.lx-trust li',
        { opacity: [0, 1], translateY: [10, 0], delay: stagger(70), duration: 520 },
        '-=400',
      )
      .add(
        '.lx-vprop',
        { opacity: [0, 1], translateY: [22, 0], delay: stagger(85), duration: 680 },
        '-=320',
      )

    // Scramble runs alongside the timeline: chars resolve left-to-right.
    for (const [index, span] of chars.entries()) {
      span.dataset.final = span.textContent
      span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      revealChar(span, index)
    }
    const settle = setTimeout(() => {
      for (const span of chars) span.textContent = span.dataset.final ?? span.textContent
    }, 2100)
    cleanups.push(() => clearTimeout(settle))
  } catch {
    clearBoot()
  }

  /* ---- 3 · scroll reveals (IO-gated anime.js tweens) --------- */
  const groups = [
    ['.lx-section .lx-h2block', 90],
    ['.lx-cell', 70],
    ['.lx-step', 80],
    ['.lx-chips li', 55],
    ['.lx-trustcard', 0],
    ['.lx-links .lx-link', 70],
    ['.calc-host', 0],
    ['.audit-host', 0],
    ['.lx-fbrand', 0],
    ['.lx-footer-grid > .lx-fcol:not(.lx-fbrand)', 80],
  ]
  try {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          io.unobserve(el)
          animate(el, {
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 640,
            ease: 'outQuart',
            delay: Math.min(Number(el.dataset.lxDelay || 0), 320),
          })
        }
      },
      { threshold: 0.08 },
    )
    for (const [sel, stepDelay] of groups) {
      utils.$(sel).forEach((el, i) => {
        el.style.opacity = '0'
        el.dataset.lxDelay = String((i % 4) * stepDelay)
        io.observe(el)
      })
    }
    cleanups.push(() => io.disconnect())
  } catch {
    for (const [sel] of groups) {
      utils.$(sel).forEach((el) => {
        el.style.opacity = ''
      })
    }
  }

  /* ---- 4 · ticker marquee (anime loop, hover-pause) ---------- */
  try {
    const track = document.querySelector('.lx-ticker-track')
    if (track) {
      const half = track.scrollWidth / 2
      if (half > 4) {
        const loop = animate(track, {
          x: [0, -half],
          duration: half / 0.055,
          ease: 'linear',
          loop: true,
        })
        const host = track.closest('.lx-ticker')
        host?.addEventListener('pointerenter', () => loop.pause())
        host?.addEventListener('pointerleave', () => loop.play())
        cleanups.push(() => loop.pause())
      }
    }
  } catch {
    /* ticker remains a static row */
  }

  /* ---- 5 · footer wordmark: stroke self-writes on entry ------ */
  try {
    const wm = document.querySelector('.lx-wordmark')
    const text = document.querySelector('.lx-wordmark-text')
    if (wm && text) {
      const width = Math.max(text.getComputedTextLength(), 220)
      const dash = Math.ceil(width * 3.4)
      text.style.strokeDasharray = String(dash)
      text.style.strokeDashoffset = String(dash)
      const wio = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return
          wio.disconnect()
          animate(text, {
            strokeDashoffset: [dash, 0],
            duration: 2100,
            ease: 'outExpo',
          })
        },
        { threshold: 0.35 },
      )
      wio.observe(wm)
      cleanups.push(() => wio.disconnect())
    }
  } catch {
    /* wordmark keeps its static ghost styling */
  }

  return () => {
    for (const fn of cleanups) {
      try {
        fn()
      } catch {
        /* noop */
      }
    }
    const title = document.querySelector('.lx-title')
    if (title !== null && title.dataset.lxOriginal !== undefined) {
      title.innerHTML = title.dataset.lxOriginal
    }
  }
}
