import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'katex/dist/katex.min.css'
import Scene from './three/Scene'
import LawSection from './sections/LawSection'
import MechanismSection from './sections/MechanismSection'
import SystemSection from './sections/SystemSection'
import IdentitySection from './sections/IdentitySection'
import { DUR, EASE, STAGGER, revealLines } from './motion'
import { reducedMotion, scrollState } from './scrollState'

gsap.registerPlugin(ScrollTrigger)

export default function StoryApp() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Smooth scrolling on GSAP's clock so ScrollTrigger stays in sync.
    // Lenis turns its own smoothing off when reduced motion is requested.
    const lenis = new Lenis({ lerp: 0.085 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => (scrollState.hero = self.progress),
      })

      // The scrim darkens the 3D world while the HTML explains (Acts II and III)
      // and lifts again for the system reveal.
      gsap.timeline({
        scrollTrigger: {
          trigger: '.law',
          start: 'top 90%',
          end: 'top 10%',
          scrub: true,
          onUpdate: (self) => (scrollState.explain = self.progress),
        },
      }).to('.scrim', { opacity: 0.85, ease: EASE.linear })
      gsap.timeline({
        scrollTrigger: {
          trigger: '.system',
          start: 'top 55%',
          end: 'top 5%',
          scrub: true,
          onUpdate: (self) => (scrollState.explain = 1 - self.progress),
        },
      }).to('.scrim', { opacity: 0, ease: EASE.linear })

      if (!reducedMotion) {
        gsap.from('.hero-line', { yPercent: 40, opacity: 0, duration: DUR.slow, ease: EASE.expo, stagger: STAGGER.lines * 1.6, delay: 0.25 })
        gsap.utils.toArray<HTMLElement>('.prologue .t-statement').forEach((p) => revealLines(p))
        // Parallax: each body drifts at its own rate and turns slightly as
        // the prologue scrolls past, so they read as separate depths.
        const drift: [string, number, number][] = [
          ['.body-giant', -260, -8],
          ['.body-rocky', -120, 12],
          ['.body-terra', -380, -20],
        ]
        drift.forEach(([sel, y, rot]) =>
          gsap.fromTo(
            sel,
            { y: 0, rotate: 0 },
            { y, rotate: rot, ease: EASE.linear, scrollTrigger: { trigger: '.prologue', start: 'top bottom', end: 'bottom top', scrub: true } },
          ),
        )
      }
    })

    // Fonts change line breaks; measure again once they have loaded.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    // Images (the prologue planets) can also shift layout once decoded.
    const onLoad = () => ScrollTrigger.refresh()
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })

    return () => {
      window.removeEventListener('load', onLoad)
      ctx.revert()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Scene />
      <div className="scrim" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <main className="story">
        <section className="hero" ref={heroRef}>
          <div className="hero-copy">
            <p className="t-label hero-line">Act I · A gravity simulator, built from first principles</p>
            <h1 className="hero-title hero-line">ORBITAL</h1>
            <p className="hero-sub t-body hero-line">Watching the Netflix series 3 Body Problem fascinated me.</p>
          </div>
          <div className="scroll-cue hero-line" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        <section className="prologue">
          {/* Decorative illustration: these three bodies are images, not simulated. */}
          <div className="bodies" aria-hidden="true">
            <img className="body body-giant" src="/story/planet-giant.webp" alt="" width="328" height="328" />
            <img className="body body-rocky" src="/story/planet-rocky.webp" alt="" width="308" height="308" />
            <img className="body body-terra" src="/story/planet-terra.webp" alt="" width="200" height="200" />
          </div>
          <p className="t-statement">Three bodies moving under each other's gravity can look simple to the eye.</p>
          <p className="t-statement">Through analysis it becomes far more unpredictable.</p>
          <p className="illustration-note t-annotation">Illustration · the simulated systems come later</p>
        </section>

        <LawSection />
        <MechanismSection />
        <SystemSection />
        <IdentitySection />
      </main>
    </>
  )
}
