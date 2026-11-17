import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LiveSystem, PLANETS, G } from '../sim/liveSystem'
import { accelerations } from '../../physics/gravity'
import { liveStats, reducedMotion, scrollState } from '../scrollState'
import { giantTexture, oceanTexture, rockyTexture, terraTexture } from './planetTextures'

// World units per AU. The simulation is 2D (x, y); it is laid on the
// horizontal plane of the 3D scene as (x, 0, -y).
export const AU = 2.2

const TRAIL_POINTS = 600
const YEARS_PER_SECOND = reducedMotion ? 0.06 : 0.3

// Visual radii only. Real planets would be invisible at this scale.
// Surfaces are procedural and decorative; the motion is computed.
const LOOK = [
  { radius: 0.1, color: '#a89a90', make: rockyTexture, atmosphere: null },
  { radius: 0.14, color: '#6a9be3', make: oceanTexture, atmosphere: '#7fb4ff' },
  { radius: 0.11, color: '#d06a3f', make: terraTexture, atmosphere: '#ff9a6a' },
  { radius: 0.32, color: '#d9b48a', make: giantTexture, atmosphere: '#ffe2b8' },
]

// Thin glowing shell, brightest at the planet's edge (seen from the camera).
const atmosphereVertex = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }
`
const atmosphereFragment = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity;
varying vec3 vN; varying vec3 vV;
void main(){ float rim = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(uColor * rim * 1.4 * uOpacity, 1.0); }
`

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

export default function OrbitalSystem() {
  const sim = useMemo(() => new LiveSystem(), [])
  const planetRefs = useRef<(THREE.Mesh | null)[]>([])
  const group = useRef<THREE.Group>(null)

  // Each trail keeps the last TRAIL_POINTS samples, spaced so it covers
  // about 85% of that planet's own orbit (period T = 2π r^1.5 when G = M = 1).
  const trails = useMemo(
    () =>
      PLANETS.map((p) => {
        const period = (2 * Math.PI * Math.pow(p.r, 1.5)) / Math.sqrt(G)
        const positions = new Float32Array(TRAIL_POINTS * 3)
        const colors = new Float32Array(TRAIL_POINTS * 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setDrawRange(0, 0)
        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        return { spacing: (period * 0.85) / TRAIL_POINTS, since: 0, count: 0, positions, colors, geometry, material, line: new THREE.Line(geometry, material) }
      }),
    [],
  )

  const textures = useMemo(() => LOOK.map((l) => l.make()), [])
  const atmospheres = useMemo(
    () =>
      LOOK.map((l) =>
        l.atmosphere
          ? new THREE.ShaderMaterial({
              uniforms: { uColor: { value: new THREE.Color(l.atmosphere) }, uOpacity: { value: 0 } },
              vertexShader: atmosphereVertex,
              fragmentShader: atmosphereFragment,
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.BackSide,
            })
          : null,
      ),
    [],
  )

  // Faint reference rings at 1, 2 and 3 AU: a true scale bar for the system.
  const rings = useMemo(() => {
    const material = new THREE.LineBasicMaterial({ color: '#8d93c8', transparent: true, opacity: 0, depthWrite: false })
    const lines = [1, 2, 3].map((au) => {
      const pts: THREE.Vector3[] = []
      for (let k = 0; k <= 256; k++) {
        const a = (k / 256) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a) * au * AU, 0, Math.sin(a) * au * AU))
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material)
    })
    return { material, lines }
  }, [])

  const pushTrail = (i: number) => {
    const tr = trails[i]
    const b = sim.bodies[i + 1]
    // shift everything back by one point, newest at the end
    if (tr.count === TRAIL_POINTS) tr.positions.copyWithin(0, 3)
    else tr.count++
    const j = (tr.count - 1) * 3
    tr.positions[j] = b.pos.x * AU
    tr.positions[j + 1] = 0
    tr.positions[j + 2] = -b.pos.y * AU
  }

  const refreshTrail = (i: number) => {
    const tr = trails[i]
    const base = new THREE.Color(LOOK[i].color).lerp(new THREE.Color('#ffffff'), 0.5)
    for (let k = 0; k < tr.count; k++) {
      const f = Math.pow(k / Math.max(tr.count - 1, 1), 1.3) // fade towards the tail
      tr.colors[k * 3] = base.r * f
      tr.colors[k * 3 + 1] = base.g * f
      tr.colors[k * 3 + 2] = base.b * f
    }
    tr.geometry.setDrawRange(0, tr.count)
    tr.geometry.attributes.position.needsUpdate = true
    tr.geometry.attributes.color.needsUpdate = true
  }

  const stepSim = (simTime: number) => {
    sim.advance(simTime)
    trails.forEach((tr, i) => {
      tr.since += simTime
      while (tr.since >= tr.spacing) {
        tr.since -= tr.spacing
        pushTrail(i)
      }
    })
  }

  // Warm up: integrate long enough that every trail is full before the reveal.
  useEffect(() => {
    const outerPeriod = 2 * Math.PI * Math.pow(PLANETS[PLANETS.length - 1].r, 1.5)
    const chunk = 0.05
    for (let t = 0; t < outerPeriod; t += chunk) stepSim(chunk)
    trails.forEach((_, i) => refreshTrail(i))
    liveStats.bodies = sim.bodies.length
    liveStats.years = sim.t / (2 * Math.PI)
    liveStats.energyDrift = sim.energyDrift()
    return () => {
      trails.forEach((tr) => {
        tr.geometry.dispose()
        tr.material.dispose()
      })
      rings.lines.forEach((l) => l.geometry.dispose())
      rings.material.dispose()
      textures.forEach((t) => t.dispose())
      arrows.forEach((a) => a.dispose())
      atmospheres.forEach((a) => a?.dispose())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const frameCount = useRef(0)

  // Finale: one arrow per planet showing its real net acceleration, from
  // ORBITAL's own accelerations() on the live state. Direction is exact;
  // length is on a log scale so both near and far planets stay readable.
  const arrows = useMemo(
    () =>
      PLANETS.map(() => {
        const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xffd6a0, 0.2, 0.11)
        ;[a.line.material, a.cone.material].forEach((m) => {
          const mat = m as THREE.Material
          mat.transparent = true
          mat.opacity = 0
          mat.depthWrite = false
          mat.toneMapped = false
        })
        return a
      }),
    [],
  )
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const vis = smooth(0.08, 0.32, scrollState.system)
    const g = group.current
    if (!g) return
    g.visible = vis > 0.001
    if (!g.visible) return

    stepSim(YEARS_PER_SECOND * 2 * Math.PI * Math.min(delta, 1 / 30))
    trails.forEach((_, i) => refreshTrail(i))

    sim.bodies.slice(1).forEach((b, i) => {
      const m = planetRefs.current[i]
      if (!m) return
      m.position.set(b.pos.x * AU, 0, -b.pos.y * AU)
      m.rotation.y += delta * 0.4
      const mat = m.material as THREE.MeshStandardMaterial
      mat.opacity = vis
      const atmo = atmospheres[i]
      if (atmo) atmo.uniforms.uOpacity.value = vis
    })

    // In the finale the trails thin out and the scene settles.
    const settle = 1 - 0.55 * smooth(0.2, 0.9, scrollState.finale)
    trails.forEach((tr) => (tr.material.opacity = vis * settle))
    rings.material.opacity = vis * 0.13 * (1 - 0.5 * scrollState.finale)

    const show = smooth(0.05, 0.3, scrollState.finale) * (1 - smooth(0.62, 0.78, scrollState.finale))
    arrows.forEach((ar) => (ar.visible = show > 0.001))
    if (show > 0.001) {
      const acc = accelerations(sim.bodies, G)
      arrows.forEach((ar, i) => {
        const b = sim.bodies[i + 1]
        const a = acc[i + 1]
        const mag = Math.hypot(a.x, a.y)
        dir.set(a.x, 0, -a.y).normalize()
        // start at the planet's surface so the body never hides its own arrow
        ar.position.set(b.pos.x * AU, 0, -b.pos.y * AU).addScaledVector(dir, LOOK[i].radius * 1.15)
        ar.setDirection(dir)
        const len = (0.55 + 0.4 * Math.log10(mag * 10)) * AU * 0.85 * (0.3 + 0.7 * show)
        ar.setLength(Math.max(len, 0.3), 0.2, 0.11)
        ;(ar.line.material as THREE.Material).opacity = show * 0.9
        ;(ar.cone.material as THREE.Material).opacity = show
      })
    }

    if (++frameCount.current % 20 === 0) {
      liveStats.years = sim.t / (2 * Math.PI)
      liveStats.energyDrift = sim.energyDrift()
    }
  })

  return (
    <group ref={group} visible={false}>
      <pointLight position={[0, 0, 0]} intensity={4} decay={0} color="#ffe2c2" />
      {arrows.map((a, i) => (
        <primitive key={`arrow${i}`} object={a} />
      ))}
      {rings.lines.map((l, i) => (
        <primitive key={`ring${i}`} object={l} />
      ))}
      {trails.map((tr, i) => (
        <primitive key={`trail${i}`} object={tr.line} />
      ))}
      {LOOK.map((look, i) => (
        <mesh key={i} ref={(m) => void (planetRefs.current[i] = m)}>
          <sphereGeometry args={[look.radius, 64, 64]} />
          <meshStandardMaterial map={textures[i]} roughness={0.9} metalness={0} transparent opacity={0} />
          {atmospheres[i] && (
            <mesh material={atmospheres[i]!} scale={1.12}>
              <sphereGeometry args={[look.radius, 48, 48]} />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  )
}
