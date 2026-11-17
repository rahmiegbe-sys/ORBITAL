import { useEffect, useRef, useState } from 'react'
import type { Body } from './physics/body'
import { step } from './physics/integrator'
import { PRESETS } from './physics/presets'
import { totalEnergy } from './physics/energy'

const G = 1
const DT = 0.002          // fixed physics time step
const STEPS_PER_FRAME = 10
const SCALE = 150         // pixels per 1 unit of distance

function draw(ctx: CanvasRenderingContext2D, bodies: Body[]) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, w, h)
  for (const b of bodies) {
    const x = w / 2 + b.pos.x * SCALE
    const y = h / 2 - b.pos.y * SCALE   // flip y
    ctx.beginPath()
    ctx.arc(x, y, b.mass > 0.01 ? 10 : 4, 0, 2 * Math.PI)
    ctx.fillStyle = b.mass > 0.01 ? 'gold' : 'deepskyblue'
    ctx.fill()
  }
}

export default function SimCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const presetRef = useRef(0)
  const bodiesRef = useRef<Body[]>(PRESETS[0].create())
  const e0Ref = useRef(totalEnergy(PRESETS[0].create(), G))
  const runningRef = useRef(true)
  const [running, setRunning] = useState(true)
  const [presetIndex, setPresetIndex] = useState(0)
  const [drift, setDrift] = useState(0)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    let frameId = 0
    let frameCount = 0
    const frame = () => {
      if (runningRef.current) {
        for (let s = 0; s < STEPS_PER_FRAME; s++) {
          bodiesRef.current = step(bodiesRef.current, DT, G)
        }
      }
      draw(ctx, bodiesRef.current)

      frameCount++
      if (frameCount % 10 === 0) {
        const e = totalEnergy(bodiesRef.current, G)
        setDrift(Math.abs((e - e0Ref.current) / e0Ref.current))
      }

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const startPreset = (i: number) => {
    presetRef.current = i
    setPresetIndex(i)
    bodiesRef.current = PRESETS[i].create()
    e0Ref.current = totalEnergy(bodiesRef.current, G)
    setDrift(0)
  }

  const togglePlay = () => {
    runningRef.current = !runningRef.current
    setRunning(runningRef.current)
  }

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={600} />
      <div>
        <select value={presetIndex} onChange={(e) => startPreset(Number(e.target.value))}>
          {PRESETS.map((p, i) => (
            <option key={p.name} value={i}>{p.name}</option>
          ))}
        </select>
        <button onClick={togglePlay}>{running ? 'Pause' : 'Play'}</button>
        <button onClick={() => startPreset(presetRef.current)}>Reset</button>
      </div>
      <p>Energy drift: {(drift * 100).toExponential(2)} %</p>
    </div>
  )
}