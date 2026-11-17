import type { Body } from '../../physics/body'
import { step } from '../../physics/integrator'
import { totalEnergy } from '../../physics/energy'
import { vec } from '../../physics/vec2'

// A live N-body system for the finale, integrated with ORBITAL's own
// Velocity Verlet step. One star and four planets; every body pulls on
// every other body. Units as in the simulator: G = 1, solar masses, AU,
// 2π time units = 1 year. This is an illustrative system, not the real
// Solar System, but its motion is computed, not animated by hand.

export const G = 1
export const DT = 0.002

type PlanetSpec = { r: number; mass: number; speedFactor: number; phase: number }

// speedFactor = 1 gives a circular orbit; below 1 gives an ellipse.
export const PLANETS: PlanetSpec[] = [
  { r: 0.75, mass: 2e-7, speedFactor: 1.0, phase: 0.4 },
  { r: 1.2, mass: 3e-6, speedFactor: 1.0, phase: 2.3 },
  { r: 1.9, mass: 3e-7, speedFactor: 0.9, phase: 4.1 },
  { r: 3.1, mass: 9.5e-4, speedFactor: 1.0, phase: 5.6 },
]

export function createSystem(): Body[] {
  const bodies: Body[] = [{ pos: vec(0, 0), vel: vec(0, 0), mass: 1 }]
  for (const p of PLANETS) {
    const v = Math.sqrt(G / p.r) * p.speedFactor
    const c = Math.cos(p.phase)
    const s = Math.sin(p.phase)
    bodies.push({ pos: vec(p.r * c, p.r * s), vel: vec(-v * s, v * c), mass: p.mass })
  }
  // Move into the centre-of-mass frame so total momentum is zero.
  let px = 0
  let py = 0
  for (const b of bodies.slice(1)) {
    px += b.mass * b.vel.x
    py += b.mass * b.vel.y
  }
  bodies[0].vel = vec(-px / bodies[0].mass, -py / bodies[0].mass)
  return bodies
}

export class LiveSystem {
  bodies = createSystem()
  t = 0
  readonly e0 = totalEnergy(this.bodies, G)

  // Advance by simTime, in steps of at most DT.
  advance(simTime: number) {
    const steps = Math.min(Math.ceil(simTime / DT), 400)
    if (steps <= 0) return
    const dt = simTime / steps
    for (let k = 0; k < steps; k++) this.bodies = step(this.bodies, dt, G)
    this.t += simTime
  }

  energyDrift() {
    return Math.abs((totalEnergy(this.bodies, G) - this.e0) / this.e0)
  }
}
