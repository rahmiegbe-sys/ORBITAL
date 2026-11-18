import type { Body } from '../../physics/body'
import { accelerations } from '../../physics/gravity'
import { step } from '../../physics/integrator'
import { eulerStep } from '../../physics/euler'
import { totalEnergy } from '../../physics/energy'
import { totalMomentum } from '../../physics/momentum'
import { PRESETS } from '../../physics/presets'
import { BASE_DT, planSteps } from '../../physics/timeWarp'
import { length, sub, vec } from '../../physics/vec2'

// The checks from ORBITAL's Vitest suite, re-run in the visitor's browser on
// the same physics code with the same tolerances. Vitest's toBeCloseTo(x, d)
// passes when |difference| < 10^-d / 2, so those limits are written that way.

export type Check = {
  name: string
  checks: string // what physics says should happen
  measured: number // the value this browser just computed
  limit: number // must be below this (or above, if `above` is set)
  above?: boolean
  file: string
}

const closeTo = (d: number) => Math.pow(10, -d) / 2

function figureEight() {
  return PRESETS[PRESETS.findIndex((p) => p.name === 'Figure-eight')]
}

function sunAndPlanet(): Body[] {
  return [
    { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
    { pos: vec(1, 0), vel: vec(0, 1), mass: 1e-6 },
  ]
}

export function runChecks(): Check[] {
  const out: Check[] = []

  // gravity.test.ts: the hand calculation, G = 1, m1 = 1 at (0,0), m2 = 2 at (3,4)
  const pair: Body[] = [
    { pos: vec(0, 0), vel: vec(0, 0), mass: 1 },
    { pos: vec(3, 4), vel: vec(0, 0), mass: 2 },
  ]
  const [a1, a2] = accelerations(pair, 1)
  out.push({
    name: 'Two-body acceleration',
    checks: 'a₁ matches the hand calculation (0.048, 0.064)',
    measured: Math.max(Math.abs(a1.x - 0.048), Math.abs(a1.y - 0.064)),
    limit: closeTo(10),
    file: 'gravity.test.ts',
  })
  out.push({
    name: "Newton's third law",
    checks: 'm₁a₁ + m₂a₂ = 0',
    measured: Math.max(Math.abs(a1.x + 2 * a2.x), Math.abs(a1.y + 2 * a2.y)),
    limit: closeTo(10),
    file: 'gravity.test.ts',
  })
  const overlap: Body[] = [
    { pos: vec(1, 1), vel: vec(0, 0), mass: 1 },
    { pos: vec(1, 1), vel: vec(0, 0), mass: 1 },
  ]
  const [soft] = accelerations(overlap, 1, 0.1)
  out.push({
    name: 'Softening',
    checks: 'overlapping bodies give a finite number, not NaN',
    measured: Number.isFinite(soft.x) && Number.isFinite(soft.y) ? 0 : 1,
    limit: 0.5,
    file: 'gravity.test.ts',
  })

  // integrator.test.ts
  let b = sunAndPlanet()
  const e0 = totalEnergy(b, 1)
  const steps = Math.round((10 * 2 * Math.PI) / 0.01)
  for (let s = 0; s < steps; s++) b = step(b, 0.01, 1)
  out.push({
    name: 'Energy conservation',
    checks: 'relative energy error after 10 orbits',
    measured: Math.abs((totalEnergy(b, 1) - e0) / e0),
    limit: 1e-6,
    file: 'integrator.test.ts',
  })
  b = sunAndPlanet()
  for (let s = 0; s < 628; s++) b = step(b, (2 * Math.PI) / 628, 1)
  out.push({
    name: 'Orbital period',
    checks: 'the planet is back at (1, 0) after 2π',
    measured: Math.max(Math.abs(b[1].pos.x - 1), Math.abs(b[1].pos.y)),
    limit: closeTo(3),
    file: 'integrator.test.ts',
  })

  // presets.test.ts
  let bin = PRESETS[1].create()
  let worst = 0
  for (let i = 0; i < 20000; i++) {
    bin = step(bin, 0.002, 1)
    worst = Math.max(worst, Math.abs(length(sub(bin[1].pos, bin[0].pos)) - 1))
  }
  out.push({
    name: 'Binary star',
    checks: 'the two stars stay 1 AU apart at every one of 20,000 steps',
    measured: worst,
    limit: closeTo(4),
    file: 'presets.test.ts',
  })
  const fig = figureEight()
  let f = fig.create()
  const start = fig.create()
  for (let i = 0; i < 6326; i++) f = step(f, 6.32591398 / 6326, 1)
  out.push({
    name: 'Figure-eight',
    checks: 'every star returns to its start after T ≈ 6.3259',
    measured: Math.max(...f.map((body, k) => length(sub(body.pos, start[k].pos)))),
    limit: 1e-4,
    file: 'presets.test.ts',
  })

  // helpers.test.ts
  out.push({
    name: 'Momentum at the start',
    checks: 'every preset starts with zero total momentum',
    measured: Math.max(...PRESETS.map((p) => length(totalMomentum(p.create())))),
    limit: 1e-7,
    file: 'helpers.test.ts',
  })
  f = fig.create()
  for (let i = 0; i < 5000; i++) f = step(f, BASE_DT, 1)
  out.push({
    name: 'Momentum conserved',
    checks: 'total momentum after 5,000 steps of the figure-eight',
    measured: length(totalMomentum(f)),
    limit: 1e-9,
    file: 'helpers.test.ts',
  })
  const plan = planSteps(100)
  out.push({
    name: 'Time warp',
    checks: 'a huge time jump is split into steps that cover it exactly',
    measured: Math.abs(plan.steps * plan.dt - 100),
    limit: closeTo(9),
    file: 'helpers.test.ts',
  })

  // euler.test.ts
  let eu = sunAndPlanet()
  const eE0 = totalEnergy(eu, 1)
  for (let s = 0; s < steps; s++) eu = eulerStep(eu, 0.01, 1)
  out.push({
    name: 'Euler fails',
    checks: "Euler's energy error after 10 orbits (it should be large)",
    measured: Math.abs((totalEnergy(eu, 1) - eE0) / eE0),
    limit: 0.3,
    above: true,
    file: 'euler.test.ts',
  })

  return out
}

export const passes = (c: Check) => (c.above ? c.measured > c.limit : c.measured < c.limit)
