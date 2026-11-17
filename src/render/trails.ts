import type { Vec2 } from '../physics/vec2'

// A trail is a list of past positions in WORLD coordinates (AU).
// Points are recorded at a fixed spacing in *simulation* time, not once per
// screen frame — so the trail stays smooth at any time-warp speed.
export type Trail = Vec2[]

export const TRAIL_SPACING = 0.02 // simulation time units between points
export const TRAIL_MAX_POINTS = 600 // ≈ two orbits for every preset

export function pushTrailPoint(trail: Trail, p: Vec2) {
  trail.push(p)
  if (trail.length > TRAIL_MAX_POINTS) trail.shift()
}

const BANDS = 24 // draw in bands of equal opacity: far fewer canvas calls

// Older points are fainter and thinner; the newest end joins the live body.
export function drawTrail(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  rgb: string,
  maxAlpha: number,
) {
  const n = points.length
  if (n < 2) return
  const per = Math.max(1, Math.ceil(n / BANDS))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let start = 0; start < n - 1; start += per) {
    const end = Math.min(start + per, n - 1)
    const f = end / (n - 1)
    ctx.strokeStyle = `rgba(${rgb}, ${f * maxAlpha})`
    ctx.lineWidth = 0.6 + f * 1.6
    ctx.beginPath()
    ctx.moveTo(points[start].x, points[start].y)
    for (let i = start + 1; i <= end; i++) ctx.lineTo(points[i].x, points[i].y)
    ctx.stroke()
  }
}
