import type { Body } from '../physics/body'
import type { Vec2 } from '../physics/vec2'
import { type Background, drawBackground } from './background'
import { drawPlanet, drawStar } from './bodies'
import { type Trail, drawTrail } from './trails'

// Anything heavier than this is drawn as a star; lighter bodies are planets.
export const STAR_MASS_THRESHOLD = 0.01

// The view maps world coordinates (AU) to screen pixels.
export type View = { width: number; height: number; scale: number }

export function worldToScreen(p: Vec2, view: View): Vec2 {
  return {
    x: view.width / 2 + p.x * view.scale,
    y: view.height / 2 - p.y * view.scale, // maths y points up, screen y points down
  }
}

export type FrameInput = {
  bodies: Body[]
  trails: Trail[]
  background: Background
  view: View
  timeMs: number
  showTrails: boolean
}

export function renderFrame(ctx: CanvasRenderingContext2D, f: FrameInput) {
  const { bodies, view } = f
  drawBackground(ctx, f.background, view.width, view.height, f.timeMs)

  const screen = bodies.map((b) => worldToScreen(b.pos, view))
  const isStar = bodies.map((b) => b.mass > STAR_MASS_THRESHOLD)

  if (f.showTrails) {
    bodies.forEach((_, i) => {
      const pts = f.trails[i].map((p) => worldToScreen(p, view))
      pts.push(screen[i]) // connect the trail to where the body is now
      if (isStar[i]) drawTrail(ctx, pts, '255, 190, 130', 0.35)
      else drawTrail(ctx, pts, '130, 180, 255', 0.45)
    })
  }

  const starR = Math.max(8, view.scale * 0.06)
  const planetR = Math.max(5, view.scale * 0.035)
  const spin = f.timeMs * 0.0002

  screen.forEach((s, i) => {
    if (isStar[i]) drawStar(ctx, s.x, s.y, starR, spin + i)
  })

  // Each planet is lit by its nearest star.
  screen.forEach((s, i) => {
    if (isStar[i]) return
    let light: Vec2 | null = null
    let best = Infinity
    screen.forEach((t, j) => {
      if (!isStar[j]) return
      const d = Math.hypot(t.x - s.x, t.y - s.y)
      if (d < best) {
        best = d
        light = t
      }
    })
    const l: Vec2 = light ?? { x: s.x - 1, y: s.y }
    drawPlanet(ctx, s.x, s.y, planetR, l.x, l.y)
  })
}
