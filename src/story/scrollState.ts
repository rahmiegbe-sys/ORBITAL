// Shared state between the HTML layer (GSAP) and the 3D scene (useFrame).
// Plain mutable objects: the render loop reads them every frame without
// triggering React re-renders.
export const scrollState = {
  hero: 0, // 0 at the top, 1 once the hero has scrolled away
  explain: 0, // 0 to 1 entering Act II, back to 0 entering Act IV (Sun leaves frame)
  system: 0, // 0 to 1 through the system reveal (camera pull-back)
  finale: 0, // 0 to 1 through the identity ending (scene settles and darkens)
}

// Written by the live simulation, read by the HUD. Real values only.
export const liveStats = {
  years: 0,
  energyDrift: 0,
  bodies: 0,
}

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
