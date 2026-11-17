import { PRESETS } from '../physics/presets'
import { WARP_OPTIONS } from '../physics/timeWarp'

type Props = {
  running: boolean
  onTogglePlay: () => void
  onReset: () => void
  presetIndex: number
  onPreset: (i: number) => void
  warpIndex: number
  onWarp: (i: number) => void
  showTrails: boolean
  onToggleTrails: () => void
}

// Small inline icons (no icon library needed).
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
)
const ResetIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
  </svg>
)
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 10l5 5 5-5" /></svg>
)

export default function ControlDock(p: Props) {
  return (
    <div className="dock">
      <div className="dock-row">
        <button className="icon-btn primary" onClick={p.onTogglePlay} aria-label={p.running ? 'Pause' : 'Play'}>
          {p.running ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="icon-btn" onClick={p.onReset} aria-label="Reset">
          <ResetIcon />
        </button>

        <label className="select">
          <span className="sr-only">System</span>
          <select value={p.presetIndex} onChange={(e) => p.onPreset(Number(e.target.value))}>
            {PRESETS.map((preset, i) => (
              <option key={preset.name} value={i}>{preset.name}</option>
            ))}
          </select>
          <ChevronIcon />
        </label>

        <button
          className={`switch ${p.showTrails ? 'on' : ''}`}
          role="switch"
          aria-checked={p.showTrails}
          onClick={p.onToggleTrails}
        >
          <span>Trails</span>
          <span className="track"><span className="thumb" /></span>
        </button>
      </div>

      <div className="dock-row">
        <span className="label">Time warp</span>
        <div className="segmented" role="radiogroup" aria-label="Time warp">
          {WARP_OPTIONS.map((w, i) => (
            <button
              key={w.label}
              role="radio"
              aria-checked={i === p.warpIndex}
              className={i === p.warpIndex ? 'on' : ''}
              onClick={() => p.onWarp(i)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
