import { describe, expect, test } from 'vitest'
import { sub, length } from './vec2'
import { step } from './integrator'
import { PRESETS } from './presets'

describe('presets', () => {
  test('binary stars stay 1 unit apart', () => {
    let b = PRESETS[1].create()
    for (let i = 0; i < 20000; i++) {
      b = step(b, 0.002, 1)
      expect(length(sub(b[1].pos, b[0].pos))).toBeCloseTo(1, 4)
    }
  })

  test('figure-eight returns to start after one period', () => {
    let b = PRESETS[2].create()
    const start = PRESETS[2].create()
    const T = 6.32591398
    const n = 6326
    for (let i = 0; i < n; i++) b = step(b, T / n, 1)
    for (let k = 0; k < 3; k++) {
      expect(length(sub(b[k].pos, start[k].pos))).toBeLessThan(1e-4)
    }
  })
})