import { add, scale } from './vec2'
import type { Body } from './body'
import { accelerations } from './gravity'

export function step(bodies: Body[], dt: number, G: number, softening = 0): Body[] {
  const a0 = accelerations(bodies, G, softening)

  // 1. half-kick + 2. drift
  const moved: Body[] = bodies.map((b, i) => {
    const vHalf = add(b.vel, scale(a0[i], dt / 2))
    return { pos: add(b.pos, scale(vHalf, dt)), vel: vHalf, mass: b.mass }
  })

  // 3. new forces at the new positions
  const a1 = accelerations(moved, G, softening)

  // 4. second half-kick
  return moved.map((b, i) => ({
    pos: b.pos,
    vel: add(b.vel, scale(a1[i], dt / 2)),
    mass: b.mass,
  }))
}