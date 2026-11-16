import { describe, expect, test } from 'vitest'
import { vec } from './vec2'
import type { Body } from './body'
import { accelerations } from './gravity'

// Your hand exercise: G = 1, m1 = 1 at (0,0), m2 = 2 at (3,4)
const bodies: Body[] = [
  { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
  { pos: vec(3, 4), vel: vec(0, 0), mass: 2 },
]

describe('gravity', () => {
  test('a1 matches hand calculation', () => {
    const [a1] = accelerations(bodies, 1)
    expect(a1.x).toBeCloseTo(0.048, 10)
    expect(a1.y).toBeCloseTo(0.064, 10)
  })

  test('a2 matches hand calculation', () => {
    const [, a2] = accelerations(bodies, 1)
    expect(a2.x).toBeCloseTo(-0.024, 10)
    expect(a2.y).toBeCloseTo(-0.032, 10)
  })

  test('Newton 3rd law: m1*a1 + m2*a2 = 0', () => {
    const [a1, a2] = accelerations(bodies, 1)
    expect(1 * a1.x + 2 * a2.x).toBeCloseTo(0, 10)
    expect(1 * a1.y + 2 * a2.y).toBeCloseTo(0, 10)
  })
    test('softening prevents NaN when bodies overlap', () => {
    const overlap: Body[] = [
      { pos: vec(1, 1), vel: vec(0, 0), mass: 1 },
      { pos: vec(1, 1), vel: vec(0, 0), mass: 1 },
    ]
    const [a1] = accelerations(overlap, 1, 0.1)
    expect(Number.isFinite(a1.x)).toBe(true)
    expect(Number.isFinite(a1.y)).toBe(true)
  })
})