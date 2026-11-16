import { type Vec2, vec, add, sub, scale, lengthSq } from './vec2'
import type { Body } from './body'

export function accelerations(bodies: Body[], G: number, softening = 0): Vec2[] {
  const result: Vec2[] = []
  for (let i = 0; i < bodies.length; i++) {
    let a = vec(0, 0)
    for (let j = 0; j < bodies.length; j++) {
      if (i === j) continue
      const r = sub(bodies[j].pos, bodies[i].pos)
      const denom = Math.pow(lengthSq(r) + softening * softening, 1.5)
      a = add(a, scale(r, (G * bodies[j].mass) / denom))
    }
    result.push(a)
  }
  return result
}