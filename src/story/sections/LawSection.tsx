import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import katex from 'katex'
import { EASE } from '../motion'
import { reducedMotion } from '../scrollState'

// Each term is wrapped in a class so it can be revealed on its own.
const EQUATION = String.raw`\htmlClass{eq-a}{\mathbf a_i} \htmlClass{eq-eq}{=} \htmlClass{eq-sum}{\sum_{j \ne i}} \htmlClass{eq-gm}{G\,m_j}\, \htmlClass{eq-frac}{\frac{\mathbf r_j - \mathbf r_i}{\lvert \mathbf r_j - \mathbf r_i \rvert^{3}}}`

// Captions are Rhema's own sentences from the README physics section.
const STEPS = [
  { tag: '01 · The law', text: "ORBITAL uses Newton's Law of Universal Gravitation." },
  { tag: '02 · Direction', text: 'rⱼ − rᵢ is the vector from body i to body j.' },
  { tag: '03 · Strength', text: 'The denominator is |r| cubed because we multiply the unit vector of r by 1/r².' },
  { tag: '04 · The sum', text: 'The j ≠ i means we do not include the body itself.' },
  { tag: '05 · By hand', text: 'r = (3, 4), |r| = 5, |r|³ = 125, so a₁ = (0.048, 0.064).', mono: true },
]

// Diagram in its own coordinates: 40 px per unit, y up. Body i at (0,0)
// with mass 1, body j at (3,4) with mass 2: the example from gravity.test.ts.
const U = 40
const OX = 60
const OY = 250
const X = (x: number) => OX + x * U
const Y = (y: number) => OY - y * U

// Arrowhead pointing along the line from (x1, y1) to (x2, y2), in screen units.
function head(x1: number, y1: number, x2: number, y2: number, size = 9) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const p = (da: number) => `${(x2 - size * Math.cos(a + da)).toFixed(1)} ${(y2 - size * Math.sin(a + da)).toFixed(1)}`
  return `M ${x2} ${y2} L ${p(0.42)} L ${p(-0.42)} Z`
}

export default function LawSection() {
  const root = useRef<HTMLElement>(null)
  const eqHtml = useMemo(
    () => katex.renderToString(EQUATION, { displayMode: true, trust: true, strict: false, output: 'html' }),
    [],
  )

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const captions = gsap.utils.toArray<HTMLElement>('.law-caption')
      // Reduced motion: no pinning; every caption and the finished diagram
      // simply stay visible, stacked in reading order (see story.css).
      if (reducedMotion) return
      gsap.set('.eq-eq, .eq-sum, .eq-gm, .eq-frac', { autoAlpha: 0.12 })
      gsap.set(captions.slice(1), { autoAlpha: 0, y: 16 })
      gsap.set('.d-vec, .d-unit, .d-acc', { strokeDashoffset: 1 })
      gsap.set('.d-label, .d-head, .d-calc', { autoAlpha: 0 })

      const tl = gsap.timeline({
        defaults: { ease: EASE.linear },
        scrollTrigger: { trigger: el, start: 'top top', end: '+=320%', pin: true, scrub: 0.6 },
      })
      const caption = (i: number) => {
        tl.to(captions[i - 1], { autoAlpha: 0, y: -16, duration: 0.4 })
        tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.4 }, '<0.2')
      }

      // 01 → 02: the vector from i to j draws itself, and the fraction lights up.
      caption(1)
      tl.to('.eq-frac', { autoAlpha: 1, duration: 0.6 }, '<')
      tl.to('.d-vec', { strokeDashoffset: 0, duration: 1 }, '<')
      tl.to('.d-head-vec, .d-label-vec', { autoAlpha: 1, duration: 0.3 })
      // 03: the unit vector and the distance.
      caption(2)
      tl.to('.d-unit', { strokeDashoffset: 0, duration: 0.6 }, '<')
      tl.to('.d-head-unit, .d-label-unit, .d-label-dist', { autoAlpha: 1, duration: 0.3 })
      tl.to('.eq-gm', { autoAlpha: 1, duration: 0.5 }, '<')
      // 04: the sum over every other body.
      caption(3)
      tl.to('.eq-eq, .eq-sum', { autoAlpha: 1, duration: 0.6 }, '<')
      // 05: the worked example and the resulting acceleration of body i.
      caption(4)
      tl.to('.d-acc', { strokeDashoffset: 0, duration: 0.6 }, '<')
      tl.to('.d-head-acc, .d-label-acc, .d-calc', { autoAlpha: 1, duration: 0.4, stagger: 0.1 })
      tl.to({}, { duration: 0.6 }) // hold the finished composition
    }, el)
    return () => ctx.revert()
  }, [])

  // a₁ = (0.048, 0.064) is tiny; it is drawn 30x longer so it can be seen.
  const ACC_SCALE = 30
  // drawn parallel to r, offset sideways so it does not hide the r vector
  const AX = -0.3
  const AY = 0.225
  return (
    <section className="act law" ref={root} aria-labelledby="law-title">
      <div className="law-grid">
        <div className="law-copy">
          <p className="t-label">Act II</p>
          <h2 id="law-title" className="t-heading">The law</h2>
          <div className="equation" dangerouslySetInnerHTML={{ __html: eqHtml }} />
          <div className="law-captions">
            {STEPS.map((s) => (
              <div className="law-caption" key={s.tag}>
                <p className="t-label">{s.tag}</p>
                <p className={'mono' in s ? 't-body t-mono-body' : 't-body'}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <figure className="law-figure">
          <svg viewBox="0 0 320 300" role="img" aria-label="Body i at the origin and body j at (3, 4), with the vector between them and the acceleration of body i">
            <defs>
              <pattern id="grid" width={U} height={U} patternUnits="userSpaceOnUse" x={OX} y={OY}>
                <path d={`M ${U} 0 L 0 0 0 ${U}`} className="d-grid" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="320" height="300" fill="url(#grid)" />
            <line x1={X(-1)} y1={OY} x2={X(6)} y2={OY} className="d-axis" />
            <line x1={OX} y1={Y(-1)} x2={OX} y2={Y(5.8)} className="d-axis" />

            <line pathLength={1} x1={X(0)} y1={Y(0)} x2={X(3)} y2={Y(4)} className="d-vec" />
            <path d={head(X(0), Y(0), X(3), Y(4))} className="d-head d-head-vec" />
            <text x={X(2.55)} y={Y(2.95)} className="d-label d-label-vec">
              r<tspan dy="3" fontSize="7">j</tspan>
              <tspan dy="-3"> − r</tspan>
              <tspan dy="3" fontSize="7">i</tspan>
              <tspan dy="-3"> = (3, 4)</tspan>
            </text>

            <line pathLength={1} x1={X(0)} y1={Y(0)} x2={X(0.6)} y2={Y(0.8)} className="d-unit" />
            <text x={X(0.85)} y={Y(0.45)} className="d-label d-label-unit">unit vector</text>
            <path d={head(X(0), Y(0), X(0.6), Y(0.8), 7)} className="d-head d-head-unit" />
            <text x={X(2.2)} y={Y(1.4)} className="d-label d-label-dist">|r| = 5</text>

            <line pathLength={1} x1={X(AX)} y1={Y(AY)} x2={X(AX + 0.048 * ACC_SCALE)} y2={Y(AY + 0.064 * ACC_SCALE)} className="d-acc" />
            <path d={head(X(AX), Y(AY), X(AX + 0.048 * ACC_SCALE), Y(AY + 0.064 * ACC_SCALE), 8)} className="d-head d-head-acc" />
            <text x={X(-0.95)} y={Y(2.3)} className="d-label d-label-acc">a₁ (×30)</text>

            <circle cx={X(0)} cy={Y(0)} r="7" className="d-body" />
            <text x={X(0) - 12} y={Y(0) + 22} className="d-name">i · m = 1</text>
            <circle cx={X(3)} cy={Y(4)} r="10" className="d-body" />
            <text x={X(3) + 14} y={Y(4) + 4} className="d-name">j · m = 2</text>
          </svg>
          <figcaption className="d-calc t-annotation">
            a₁ = G m₂ r / |r|³ = 2 · (3, 4) / 125 = (0.048, 0.064)
            <span>checked to 10 decimal places in gravity.test.ts</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
