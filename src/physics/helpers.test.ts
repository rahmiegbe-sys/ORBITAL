import { describe, expect, test } from 'vitest'
import { length } from './vec2'
import { step } from './integrator'
import { totalMomentum } from './momentum'
import { PRESETS } from './presets'
import { formatElapsed, simTimeToYears } from './units'
import { BASE_DT, MAX_STEPS_PER_FRAME, planSteps, precisionFor } from './timeWarp'

describe('momentum', () => {
  test('every preset starts with zero total momentum (centre-of-mass frame)', () => {
    for (const p of PRESETS) {
      expect(length(totalMomentum(p.create()))).toBeLessThan(1e-7)
    }
  })

  test('momentum is conserved while the figure-eight runs', () => {
    let b = PRESETS[2].create()
    for (let i = 0; i < 5000; i++) b = step(b, BASE_DT, 1)
    expect(length(totalMomentum(b))).toBeLessThan(1e-9)
  })
})

describe('units', () => {
  test('2π time units is one year', () => {
    expect(simTimeToYears(2 * Math.PI)).toBeCloseTo(1, 12)
  })

  test('formatElapsed picks a sensible unit', () => {
    expect(formatElapsed(1 / 365.25)).toBe('1.0 days')
    expect(formatElapsed(0.5)).toBe('6.0 months')
    expect(formatElapsed(3)).toBe('3.00 years')
    expect(formatElapsed(250)).toBe('2.50 centuries')
  })
})

describe('time warp', () => {
  test('small jumps use dt no larger than BASE_DT and cover the time exactly', () => {
    const plan = planSteps(0.05)
    expect(plan.dt).toBeLessThanOrEqual(BASE_DT)
    expect(plan.steps * plan.dt).toBeCloseTo(0.05, 12)
  })

  test('huge jumps are capped and dt grows instead', () => {
    const plan = planSteps(100)
    expect(plan.steps).toBe(MAX_STEPS_PER_FRAME)
    expect(plan.dt).toBeGreaterThan(BASE_DT)
    expect(plan.steps * plan.dt).toBeCloseTo(100, 9)
  })

  test('precision label follows dt', () => {
    expect(precisionFor(BASE_DT)).toBe('high')
    expect(precisionFor(0.01)).toBe('good')
    expect(precisionFor(0.05)).toBe('reduced')
  })
})
