import type { Body } from './body'
import { accelerations } from './gravity'
import { add, scale } from './vec2'

// Explicit (forward) Euler: uses the velocity and acceleration at the start
// of the step for the whole step. Kept for comparison with Velocity Verlet.
export function eulerStep(bodies: Body[], dt: number, G: number): Body[] {
  const a = accelerations(bodies, G)
  return bodies.map((b, i) => ({
    pos: add(b.pos, scale(b.vel, dt)),
    vel: add(b.vel, scale(a[i], dt)),
    mass: b.mass,
  }))
}
