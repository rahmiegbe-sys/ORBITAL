import { type Vec2, vec, add, sub, scale, length } from './vec2'
import type { Body } from './body'

export function accelerations(bodies: Body[], G: number): Vec2[] {
  const result: Vec2[] = []
  for (let i = 0; i < bodies.length; i++) {
    let a = vec(0, 0)
    for (let j = 0; j < bodies.length; j++) {
      if (i === j) continue
      const r = sub(bodies[j].pos, bodies[i].pos)
      const d = length(r)
      a = add(a, scale(r, (G * bodies[j].mass) / (d * d * d)))
    }
    result.push(a)
  }
  return result
}