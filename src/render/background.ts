// Deep-space backdrop: a faint dust band plus a starfield.
// Most of it never changes, so it is painted once onto an offscreen canvas;
// only a small set of "twinkle" stars is redrawn every frame.

type Twinkle = { x: number; y: number; size: number; alpha: number; phase: number }

export type Background = { base: HTMLCanvasElement; twinkles: Twinkle[] }

// Small seeded random generator (mulberry32) so the sky looks the same every load.
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createBackground(width: number, height: number, dpr: number): Background {
  const base = document.createElement('canvas')
  base.width = Math.round(width * dpr)
  base.height = Math.round(height * dpr)
  const ctx = base.getContext('2d')
  const rand = seeded(7)
  const area = (width * height) / (1200 * 640)

  if (ctx) {
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)

    // Dust band: a diagonal river of very faint violet grains.
    const grains = Math.round(1400 * area)
    for (let i = 0; i < grains; i++) {
      const u = rand()
      const spread = (rand() - 0.5) * height * 0.3 * (1 - Math.abs(u - 0.5))
      const x = u * width
      const y = height * 0.2 + u * height * 0.55 + spread
      ctx.fillStyle = `rgba(150, 130, 195, ${rand() * 0.07})`
      const s = rand() * 1.3 + 0.3
      ctx.fillRect(x, y, s, s)
    }

    // Static stars.
    const stars = Math.round(450 * area)
    for (let i = 0; i < stars; i++) {
      ctx.fillStyle = `rgba(232, 230, 255, ${rand() * 0.45 + 0.08})`
      const s = rand() * 1.2 + 0.3
      ctx.fillRect(rand() * width, rand() * height, s, s)
    }
  }

  const twinkles: Twinkle[] = []
  const count = Math.round(110 * area)
  for (let i = 0; i < count; i++) {
    twinkles.push({
      x: rand() * width,
      y: rand() * height,
      size: rand() * 1.4 + 0.6,
      alpha: rand() * 0.5 + 0.3,
      phase: rand() * Math.PI * 2,
    })
  }
  return { base, twinkles }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: Background,
  width: number,
  height: number,
  timeMs: number,
) {
  ctx.drawImage(bg.base, 0, 0, width, height)
  for (const s of bg.twinkles) {
    const a = s.alpha * (0.7 + 0.3 * Math.sin(timeMs * 0.0015 + s.phase))
    ctx.fillStyle = `rgba(238, 236, 255, ${a})`
    ctx.fillRect(s.x, s.y, s.size, s.size)
  }
}
