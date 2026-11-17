import { vec } from './vec2'
import type { Body } from './body'

export type Preset = { name: string; description: string; create: () => Body[] }

const w = Math.sqrt(0.5) // binary orbital speed

// Sun–Earth in the centre-of-mass frame (units: AU, solar masses, G = 1).
// Separation 1 AU, relative speed √(G(M+m)/r) for a circular orbit.
// Each body gets its share so total momentum is exactly zero.
const EARTH_MASS = 3.003e-6
const M_TOTAL = 1 + EARTH_MASS
const V_REL = Math.sqrt(M_TOTAL)

export const PRESETS: Preset[] = [
  {
    name: 'Sun and Earth',
    description: 'Real mass ratio · 1 AU · one orbit per year',
    create: () => [
      { pos: vec(-EARTH_MASS / M_TOTAL, 0), vel: vec(0, (-V_REL * EARTH_MASS) / M_TOTAL), mass: 1 },
      { pos: vec(1 / M_TOTAL, 0), vel: vec(0, V_REL / M_TOTAL), mass: EARTH_MASS },
    ],
  },
  {
    name: 'Binary star',
    description: 'Two equal stars · circular orbit',
    create: () => [
      { pos: vec(-0.5, 0), vel: vec(0, -w), mass: 1 },
      { pos: vec(0.5, 0), vel: vec(0, w), mass: 1 },
    ],
  },
  {
    name: 'Figure-eight',
    description: 'Three equal stars · Chenciner–Montgomery orbit (2000)',
    create: () => [
      { pos: vec(-0.97000436, 0.24308753), vel: vec(0.466203685, 0.43236573), mass: 1 },
      { pos: vec(0.97000436, -0.24308753), vel: vec(0.466203685, 0.43236573), mass: 1 },
      { pos: vec(0, 0), vel: vec(-0.93240737, -0.86473146), mass: 1 },
    ],
  },
]
