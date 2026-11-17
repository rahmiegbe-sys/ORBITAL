import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { EASE } from '../motion'
import { reducedMotion } from '../scrollState'
import { DT, getRuns, type Run } from '../sim/eulerVsVerlet'
import { sci } from '../format'

// Act III. Both orbits and the energy graph come from the real integrators,
// run once in the browser on the same orbit as euler.test.ts.

const R_MAX = 1.8 // view radius in AU, enough for Euler's 1.65
const ORBIT_SIZE = 220
const toOrbit = (v: number) => (v / R_MAX) * (ORBIT_SIZE / 2) + ORBIT_SIZE / 2

const G_W = 460
const G_H = 140
const E_MAX = 0.45

function pointsUpTo(run: Run, n: number) {
  let s = ''
  for (let k = 0; k < n; k++) s += `${toOrbit(run.x[k]).toFixed(1)},${toOrbit(-run.y[k]).toFixed(1)} `
  return s
}

function graphUpTo(run: Run, n: number, total: number) {
  let s = ''
  for (let k = 0; k < n; k++) {
    const x = (k / (total - 1)) * G_W
    const y = G_H - (Math.min(run.energyError[k], E_MAX) / E_MAX) * G_H
    s += `${x.toFixed(1)},${y.toFixed(1)} `
  }
  return s
}

const formatErr = (e: number) => (e >= 1e-3 ? `${(e * 100).toFixed(1)}%` : sci(e))

// Captions are Rhema's own sentences from the README numerical method section.
const CAPTIONS = [
  "Euler's method calculates the velocity and acceleration at the start of each step and then uses those same values for the whole step.",
  'Every step lands outside and never inside, so the errors add up instead of cancelling.',
  'So each step uses the acceleration at both the start and the end of the step instead of only the start like Euler.',
]

export default function MechanismSection() {
  const root = useRef<HTMLElement>(null)
  const runs = useMemo(() => getRuns(), [])
  const total = runs.euler.x.length
  const verletMax = useMemo(() => runs.verlet.energyError.reduce((m, v) => Math.max(m, v), 0), [runs])

  const refs = {
    eulerPath: useRef<SVGPolylineElement>(null),
    verletPath: useRef<SVGPolylineElement>(null),
    eulerGraph: useRef<SVGPolylineElement>(null),
    verletGraph: useRef<SVGPolylineElement>(null),
    eulerDot: useRef<SVGCircleElement>(null),
    verletDot: useRef<SVGCircleElement>(null),
    eulerErr: useRef<HTMLSpanElement>(null),
    verletErr: useRef<HTMLSpanElement>(null),
    orbits: useRef<HTMLSpanElement>(null),
  }

  useEffect(() => {
    const el = root.current
    if (!el) return

    const draw = (p: number) => {
      const n = Math.max(1, Math.round(p * (total - 1)) + 1)
      const k = n - 1
      refs.eulerPath.current?.setAttribute('points', pointsUpTo(runs.euler, n))
      refs.verletPath.current?.setAttribute('points', pointsUpTo(runs.verlet, n))
      refs.eulerGraph.current?.setAttribute('points', graphUpTo(runs.euler, n, total))
      refs.verletGraph.current?.setAttribute('points', graphUpTo(runs.verlet, n, total))
      refs.eulerDot.current?.setAttribute('cx', toOrbit(runs.euler.x[k]).toFixed(1))
      refs.eulerDot.current?.setAttribute('cy', toOrbit(-runs.euler.y[k]).toFixed(1))
      refs.verletDot.current?.setAttribute('cx', toOrbit(runs.verlet.x[k]).toFixed(1))
      refs.verletDot.current?.setAttribute('cy', toOrbit(-runs.verlet.y[k]).toFixed(1))
      if (refs.eulerErr.current) refs.eulerErr.current.textContent = formatErr(runs.euler.energyError[k])
      if (refs.verletErr.current) refs.verletErr.current.textContent = formatErr(runs.verlet.energyError[k])
      if (refs.orbits.current) refs.orbits.current.textContent = ((p * 10).toFixed(1))
      el.style.setProperty('--drift', String(Math.min(runs.euler.energyError[k] / 0.2, 1)))
    }

    if (reducedMotion) {
      draw(1)
      return
    }
    draw(0)

    const ctx = gsap.context(() => {
      const captions = gsap.utils.toArray<HTMLElement>('.mech-caption')
      gsap.set(captions.slice(1), { autoAlpha: 0, y: 16 })
      const state = { p: 0 }
      const tl = gsap.timeline({
        defaults: { ease: EASE.linear },
        scrollTrigger: { trigger: el, start: 'top top', end: '+=360%', pin: true, scrub: 0.6 },
      })
      tl.to(state, { p: 0.5, duration: 2, onUpdate: () => draw(state.p) })
      tl.to(captions[0], { autoAlpha: 0, y: -16, duration: 0.3 }, 1.2)
      tl.to(captions[1], { autoAlpha: 1, y: 0, duration: 0.3 }, 1.4)
      tl.to(state, { p: 1, duration: 2, onUpdate: () => draw(state.p) })
      tl.to(captions[1], { autoAlpha: 0, y: -16, duration: 0.3 }, 2.9)
      tl.to(captions[2], { autoAlpha: 1, y: 0, duration: 0.3 }, 3.1)
      tl.to('.mech-panel.verlet', { '--focus': 1, duration: 0.6 }, 3.1)
      tl.to({}, { duration: 0.8 })
    }, el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, total])

  const ring = (cls: string) => (
    <circle cx={ORBIT_SIZE / 2} cy={ORBIT_SIZE / 2} r={(1 / R_MAX) * (ORBIT_SIZE / 2)} className={cls} />
  )

  return (
    <section className="act mechanism" ref={root} aria-labelledby="mech-title">
      <div className="mech-head">
        <p className="t-label">Act III</p>
        <h2 id="mech-title" className="t-heading">The method</h2>
        <div className="mech-captions">
          {CAPTIONS.map((c, i) => (
            <p className="mech-caption t-body" key={i}>
              {c}
            </p>
          ))}
        </div>
      </div>

      <div className="mech-panels">
        <figure className="mech-panel euler">
          <figcaption>
            <span className="t-label">Euler</span>
            <span className="t-numeric" ref={refs.eulerErr} />
          </figcaption>
          <svg viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`} role="img" aria-label="Euler orbit spiralling outward">
            {ring('m-ring')}
            <circle cx={ORBIT_SIZE / 2} cy={ORBIT_SIZE / 2} r="5" className="m-star" />
            <polyline ref={refs.eulerPath} className="m-path euler" />
            <circle ref={refs.eulerDot} r="3.5" className="m-dot euler" />
          </svg>
        </figure>

        <figure className="mech-panel verlet">
          <figcaption>
            <span className="t-label">Velocity Verlet</span>
            <span className="t-numeric" ref={refs.verletErr} />
          </figcaption>
          <svg viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`} role="img" aria-label="Velocity Verlet orbit staying on the circle">
            {ring('m-ring')}
            <circle cx={ORBIT_SIZE / 2} cy={ORBIT_SIZE / 2} r="5" className="m-star" />
            <polyline ref={refs.verletPath} className="m-path verlet" />
            <circle ref={refs.verletDot} r="3.5" className="m-dot verlet" />
          </svg>
        </figure>

        <figure className="mech-graph">
          <figcaption className="t-label">
            Energy error · orbit <span className="t-numeric" ref={refs.orbits}>0.0</span> / 10
          </figcaption>
          <svg viewBox={`0 0 ${G_W} ${G_H}`} preserveAspectRatio="none" role="img" aria-label="Energy error over ten orbits">
            {[0.1, 0.2, 0.3, 0.4].map((v) => (
              <line key={v} x1="0" x2={G_W} y1={G_H - (v / E_MAX) * G_H} y2={G_H - (v / E_MAX) * G_H} className="g-grid" />
            ))}
            <polyline ref={refs.eulerGraph} className="g-line euler" />
            <polyline ref={refs.verletGraph} className="g-line verlet" />
          </svg>
          <div className="g-axis t-annotation">
            <span>orbit 0</span>
            <span>vertical scale 0 to 45%</span>
            <span>orbit 10</span>
          </div>
        </figure>
      </div>

      <p className="mech-source t-annotation">
        Computed live in your browser by src/physics/euler.ts and integrator.ts · Δt = {DT} · Verlet's largest error over the run:{' '}
        {sci(verletMax)}
      </p>
    </section>
  )
}
