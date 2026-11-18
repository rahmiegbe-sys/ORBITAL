import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Body } from '../../physics/body'
import { step } from '../../physics/integrator'
import { totalEnergy } from '../../physics/energy'
import { PRESETS } from '../../physics/presets'
import { length, sub } from '../../physics/vec2'
import { drawStar } from '../../render/bodies'
import { drawTrail } from '../../render/trails'
import { EASE } from '../motion'
import { reducedMotion } from '../scrollState'
import { sci } from '../format'

// Act IV. Three equal stars on the Chenciner–Montgomery figure-eight,
// integrated live with ORBITAL's own Velocity Verlet step and drawn with the
// simulator's own star and trail renderers. The readout reports how close the
// stars come back to their starting points after each full period.

const FIGURE_EIGHT = PRESETS.findIndex((p) => p.name === 'Figure-eight')
const T = 6.32591398 // published period, as in presets.test.ts
const N = 6326 // steps per period, as in presets.test.ts
const DT = T / N
const PERIOD_SECONDS = 7 // one period on screen takes this long
const TRAIL_POINTS = 420
const TRAIL_EVERY = 0.015 // simulation time between trail points

// Rhema's own sentences from "Why I built it".
const CAPTIONS = [
  'Although a three-body system is chaotic there are rare solutions.',
  'The figure-eight preset models one of them.',
  'It shows how these bodies can move and still be predicted.',
  'The prediction may not be perfect but it is accurate enough for observation and study.',
]

export default function ThreeBodySection() {
  const root = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const periodsRef = useRef<HTMLSpanElement>(null)
  const gapRef = useRef<HTMLSpanElement>(null)
  const driftRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!el || !canvas || !ctx) return

    const start = PRESETS[FIGURE_EIGHT].create()
    let bodies: Body[] = PRESETS[FIGURE_EIGHT].create()
    const e0 = totalEnergy(bodies, 1)
    const trails = bodies.map(() => [] as { x: number; y: number }[])
    let stepsDone = 0
    let sinceTrail = 0
    let lastGap: number | null = null

    let w = 0
    let h = 0
    let scale = 1
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scale = Math.min(w / 2.5, h / 0.95)
    }
    const toScreen = (x: number, y: number) => ({ x: w / 2 + x * scale, y: h / 2 - y * scale })

    const advance = (steps: number) => {
      for (let k = 0; k < steps; k++) {
        bodies = step(bodies, DT, 1)
        stepsDone++
        sinceTrail += DT
        if (sinceTrail >= TRAIL_EVERY) {
          sinceTrail = 0
          bodies.forEach((b, i) => {
            trails[i].push({ x: b.pos.x, y: b.pos.y })
            if (trails[i].length > TRAIL_POINTS) trails[i].shift()
          })
        }
        if (stepsDone % N === 0) {
          // A full period: how far is each star from where it started?
          lastGap = Math.max(...bodies.map((b, i) => length(sub(b.pos, start[i].pos))))
        }
      }
    }

    const draw = (timeMs: number) => {
      ctx.clearRect(0, 0, w, h)
      trails.forEach((tr) => drawTrail(ctx, tr.map((p) => toScreen(p.x, p.y)), '255, 196, 140', 0.75))
      const r = Math.max(5, scale * 0.045)
      bodies.forEach((b, i) => {
        const s = toScreen(b.pos.x, b.pos.y)
        drawStar(ctx, s.x, s.y, r, timeMs / 4000 + i)
      })
      if (periodsRef.current) periodsRef.current.textContent = Math.floor(stepsDone / N).toString()
      if (gapRef.current) gapRef.current.textContent = lastGap === null ? '…' : sci(lastGap)
      if (driftRef.current) driftRef.current.textContent = sci(Math.abs((totalEnergy(bodies, 1) - e0) / e0))
    }

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      draw(performance.now())
    })
    observer.observe(canvas)

    // Warm up one full period so the figure-eight is already traced.
    advance(N)

    let running = false
    let accum = 0
    const tick = (_time: number, deltaMs: number) => {
      if (!running) return
      accum += (Math.min(deltaMs, 50) / 1000 / PERIOD_SECONDS) * N
      const steps = Math.floor(accum)
      accum -= steps
      advance(steps)
      draw(performance.now())
    }

    const ctxGsap = gsap.context(() => {
      // Only integrate while the chapter is on screen. Created after the pin
      // (below) so its end accounts for the pinned scroll distance.
      const watchVisibility = () =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (running = self.isActive && !reducedMotion),
        })
      if (reducedMotion) {
        watchVisibility()
        return
      }
      const captions = gsap.utils.toArray<HTMLElement>('.tb-caption')
      gsap.set(captions.slice(1), { autoAlpha: 0, y: 16 })
      const tl = gsap.timeline({
        defaults: { ease: EASE.linear },
        scrollTrigger: { trigger: el, start: 'top top', end: '+=260%', pin: true, scrub: 0.6 },
      })
      captions.slice(1).forEach((c, i) => {
        // out completely, then in: two statements never overlap
        tl.to(captions[i], { autoAlpha: 0, y: -16, duration: 0.25 }, i + 0.7)
        tl.to(c, { autoAlpha: 1, y: 0, duration: 0.3 }, i + 0.98)
      })
      tl.to({}, { duration: 0.8 })
      watchVisibility()
    }, el)

    draw(performance.now())
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      observer.disconnect()
      ctxGsap.revert()
    }
  }, [])

  return (
    <section className="act threebody" ref={root} aria-labelledby="tb-title">
      <div className="tb-copy">
        <p className="t-label">Act IV</p>
        <h2 id="tb-title" className="t-heading">Three bodies</h2>
        <div className="tb-captions">
          {CAPTIONS.map((c) => (
            <p className="tb-caption t-statement" key={c}>
              {c}
            </p>
          ))}
        </div>
      </div>

      <figure className="tb-figure">
        <canvas ref={canvasRef} className="tb-canvas" role="img" aria-label="Three equal stars tracing a figure-eight orbit" />
        <figcaption className="tb-readout t-annotation">
          <div>
            <span>Period T</span>
            <span className="t-numeric">6.3259</span>
          </div>
          <div>
            <span>Periods completed</span>
            <span className="t-numeric" ref={periodsRef}>0</span>
          </div>
          <div>
            <span>Return gap, last period</span>
            <span className="t-numeric" ref={gapRef}>…</span>
          </div>
          <div>
            <span>Energy drift</span>
            <span className="t-numeric" ref={driftRef}>…</span>
          </div>
        </figcaption>
      </figure>

      <p className="tb-source t-annotation">
        Chenciner–Montgomery orbit (2000) · three equal masses · integrated live with Velocity Verlet, Δt = T / 6326 ·
        presets.test.ts checks every star returns to within 10⁻⁴ of its start
      </p>
    </section>
  )
}
