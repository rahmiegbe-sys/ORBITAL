import { describe, expect, test } from 'vitest'
import { vec } from './vec2'
import type { Body } from './body'
import { step } from './integrator'
import { totalEnergy } from './energy'

// Sun (mass 1) + tiny planet at distance 1, speed 1 → circular orbit, period 2π
function sunAndPlanet(): Body[] {
  return [
    { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
    { pos: vec(1, 0), vel: vec(0, 1), mass: 1e-6 },
  ]
}

describe('velocity verlet', () => {
  test('energy is conserved over 10 orbits', () => {
    let bodies = sunAndPlanet()
    const E0 = totalEnergy(bodies, 1)
    const dt = 0.01
    const steps = Math.round((10 * 2 * Math.PI) / dt)
    for (let s = 0; s < steps; s++) bodies = step(bodies, dt, 1)
    const relError = Math.abs((totalEnergy(bodies, 1) - E0) / E0)
    expect(relError).toBeLessThan(1e-6)
  })

  test('planet returns to start after one period', () => {
    let bodies = sunAndPlanet()
    const n = 628
    const dt = (2 * Math.PI) / n
    for (let s = 0; s < n; s++) bodies = step(bodies, dt, 1)
    expect(bodies[1].pos.x).toBeCloseTo(1, 3)
    expect(bodies[1].pos.y).toBeCloseTo(0, 3)
  })
})