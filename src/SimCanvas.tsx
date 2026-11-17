import { useEffect, useRef, useState } from 'react'
import type { Body } from './physics/body'
import { step } from './physics/integrator'
import { PRESETS } from './physics/presets'
import { totalEnergy } from './physics/energy'
import { totalMomentum } from './physics/momentum'
import { length, sub, type Vec2 } from './physics/vec2'
import { TIME_UNITS_PER_YEAR, formatElapsed, simTimeToYears } from './physics/units'
import { BASE_DT, WARP_OPTIONS, planSteps } from './physics/timeWarp'
import { type Background, createBackground } from './render/background'
import { type Trail, TRAIL_SPACING, pushTrailPoint } from './render/trails'
import { type View, renderFrame } from './render/renderer'
import ControlDock from './components/ControlDock'
import StatsStrip, { type Stats } from './components/StatsStrip'

const G = 1
const DEFAULT_WARP = 3 // 1 yr/s
const MAX_FRAME_SECONDS = 1 / 30 // if the tab stalls, don't try to catch up all at once

// Everything the animation loop changes 60 times a second lives in one plain
// object inside a ref, so updating it never forces React to re-render.
type SimState = {
  bodies: Body[]
  trails: Trail[]
  t: number // simulation time
  dt: number // step size used in the last frame
  e0: number // energy at start
  p0: Vec2 // momentum at start
  sinceTrailPoint: number
}

function freshState(presetIndex: number): SimState {
  const bodies = PRESETS[presetIndex].create()
  return {
    bodies,
    trails: bodies.map(() => []),
    t: 0,
    dt: BASE_DT,
    e0: totalEnergy(bodies, G),
    p0: totalMomentum(bodies),
    sinceTrailPoint: 0,
  }
}

const ZERO_STATS: Stats = { years: 0, energyDrift: 0, momentumDrift: 0, dt: BASE_DT }

export default function SimCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const simRef = useRef<SimState>(freshState(0))
  const presetRef = useRef(0)
  const runningRef = useRef(true)
  const warpRef = useRef(DEFAULT_WARP)
  const trailsRef = useRef(true)

  const [presetIndex, setPresetIndex] = useState(0)
  const [running, setRunning] = useState(true)
  const [warpIndex, setWarpIndex] = useState(DEFAULT_WARP)
  const [showTrails, setShowTrails] = useState(true)
  const [stats, setStats] = useState<Stats>(ZERO_STATS)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !wrap || !ctx) return

    let view: View = { width: 0, height: 0, scale: 1 }
    let background: Background | null = null

    // Keep the canvas sharp at any size and on high-density screens.
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      view = { width, height, scale: Math.min(width, height) * 0.33 }
      background = createBackground(width, height, dpr)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(wrap)

    let frameId = 0
    let frameCount = 0
    let last = performance.now()

    const frame = (now: number) => {
      const frameSeconds = Math.min((now - last) / 1000, MAX_FRAME_SECONDS)
      last = now
      const s = simRef.current

      if (runningRef.current) {
        // Real seconds → simulated time → a plan of integrator steps.
        const simTime = WARP_OPTIONS[warpRef.current].yearsPerSecond * TIME_UNITS_PER_YEAR * frameSeconds
        const plan = planSteps(simTime)
        for (let k = 0; k < plan.steps; k++) {
          s.bodies = step(s.bodies, plan.dt, G)
          s.sinceTrailPoint += plan.dt
          if (s.sinceTrailPoint >= TRAIL_SPACING) {
            s.sinceTrailPoint = 0
            s.bodies.forEach((b, i) => pushTrailPoint(s.trails[i], b.pos))
          }
        }
        s.t += plan.steps * plan.dt
        if (plan.steps > 0) s.dt = plan.dt
      }

      if (background) {
        renderFrame(ctx, {
          bodies: s.bodies,
          trails: s.trails,
          background,
          view,
          timeMs: now,
          showTrails: trailsRef.current,
        })
      }

      // Update the numbers ~10 times a second — fast enough to read, cheap for React.
      if (++frameCount % 6 === 0) {
        setStats({
          years: simTimeToYears(s.t),
          energyDrift: Math.abs((totalEnergy(s.bodies, G) - s.e0) / s.e0),
          momentumDrift: length(sub(totalMomentum(s.bodies), s.p0)),
          dt: s.dt,
        })
      }

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [])

  const startPreset = (i: number) => {
    presetRef.current = i
    setPresetIndex(i)
    simRef.current = freshState(i)
    setStats(ZERO_STATS)
  }

  const togglePlay = () => {
    runningRef.current = !runningRef.current
    setRunning(runningRef.current)
  }

  const chooseWarp = (i: number) => {
    warpRef.current = i
    setWarpIndex(i)
  }

  const toggleTrails = () => {
    trailsRef.current = !trailsRef.current
    setShowTrails(trailsRef.current)
    if (!trailsRef.current) simRef.current.trails = simRef.current.bodies.map(() => [])
  }

  const preset = PRESETS[presetIndex]

  return (
    <section className="observatory">
      <div className="viewport" ref={wrapRef}>
        <canvas ref={canvasRef} className="sky" />
        <div className="overlay overlay-left">
          <div className="wordmark">ORBITAL</div>
          <div className="caption">
            {preset.name} · {preset.description}
          </div>
        </div>
        <div className="overlay overlay-right">
          <div className="label">Elapsed</div>
          <div className="elapsed">{formatElapsed(stats.years)}</div>
        </div>
      </div>

      <ControlDock
        running={running}
        onTogglePlay={togglePlay}
        onReset={() => startPreset(presetRef.current)}
        presetIndex={presetIndex}
        onPreset={startPreset}
        warpIndex={warpIndex}
        onWarp={chooseWarp}
        showTrails={showTrails}
        onToggleTrails={toggleTrails}
      />
      <StatsStrip stats={stats} />
    </section>
  )
}
