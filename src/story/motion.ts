import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { reducedMotion } from './scrollState'

gsap.registerPlugin(SplitText)

// One motion vocabulary for the whole page.
export const EASE = {
  out: 'power3.out', // things arriving
  inOut: 'power2.inOut', // things travelling
  expo: 'expo.out', // the few big moments
  linear: 'none', // anything scrubbed by scroll
} as const

export const DUR = { quick: 0.6, base: 1.1, slow: 1.8 } as const
export const STAGGER = { chars: 0.025, words: 0.04, lines: 0.09 } as const

// Lines rise out of a mask, one after another, when the element scrolls in.
export function revealLines(el: Element, opts: { start?: string } = {}) {
  if (reducedMotion) return
  // autoSplit re-splits when web fonts finish loading or the width changes,
  // so line breaks always match the real text; onSplit rebuilds the reveal.
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'line',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 110,
        duration: DUR.base,
        ease: EASE.out,
        stagger: STAGGER.lines,
        scrollTrigger: { trigger: el, start: opts.start ?? 'top 80%', toggleActions: 'play none none reverse' },
      }),
  })
}

// Small technical labels type in quickly.
export function revealLabel(el: Element) {
  if (reducedMotion) return
  gsap.from(el, {
    opacity: 0,
    x: -12,
    duration: DUR.quick,
    ease: EASE.out,
    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
  })
}
