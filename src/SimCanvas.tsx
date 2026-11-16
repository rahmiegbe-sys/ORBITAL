import { useEffect, useRef } from 'react'
import { vec } from './physics/vec2'
import type { Body } from './physics/body'
import { step } from './physics/integrator'

const G = 1
const DT = 0.002          // fixed physics time step
const STEPS_PER_FRAME = 10
const SCALE = 150         // pixels per 1 unit of distance

function initialBodies(): Body[] {
  return [
    { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
    { pos: vec(1, 0), vel: vec(0, 1), mass: 1e-6 },
  ]
}

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

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    let bodies = initialBodies()
    let frameId = 0

    const frame = () => {
      for (let s = 0; s < STEPS_PER_FRAME; s++) bodies = step(bodies, DT, G)
      draw(ctx, bodies)
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return <canvas ref={canvasRef} width={800} height={600} />
}