import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import katex from 'katex'
import { STAGGER } from '../motion'
import { reducedMotion, scrollState } from '../scrollState'

// Act V, the finale, in three movements over one pinned stage:
//   1. The camera rises over the live system and each planet grows an arrow:
//      its real net acceleration from accelerations() (drawn in OrbitalSystem).
//   2. The law and the Velocity Verlet step are typeset over the scene:
//      the mathematics that just produced those arrows.
//   3. The scene settles and darkens, and the ORBITAL wordmark resolves.

const LAW = String.raw`\mathbf a_i = \sum_{j \ne i} G\, m_j\, \frac{\mathbf r_j - \mathbf r_i}{\lvert \mathbf r_j - \mathbf r_i \rvert^{3}}`
const VERLET = [
  String.raw`\mathbf v_{1/2} = \mathbf v + \mathbf a(\mathbf r)\,\tfrac{\Delta t}{2}`,
  String.raw`\mathbf r' = \mathbf r + \mathbf v_{1/2}\,\Delta t`,
  String.raw`\mathbf v' = \mathbf v_{1/2} + \mathbf a(\mathbf r')\,\tfrac{\Delta t}{2}`,
]
const tex = (s: string, display = false) => katex.renderToString(s, { displayMode: display, strict: false, output: 'html' })

export default function IdentitySection() {
  const root = useRef<HTMLElement>(null)
  const law = useMemo(() => tex(LAW, true), [])
  const verlet = useMemo(() => VERLET.map((v) => tex(v)), [])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => (scrollState.finale = self.progress),
      })
      if (reducedMotion) return

      const split = SplitText.create('.wordmark-xl', { type: 'chars', charsClass: 'char' })
      gsap.set('.finale-forces, .finale-math, .identity-veil', { autoAlpha: 0 })

      // Positions are in timeline units; the whole timeline is scrubbed
      // across the section, so 10 units = the full finale.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 0.8 },
      })
      // 1. forces
      tl.to('.finale-forces', { autoAlpha: 1, y: 0, duration: 0.8 }, 1.2)
      tl.to('.finale-forces', { autoAlpha: 0, y: -20, duration: 0.6 }, 3.6)
      // 2. mathematics
      tl.fromTo('.finale-law', { autoAlpha: 0, y: 30, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9 }, 3.9)
      tl.to('.finale-math', { autoAlpha: 1, duration: 0.3 }, 3.9)
      tl.fromTo('.finale-step', { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.35 }, 4.6)
      tl.fromTo('.finale-note', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 5.6)
      tl.to('.finale-math', { autoAlpha: 0, y: -40, scale: 0.96, duration: 0.8 }, 6.7)
      // 3. identity
      tl.to('.identity-veil', { autoAlpha: 1, duration: 1 }, 6.8)
      tl.from(split.chars, { yPercent: 70, opacity: 0, filter: 'blur(14px)', stagger: STAGGER.chars * 4, duration: 1 }, 7.3)
      tl.from('.identity-rule', { scaleX: 0, duration: 0.7 }, 8.2)
      tl.from('.identity-line, .identity-actions, .identity-meta', { opacity: 0, y: 18, stagger: 0.18, duration: 0.5 }, 8.5)
      tl.to({}, { duration: 0.6 }, 9.4)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="act identity" ref={root} aria-labelledby="identity-title">
      <div className="identity-stage">
        <div className="identity-veil" aria-hidden="true" />

        <div className="finale-forces">
          <p className="t-label">Act VIII</p>
          {/* Rhema's own sentence from the README introduction. */}
          <p className="t-statement">From Newton's law of gravitation, we use the formula for force to get accelerations.</p>
          <p className="t-annotation finale-legend">
            <i aria-hidden="true" /> Net acceleration on each body, from the live integration. Direction exact, length on a log scale.
          </p>
        </div>

        <div className="finale-math">
          <div className="finale-law" dangerouslySetInnerHTML={{ __html: law }} />
          <ol className="finale-steps">
            {verlet.map((v, i) => (
              <li className="finale-step" key={i}>
                <span className="t-annotation">{['half kick', 'drift', 'half kick'][i]}</span>
                <span dangerouslySetInnerHTML={{ __html: v }} />
              </li>
            ))}
          </ol>
          <p className="finale-note t-annotation">Repeated every Δt = 0.002 for every body, in your browser, right now.</p>
        </div>

        <div className="identity-inner">
          <h2 id="identity-title" className="wordmark-xl">
            ORBITAL
          </h2>
          <div className="identity-rule" aria-hidden="true" />
          {/* Rhema's own closing words from the README; final copy to be confirmed. */}
          <p className="identity-line t-statement">It simply shows how gravity affects objects over time.</p>
          <div className="identity-actions">
            <a className="cta primary" href="/">
              Open the simulator
            </a>
            <a className="cta" href="https://github.com/rahmiegbe-sys/ORBITAL">
              Read the code
            </a>
          </div>
          <p className="identity-meta t-annotation">Newtonian gravity · Velocity Verlet · G = 1, AU, solar masses</p>
        </div>
      </div>
    </section>
  )
}
