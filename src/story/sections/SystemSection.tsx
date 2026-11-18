import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DT } from '../sim/liveSystem'
import { liveStats, scrollState } from '../scrollState'
import { revealLines } from '../motion'
import { sci } from '../format'

// Act IV. The camera pulls back from the Sun until the orbital plane opens
// out. The bodies are integrated live by ORBITAL's Velocity Verlet step,
// so the readout below shows the real state of that integration.

// Rhema's own sentences from the README introduction.
const BEATS = [
  "Each body's acceleration at a given time depends on where the other bodies are at that moment.",
  'For this reason, the velocity and position change continuously with time.',
  'Through Velocity Verlet, we take a really small step in time, Δt, which helps us get new positions and velocities, and the process is repeated.',
]

export default function SystemSection() {
  const root = useRef<HTMLElement>(null)
  const years = useRef<HTMLSpanElement>(null)
  const drift = useRef<HTMLSpanElement>(null)
  const bodies = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => (scrollState.system = self.progress),
      })
      gsap.utils.toArray<HTMLElement>('.sys-beat p').forEach((p) => revealLines(p, { start: 'top 75%' }))
      gsap.from('.hud', {
        autoAlpha: 0,
        y: 12,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 20%', end: 'top -20%', scrub: true },
      })
    }, el)

    // The readout updates a few times a second from the live simulation.
    let last = 0
    const tick = (time: number) => {
      if (time - last < 0.25 || scrollState.system <= 0) return
      last = time
      if (years.current) years.current.textContent = liveStats.years.toFixed(2)
      if (drift.current) drift.current.textContent = sci(liveStats.energyDrift)
      if (bodies.current) bodies.current.textContent = String(liveStats.bodies)
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      ctx.revert()
    }
  }, [])

  return (
    <section className="act system" ref={root} aria-labelledby="sys-title">
      <div className="sys-intro">
        <p className="t-label">Act VII</p>
        <h2 id="sys-title" className="t-heading">The system</h2>
      </div>
      {BEATS.map((b, i) => (
        <div className="sys-beat" key={i}>
          <p className="t-statement">{b}</p>
        </div>
      ))}

      <aside className="hud t-annotation" aria-label="Live simulation readout">
        <div className="hud-row hud-live">
          <i aria-hidden="true" /> Live N-body integration
        </div>
        <dl>
          <div>
            <dt>Method</dt>
            <dd>Velocity Verlet</dd>
          </div>
          <div>
            <dt>Δt</dt>
            <dd>{DT}</dd>
          </div>
          <div>
            <dt>Bodies</dt>
            <dd ref={bodies}>5</dd>
          </div>
          <div>
            <dt>Elapsed</dt>
            <dd>
              <span ref={years}>…</span> yr
            </dd>
          </div>
          <div>
            <dt>Energy drift</dt>
            <dd ref={drift}>…</dd>
          </div>
        </dl>
        <p className="hud-note">Rings at 1, 2 and 3 AU. Body sizes are not to scale.</p>
      </aside>
    </section>
  )
}
