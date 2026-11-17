import { describe, it, expect } from 'vitest'
import type { Body } from './body'
import { sub, length, vec } from './vec2'
import { step } from './integrator'
import { eulerStep } from './euler'
import { totalEnergy } from './energy'

// Sun (mass 1) + tiny planet at distance 1, speed 1: circular orbit, period 2π
function sunAndPlanet(): Body[] {
  return [
    { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
    { pos: vec(1, 0), vel: vec(0, 1), mass: 1e-6 },
  ]
}

type Stepper = (bodies: Body[], dt: number, G: number) => Body[]

// Run a method for 10 orbits, then report energy error and orbit radius
function run(method: Stepper) {
  let bodies = sunAndPlanet()
  const E0 = totalEnergy(bodies, 1)
  const dt = 0.01
  const steps = Math.round((10 * 2 * Math.PI) / dt)
   let maxError = 0
  for (let s = 0; s < steps; s++) {
    bodies = method(bodies, dt, 1)
    const err = Math.abs((totalEnergy(bodies, 1) - E0) / E0)
    if (err > maxError) maxError = err
  }
  const energyError = Math.abs((totalEnergy(bodies, 1) - E0) / E0)
  const radius = length(sub(bodies[1].pos, bodies[0].pos))
  return { energyError, maxError, radius }
}

describe('Euler vs. Velocity Verlet (10 orbits, dt = 0.01)', () => {
  const euler = run(eulerStep)
  const verlet = run(step)
  console.log('Euler :', euler)
  console.log('Verlet:', verlet)

  it('Euler gains energy and spirals outward', () => {
    expect(euler.energyError).toBeGreaterThan(0.3)
    expect(euler.radius).toBeGreaterThan(1.5)
  })

  it('Verlet keeps energy and radius', () => {
    expect(verlet.energyError).toBeLessThan(1e-6)
        expect(verlet.maxError).toBeLessThan(1e-8)
    expect(verlet.radius).toBeCloseTo(1, 4)
  })
})