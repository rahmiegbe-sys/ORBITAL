import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import Sun from '../Sun'
import OrbitalSystem from './OrbitalSystem'
import CameraRig from './CameraRig'
import Nebula from './Nebula'

// One canvas for the whole page, fixed behind the HTML. Scenes change by
// moving the camera through a single world, so nothing ever resets.
export default function Scene() {
  // Start sharp; if the device cannot hold its frame rate, drop the
  // rendering resolution rather than the frame rate.
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.75))
  return (
    <Canvas
      className="story-canvas"
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 400 }}
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(1, d - 0.5))} flipflops={3} onFallback={() => setDpr(1)} />
      <color attach="background" args={['#020308']} />
      <ambientLight intensity={0.035} />
      <Nebula />
      <Stars radius={140} depth={70} count={5000} factor={3.4} saturation={0.35} fade speed={0.4} />
      <Sun />
      <OrbitalSystem />
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
