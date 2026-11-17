import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Sun from './Sun'
import { scrollState } from './scrollState'

gsap.registerPlugin(ScrollTrigger)

// The 3D scene sits fixed behind the page; the HTML sections scroll over it.
function Scene() {
  return (
    <Canvas
      className="story-canvas"
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#020308']} />
      <Stars radius={120} depth={60} count={6000} factor={3.2} saturation={0.15} fade speed={0.4} />
      <Sun />
      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}

export default function StoryApp() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Smooth scrolling, driven by GSAP's clock so ScrollTrigger stays in sync.
    const lenis = new Lenis({ lerp: 0.08 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // Feed hero scroll progress to the 3D scene.
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          scrollState.hero = self.progress
        },
      })

      // Title lines rise in on load.
      gsap.from('.hero-line', { y: 40, opacity: 0, duration: 1.4, ease: 'power3.out', stagger: 0.15, delay: 0.2 })

      // Each text beat fades up as it scrolls into view and out as it leaves.
      gsap.utils.toArray<HTMLElement>('.beat').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 45%', scrub: true },
          },
        )
        gsap.to(el, {
          opacity: 0,
          y: -40,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'bottom 35%', end: 'bottom 5%', scrub: true },
        })
      })
    })

    return () => {
      ctx.revert()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Scene />
      <main className="story">
        <section className="hero" ref={heroRef}>
          <div className="hero-copy">
            <p className="eyebrow hero-line">A gravity simulator, built from first principles</p>
            <h1 className="hero-title hero-line">ORBITAL</h1>
            <p className="hero-sub hero-line">
              Watching the Netflix series 3 Body Problem fascinated me.
            </p>
          </div>
          <div className="scroll-cue hero-line" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        <section className="chapter">
          <div className="beat">
            <p className="beat-text">
              Three bodies moving under each other's gravity can look simple to the eye.
            </p>
          </div>
          <div className="beat">
            <p className="beat-text">Through analysis it becomes far more unpredictable.</p>
          </div>
          <div className="beat">
            <p className="beat-text dim">Next chapter: the law.</p>
          </div>
        </section>

        <footer className="story-foot">
          <a className="cta" href="/">Open the simulator</a>
        </footer>
      </main>
    </>
  )
}
