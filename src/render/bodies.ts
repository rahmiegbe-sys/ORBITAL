// "3D" bodies drawn with radial gradients — no images needed.

// A star: hot white core fading to orange at the edge (limb darkening),
// wrapped in a soft corona, with four faint diffraction rays.
export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number) {
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 5)
  halo.addColorStop(0, 'rgba(255, 190, 120, 0.30)')
  halo.addColorStop(0.35, 'rgba(255, 160, 90, 0.08)')
  halo.addColorStop(1, 'rgba(255, 140, 80, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, r * 5, 0, Math.PI * 2)
  ctx.fill()

  const disc = ctx.createRadialGradient(x - r * 0.15, y - r * 0.15, 0, x, y, r)
  disc.addColorStop(0, '#fffef8')
  disc.addColorStop(0.4, '#ffeec8')
  disc.addColorStop(0.85, '#f2a85a')
  disc.addColorStop(1, '#c7642a')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 230, 190, 0.16)'
  ctx.lineWidth = 1
  for (let k = 0; k < 4; k++) {
    const a = spin + (k * Math.PI) / 2
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3)
    ctx.lineTo(x + Math.cos(a) * r * 2.6, y + Math.sin(a) * r * 2.6)
    ctx.stroke()
  }
}

// A planet lit by a star at (lx, ly): bright on the facing side, dark on the far
// side (the terminator), plus a thin atmosphere rim where light grazes it.
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  lx: number,
  ly: number,
) {
  const d = Math.hypot(lx - x, ly - y) || 1
  const ux = (lx - x) / d
  const uy = (ly - y) / d

  const body = ctx.createRadialGradient(x + ux * r * 0.45, y + uy * r * 0.45, r * 0.05, x, y, r * 1.05)
  body.addColorStop(0, '#a9c6ee')
  body.addColorStop(0.5, '#2b4f86')
  body.addColorStop(1, '#03060e')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  const facing = Math.atan2(uy, ux)
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, r + 1, facing - 1.2, facing + 1.2)
  ctx.stroke()
}
