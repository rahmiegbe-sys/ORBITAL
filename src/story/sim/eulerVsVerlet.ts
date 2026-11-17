import type { Body } from '../../physics/body'
import { eulerStep } from '../../physics/euler'
import { step } from '../../physics/integrator'
import { totalEnergy } from '../../physics/energy'
import { vec } from '../../physics/vec2'

// The exact experiment from src/physics/euler.test.ts, run once in the browser:
// Sun (mass 1) and a light planet on a circular orbit of radius 1, dt = 0.01,
// 10 orbits. Nothing here is drawn by hand; every point comes from the engine.

export const DT = 0.01
export const STEPS = Math.round((10 * 2 * Math.PI) / DT)
const SAMPLE_EVERY = 8

export type Run = {
  x: Float32Array // planet position relative to the Sun, one entry per sample
  y: Float32Array
  energyError: Float32Array // |E - E0| / |E0| at each sample
}

function sunAndPlanet(): Body[] {
  return [
    { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
    { pos: vec(1, 0), vel: vec(0, 1), mass: 1e-6 },
  ]
}

function record(method: (b: Body[], dt: number, G: number) => Body[]): Run {
  const n = Math.floor(STEPS / SAMPLE_EVERY) + 1
  const run: Run = { x: new Float32Array(n), y: new Float32Array(n), energyError: new Float32Array(n) }
  let bodies = sunAndPlanet()
  const e0 = totalEnergy(bodies, 1)
  let k = 0
  for (let s = 0; s <= STEPS; s++) {
    if (s % SAMPLE_EVERY === 0 && k < n) {
      run.x[k] = bodies[1].pos.x - bodies[0].pos.x
      run.y[k] = bodies[1].pos.y - bodies[0].pos.y
      run.energyError[k] = Math.abs((totalEnergy(bodies, 1) - e0) / e0)
      k++
    }
    if (s < STEPS) bodies = method(bodies, DT, 1)
  }
  return run
}

let cache: { euler: Run; verlet: Run } | null = null

export function getRuns() {
  if (!cache) cache = { euler: record(eulerStep), verlet: record(step) }
  return cache
}
