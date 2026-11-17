import { type Vec2, add, scale, vec } from './vec2'
import type { Body } from './body'

// Total linear momentum P = Σ m·v. With no outside forces it must stay constant.
export function totalMomentum(bodies: Body[]): Vec2 {
  return bodies.reduce((p, b) => add(p, scale(b.vel, b.mass)), vec(0, 0))
}
