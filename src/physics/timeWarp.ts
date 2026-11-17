// Time warp: how much simulated time passes per real second, and how we
// split that into integrator steps without letting dt grow out of control.

export const BASE_DT = 0.002 // preferred step size (simulation time units)
export const MAX_STEPS_PER_FRAME = 2000 // what the computer can afford each frame

export type WarpOption = { label: string; yearsPerSecond: number }

export const WARP_OPTIONS: WarpOption[] = [
  { label: '1 day/s', yearsPerSecond: 1 / 365.25 },
  { label: '1 wk/s', yearsPerSecond: 7 / 365.25 },
  { label: '1 mo/s', yearsPerSecond: 1 / 12 },
  { label: '1 yr/s', yearsPerSecond: 1 },
  { label: '10 yr/s', yearsPerSecond: 10 },
  { label: '1 century/s', yearsPerSecond: 100 },
]

export type StepPlan = { steps: number; dt: number }

// Cover `simTime` exactly. Use dt ≤ BASE_DT when affordable; otherwise cap the
// number of steps and accept a larger dt (less accurate — the UI shows this).
export function planSteps(simTime: number): StepPlan {
  if (simTime <= 0) return { steps: 0, dt: BASE_DT }
  const steps = Math.min(Math.ceil(simTime / BASE_DT), MAX_STEPS_PER_FRAME)
  return { steps, dt: simTime / steps }
}

export type Precision = 'high' | 'good' | 'reduced'

export function precisionFor(dt: number): Precision {
  if (dt <= BASE_DT * 1.0001) return 'high'
  if (dt < 0.02) return 'good'
  return 'reduced'
}
