import { formatElapsed } from '../physics/units'
import { precisionFor } from '../physics/timeWarp'

export type Stats = { years: number; energyDrift: number; momentumDrift: number; dt: number; fps: number }

// Traffic-light status: green = accurate, amber = slipping, red = inaccurate.
function energyStatus(drift: number) {
  if (drift < 1e-6) return 'good'
  if (drift < 1e-3) return 'warn'
  return 'bad'
}

const PRECISION_TEXT = { high: 'High', good: 'Good', reduced: 'Reduced' } as const
const PRECISION_STATUS = { high: 'good', good: 'warn', reduced: 'bad' } as const

export default function StatsStrip({ stats }: { stats: Stats }) {
  const precision = precisionFor(stats.dt)
  return (
    <dl className="stats">
      <div className="stat">
        <dt>Elapsed</dt>
        <dd>{formatElapsed(stats.years)}</dd>
      </div>
      <div className="stat">
        <dt>Energy drift</dt>
        <dd>
          <span className={`dot ${energyStatus(stats.energyDrift)}`} />
          {stats.energyDrift.toExponential(1)}
        </dd>
      </div>
      <div className="stat">
        <dt>Momentum drift</dt>
        <dd>{stats.momentumDrift.toExponential(1)}</dd>
      </div>
      <div className="stat">
        <dt>Precision</dt>
        <dd>
          <span className={`dot ${PRECISION_STATUS[precision]}`} />
          {PRECISION_TEXT[precision]} · Δt {stats.dt.toFixed(4)}
        </dd>
      </div>
            <div className="stat">
        <dt>Frame rate</dt>
        <dd>{Math.round(stats.fps)} fps</dd>
      </div>
    </dl>
  )
}
