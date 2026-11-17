// Scroll progress shared between the HTML (GSAP) and the 3D scene (useFrame).
// A plain mutable object: the render loop reads it every frame without React re-renders.
export const scrollState = {
  hero: 0, // 0 at the top of the page, 1 when the hero has scrolled away
}
