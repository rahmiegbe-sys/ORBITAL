import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { step } from '../../physics/integrator'
import { PRESETS } from '../../physics/presets'
import { BASE_DT, WARP_OPTIONS } from '../../physics/timeWarp'
import { EASE } from '../motion'
import { reducedMotion } from '../scrollState'

// Act VI. What the simulator lets you do, each card drawn from the
// simulator's own settings: its presets, its time-warp options and its
// precision thresholds.

// Each preset's own path over a short run, as a small SVG polyline.
function presetPaths() {
  return PRESETS.map((p) => {
    let b = p.create()
    const runs = p.name === 'Figure-eight' ? 6.33 : 2 * Math.PI
    const n = 600
    const dt = runs / n
    const paths = b.map(() => [] as string[])
    for (let k = 0; k <= n; k++) {
      if (k % 4 === 0) b.forEach((body, i) => paths[i].push(`${(body.pos.x * 30).toFixed(1)},${(-body.pos.y * 30).toFixed(1)}`))
      b = step(b, dt, 1)
    }
    return { name: p.name, paths: paths.map((pts) => pts.join(' ')) }
  })
}

export default function FeaturesSection() {
  const root = useRef<HTMLElement>(null)
  const presets = useMemo(() => presetPaths(), [])

  useEffect(() => {
    const el = root.current
    if (!el || reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.from('.feat-card', {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: EASE.out,
        stagger: 0.12,
        scrollTrigger: { trigger: '.feat-grid', start: 'top 75%' },
      })
      gsap.from('.feat-path', {
        strokeDashoffset: 1,
        duration: 2.2,
        ease: EASE.inOut,
        stagger: 0.15,
        scrollTrigger: { trigger: '.feat-grid', start: 'top 70%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="act features" ref={root} aria-labelledby="feat-title">
      <div className="feat-head">
        <p className="t-label">Act VI</p>
        <h2 id="feat-title" className="t-heading">The simulator</h2>
      </div>

      <div className="feat-grid">
        <article className="feat-card">
          <div className="feat-visual feat-presets" aria-hidden="true">
            {presets.map((p) => (
              <figure key={p.name}>
                <svg viewBox="-40 -40 80 80">
                  {p.paths.map((d, i) => (
                    <polyline key={i} points={d} pathLength={1} className="feat-path" />
                  ))}
                </svg>
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
          <h3 className="feat-title">Presets</h3>
          <p className="t-body">
            Sun and Earth with the real mass ratio, a binary star, and the Chenciner–Montgomery figure-eight three-body
            orbit (2000).
          </p>
        </article>

        <article className="feat-card">
          <div className="feat-visual feat-warp" aria-hidden="true">
            {WARP_OPTIONS.map((w, i) => (
              <span key={w.label} style={{ ['--i' as string]: i }}>
                <i />
                {w.label}
              </span>
            ))}
          </div>
          <h3 className="feat-title">Time warp</h3>
          <p className="t-body">
            From 1 day/s to 1 century/s, with an elapsed-time clock in days, months, years and centuries.
          </p>
        </article>

        <article className="feat-card">
          <div className="feat-visual feat-precision" aria-hidden="true">
            <span>
              <i className="good" /> High · Δt = {BASE_DT}
            </span>
            <span>
              <i className="warn" /> Good · Δt &lt; 0.02
            </span>
            <span>
              <i className="bad" /> Reduced · Δt ≥ 0.02
            </span>
          </div>
          <h3 className="feat-title">Accuracy readout</h3>
          <p className="t-body">
            At extreme speeds the computer can't keep Δt small, so the Precision indicator and energy drift show the
            trade-off between speed and accuracy.
          </p>
        </article>

        <article className="feat-card">
          <div className="feat-visual feat-stats" aria-hidden="true">
            {['Elapsed', 'Energy drift', 'Momentum drift', 'Precision', 'Frame rate'].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <h3 className="feat-title">Live stats</h3>
          <p className="t-body">
            Elapsed time, energy drift, momentum drift, precision and frame rate. Fading orbit trails, play, pause and
            reset, and a layout that works on phones.
          </p>
        </article>
      </div>

      <div className="feat-cta">
        <a className="cta primary" href="/">
          Open the simulator
        </a>
      </div>
    </section>
  )
}
