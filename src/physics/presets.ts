import { vec } from './vec2'
import type { Body } from './body'

export type Preset = { name: string; create: () => Body[] }

const w = Math.sqrt(0.5) // binary orbital speed

export const PRESETS: Preset[] = [
  {
    name: 'Sun + planet',
    create: () => [
      { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
      { pos: vec(1, 0), vel: vec(0, 1), mass: 1e-6 },
    ],
  },
  {
    name: 'Binary star',
    create: () => [
      { pos: vec(-0.5, 0), vel: vec(0, -w), mass: 1 },
      { pos: vec(0.5, 0), vel: vec(0, w), mass: 1 },
    ],
  },
  {
    name: 'Figure-eight (3 bodies)',
    create: () => [
      { pos: vec(-0.97000436, 0.24308753), vel: vec(0.466203685, 0.43236573), mass: 1 },
      { pos: vec(0.97000436, -0.24308753), vel: vec(0.466203685, 0.43236573), mass: 1 },
      { pos: vec(0, 0), vel: vec(-0.93240737, -0.86473146), mass: 1 },
    ],
  },
]