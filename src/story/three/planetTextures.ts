import * as THREE from 'three'

// Procedural planet surfaces, painted once on small canvases at start-up.
// Each texel is coloured from 3D noise sampled on the unit sphere, so the
// equirectangular maps have no seam and no pinching at the poles.

function hash(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return h - Math.floor(h)
}
const fade = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi)
  const c = (i: number, j: number, k: number) => hash(xi + i, yi + j, zi + k)
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), xf), x10 = lerp(c(0, 1, 0), c(1, 1, 0), xf)
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), xf), x11 = lerp(c(0, 1, 1), c(1, 1, 1), xf)
  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf) // 0..1
}

function fbm(x: number, y: number, z: number, octaves = 5) {
  let v = 0, a = 0.5, f = 1, norm = 0
  for (let i = 0; i < octaves; i++) {
    v += a * noise(x * f, y * f, z * f)
    norm += a
    a *= 0.5
    f *= 2.02
  }
  return v / norm
}

type RGB = [number, number, number]
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const smooth = (e0: number, e1: number, x: number) => fade(Math.min(Math.max((x - e0) / (e1 - e0), 0), 1))

function paint(w: number, h: number, shade: (x: number, y: number, z: number) => RGB) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  for (let j = 0; j < h; j++) {
    const phi = ((j + 0.5) / h) * Math.PI
    for (let i = 0; i < w; i++) {
      const theta = ((i + 0.5) / w) * Math.PI * 2
      const x = Math.sin(phi) * Math.cos(theta)
      const y = Math.cos(phi)
      const z = Math.sin(phi) * Math.sin(theta)
      const [r, g, b] = shade(x, y, z)
      const k = (j * w + i) * 4
      img.data[k] = r * 255
      img.data[k + 1] = g * 255
      img.data[k + 2] = b * 255
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Craters: fixed random points on the sphere; darker floors, bright rims.
function craterField(count: number, seed: number) {
  const out: { x: number; y: number; z: number; r: number }[] = []
  for (let i = 0; i < count; i++) {
    const u = hash(i, seed, 1) * 2 - 1
    const t = hash(i, seed, 2) * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    out.push({ x: s * Math.cos(t), y: u, z: s * Math.sin(t), r: 0.03 + Math.pow(hash(i, seed, 3), 3) * 0.16 })
  }
  return out
}
function craterShade(craters: ReturnType<typeof craterField>, x: number, y: number, z: number) {
  let v = 0
  for (const c of craters) {
    const d = Math.acos(Math.min(1, x * c.x + y * c.y + z * c.z)) / c.r
    if (d < 1.25) v += d < 1 ? -0.35 * (1 - d * d) : 0.5 * (1.25 - d) * 4 * (d - 1)
  }
  return v
}

export function rockyTexture() {
  const craters = craterField(70, 3)
  return paint(512, 256, (x, y, z) => {
    const n = fbm(x * 3 + 5, y * 3, z * 3)
    const fine = fbm(x * 14, y * 14, z * 14, 3)
    const c = craterShade(craters, x, y, z)
    const v = Math.min(Math.max(n * 0.7 + fine * 0.3 + c * 0.35, 0), 1)
    return mix([0.16, 0.12, 0.1], [0.62, 0.5, 0.4], v)
  })
}

export function oceanTexture() {
  return paint(512, 256, (x, y, z) => {
    const land = fbm(x * 2.2 + 9, y * 2.2, z * 2.2)
    const clouds = fbm(x * 4 + 1, y * 6, z * 4 + 2, 4)
    let col: RGB = mix([0.02, 0.07, 0.2], [0.05, 0.22, 0.42], smooth(0.3, 0.52, land))
    if (land > 0.53) col = mix([0.32, 0.36, 0.2], [0.55, 0.45, 0.3], smooth(0.53, 0.7, land))
    const ice = smooth(0.82, 0.92, Math.abs(y))
    col = mix(col, [0.9, 0.93, 0.97], ice)
    return mix(col, [0.95, 0.96, 1], smooth(0.55, 0.75, clouds) * 0.85)
  })
}

export function terraTexture() {
  return paint(512, 256, (x, y, z) => {
    const n = fbm(x * 2.5 + 2, y * 2.5, z * 2.5)
    const ridges = 1 - Math.abs(fbm(x * 7, y * 7, z * 7, 4) * 2 - 1)
    let col = mix([0.32, 0.11, 0.05], [0.78, 0.38, 0.17], smooth(0.35, 0.65, n))
    col = mix(col, [0.2, 0.09, 0.06], smooth(0.55, 0.7, fbm(x * 1.6 + 7, y * 1.6, z * 1.6)) * 0.7)
    col = mix(col, [0.92, 0.62, 0.4], Math.pow(ridges, 6) * 0.5)
    return mix(col, [0.95, 0.9, 0.86], smooth(0.9, 0.97, Math.abs(y)))
  })
}

export function giantTexture() {
  const tones: RGB[] = [
    [0.93, 0.86, 0.74],
    [0.74, 0.55, 0.38],
    [0.96, 0.92, 0.84],
    [0.6, 0.4, 0.26],
    [0.86, 0.74, 0.58],
    [0.68, 0.5, 0.36],
  ]
  return paint(1024, 512, (x, y, z) => {
    // latitude bands, pushed sideways by turbulence so they swirl
    const turb = fbm(x * 3 + 4, y * 9, z * 3, 5) - 0.5
    const lat = y * 7.5 + turb * 1.6 + Math.sin(Math.atan2(z, x) * 3 + y * 20) * 0.05
    const f = (lat + 100) % tones.length
    const i = Math.floor(f)
    let col = mix(tones[i], tones[(i + 1) % tones.length], smooth(0.35, 0.65, f - i))
    col = mix(col, [1, 0.97, 0.9], Math.pow(fbm(x * 12, y * 30, z * 12, 3), 3) * 0.6)
    // one large oval storm
    const dx = Math.atan2(z, x) - 1.1
    const dy = (y + 0.35) * 3.2
    const storm = Math.exp(-(dx * dx + dy * dy) * 9)
    return mix(col, [0.78, 0.36, 0.2], storm * 0.75)
  })
}
