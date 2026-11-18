import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EASE, revealLines } from '../motion'
import { reducedMotion } from '../scrollState'
import { sci } from '../format'
import { passes, runChecks, type Check } from '../sim/validation'

// Act V. A deliberately calm chapter: the test suite's checks, re-run in the
// visitor's browser on the real physics code, each shown with the value it
// measured and the limit it had to beat.

export default function ValidationSection() {
  const root = useRef<HTMLElement>(null)
  const [checks, setChecks] = useState<Check[] | null>(null)

  // Run the checks once, shortly before the chapter scrolls into view
  // (about 40,000 integration steps; a fraction of a second).
  useEffect(() => {
    const el = root.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 250%',
      once: true,
      onEnter: () => setTimeout(() => setChecks(runChecks()), 0),
    })
    return () => st.kill()
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      el.querySelectorAll('.val-intro p').forEach((p) => revealLines(p))
    }, el)
    return () => ctx.revert()
  }, [])

  // Rows settle in one after another once the results exist.
  useEffect(() => {
    const el = root.current
    if (!el || !checks || reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.from('.val-row', {
        opacity: 0,
        y: 10,
        duration: 0.7,
        ease: EASE.out,
        stagger: 0.06,
        scrollTrigger: { trigger: '.val-table', start: 'top 80%' },
      })
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [checks])

  const passed = checks?.filter(passes).length ?? 0

  return (
    <section className="act validation" ref={root} aria-labelledby="val-title">
      <div className="val-intro">
        <p className="t-label">Act V</p>
        <h2 id="val-title" className="t-heading">How I know it's correct</h2>
        {/* Rhema's own words from the README. */}
        <p className="t-body">
          A simulator also shows visuals. It might be right in code but wrong visually, and code that runs without errors
          can still give the wrong physics.
        </p>
        <p className="t-body">
          So the tests compare the simulation against things physics already tells us, such as my own hand calculation,
          the conservation of energy and momentum, and known orbital periods.
        </p>
      </div>

      <div className="val-table" role="table" aria-label="Checks re-run in this browser">
        <div className="val-row val-head t-annotation" role="row">
          <span role="columnheader">Check</span>
          <span role="columnheader">Measured here</span>
          <span role="columnheader">Limit</span>
          <span role="columnheader">Result</span>
        </div>
        {(checks ?? []).map((c) => {
          const ok = passes(c)
          return (
            <div className="val-row" role="row" key={c.name}>
              <span role="cell" className="val-name">
                <span className="val-title">{c.name}</span>
                <span className="t-annotation">{c.checks}</span>
              </span>
              <span role="cell" className="t-numeric">
                {c.name === 'Softening' ? (c.measured === 0 ? 'finite' : 'NaN') : c.above ? `${(c.measured * 100).toFixed(1)}%` : sci(c.measured)}
              </span>
              <span role="cell" className="t-numeric val-limit">
                {c.name === 'Softening' ? 'finite' : c.above ? `> ${c.limit * 100}%` : `< ${sci(c.limit)}`}
              </span>
              <span role="cell" className={`val-result ${ok ? 'ok' : 'fail'}`}>
                <i aria-hidden="true" />
                {ok ? 'Pass' : 'Fail'}
              </span>
            </div>
          )
        })}
        {!checks && <p className="t-annotation val-wait">Running the checks…</p>}
      </div>

      <p className="val-summary t-annotation">
        {checks
          ? `${passed} of ${checks.length} checks passed in your browser just now, on the same physics code and with the same limits as ORBITAL's Vitest suite.`
          : ' '}
      </p>
    </section>
  )
}
