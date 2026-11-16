import { sub, length, lengthSq } from './vec2'
import type { Body } from './body'

export function totalEnergy(bodies: Body[], G: number): number {
  let kinetic = 0
  let potential = 0
  for (let i = 0; i < bodies.length; i++) {
    kinetic += 0.5 * bodies[i].mass * lengthSq(bodies[i].vel)
    for (let j = i + 1; j < bodies.length; j++) {
      const d = length(sub(bodies[j].pos, bodies[i].pos))
      potential -= (G * bodies[i].mass * bodies[j].mass) / d
    }
  }
  return kinetic + potential
}