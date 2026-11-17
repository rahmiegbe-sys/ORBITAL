import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../scrollState'

// The camera never jumps: its position is a pure function of scroll.
// Act I to III: a fixed shot of the Sun.
// System reveal: dolly back, then crane up so the orbital plane opens out.
// Finale: keep pulling back and drift slowly around the star.
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)

const target = new THREE.Vector3()
const pos = new THREE.Vector3()

export default function CameraRig() {
  const { camera, size } = useThree()

  useFrame(() => {
    const s = scrollState.system
    const f = scrollState.finale
    const portrait = size.width < size.height
    const reach = portrait ? 1.55 : 1 // phones need more distance to fit the orbits

    const dolly = ease(clamp01(s / 0.4))
    const crane = ease(clamp01((s - 0.3) / 0.7))
    const pull = ease(f)

    const dist = THREE.MathUtils.lerp(6, 12.5, dolly) * THREE.MathUtils.lerp(1, reach, dolly) - pull * 2.5 * reach
    // Finale: rise towards a top-down view, where the force arrows read as a diagram.
    const height = THREE.MathUtils.lerp(0.15, 0.62, crane) + pull * 1.1 // elevation relative to distance
    const angle = crane * 0.55 + pull * 0.5

    pos.set(Math.sin(angle) * dist, height * dist, Math.cos(angle) * dist)
    camera.position.copy(pos)
    target.set(0, 0, 0)
    camera.lookAt(target)
  })

  return null
}
