import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { reducedMotion, scrollState } from './scrollState'
import { NOISE } from './three/noise'


const surfaceVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

// Granulation: several octaves of noise give boiling cells of different sizes.
// Limb darkening: the edge of a real star looks darker because we see
// cooler, higher layers there. mu = cos(angle to the viewer).
const surfaceFragment = /* glsl */ `
uniform float uTime;
uniform float uDim;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
${NOISE}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){ v += a * snoise(p); p *= 2.07; a *= 0.5; }
  return v;
}
void main(){
  vec3 p = normalize(vPos);
  float t = uTime * 0.04;
  vec3 warp = vec3(fbm(p * 1.5 + t), fbm(p * 1.5 - t + 7.1), fbm(p * 1.5 + 3.3));
  // Granulation cells, plus a ridged network of bright plasma filaments
  // (1 - |noise| peaks along thin lines).
  float cells = fbm(p * 14.0 + warp * 0.7 + t * 2.0);
  float ridge = 1.0 - abs(snoise(p * 5.0 + warp * 1.4 + t * 1.5));
  ridge = pow(ridge, 7.0) + 0.6 * pow(1.0 - abs(snoise(p * 11.0 + warp + t * 2.5)), 9.0);
  float spots = smoothstep(0.6, 0.9, fbm(p * 1.3 - t * 0.3 + 11.0));
  float heat = clamp(0.42 + cells * 0.5 + ridge * 0.7 - spots * 0.45, 0.0, 1.2);

  vec3 ember = vec3(0.55, 0.13, 0.01);
  vec3 orange = vec3(1.00, 0.42, 0.04);
  vec3 gold  = vec3(1.00, 0.70, 0.16);
  vec3 white = vec3(1.00, 0.95, 0.72);
  vec3 col = mix(ember, orange, smoothstep(0.15, 0.55, heat));
  col = mix(col, gold, smoothstep(0.55, 0.85, heat));
  col = mix(col, white, smoothstep(0.85, 1.15, heat));

  // Limb darkening: the edge shows cooler, higher layers of the star.
  float mu = clamp(dot(vNormal, vView), 0.0, 1.0);
  float limb = 0.45 + 0.55 * pow(mu, 0.5);
  col *= limb;
  col += vec3(1.0, 0.45, 0.06) * pow(1.0 - mu, 3.0) * 0.6;
  gl_FragColor = vec4(col * 1.05 * uDim, 1.0);
}
`

const coronaVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
void main(){
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

// A larger shell drawn from the inside: bright where it hugs the disc,
// fading to nothing at its rim, with slow noise so the glow flickers.
const coronaFragment = /* glsl */ `
uniform float uTime;
uniform float uDim;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
${NOISE}
void main(){
  float mu = abs(dot(vNormal, vView));
  float glow = pow(mu, 3.0);
  float flicker = 0.75 + 0.25 * snoise(normalize(vPos) * 3.0 + uTime * 0.08);
  vec3 col = mix(vec3(1.0, 0.38, 0.05), vec3(1.0, 0.78, 0.40), glow);
  gl_FragColor = vec4(col * glow * flicker * 1.5 * uDim, 1.0);
}
`

// Prominences and flares: a camera-facing plane through the Sun's centre.
// The disc itself hides the middle; outside the limb, noise in polar
// coordinates rises outward over time as flame-like plumes and loops.
const PLANE = 1.4 * 2 * 2.2
const flareVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const flareFragment = /* glsl */ `
uniform float uTime;
uniform float uDim;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 q = (vUv - 0.5) * ${PLANE.toFixed(3)};
  float r = length(q);
  float d = r - 1.4;              // height above the limb
  if (d < -0.02) discard;
  float a = atan(q.y, q.x);
  float t = uTime * 0.05;
  // High angular frequency and low radial frequency: thin plumes that
  // stretch outward from the limb rather than round puffs.
  vec3 c = vec3(cos(a) * 4.5, sin(a) * 4.5, 0.0);
  float n = snoise(c + vec3(0.0, 0.0, d * 1.1 - t * 4.0)) * 0.6
          + snoise(c * 2.1 + vec3(5.0, 1.0, d * 2.0 - t * 6.0)) * 0.3
          + snoise(c * 4.3 + vec3(9.0, 3.0, d * 3.5 - t * 9.0)) * 0.15;
  float plumes = pow(max(n, 0.0) * 1.9, 4.0) * exp(-d * 3.2);
  float rim = exp(-max(d, 0.0) * 9.0) * 0.9;           // bright chromosphere ring
  float haze = exp(-max(d, 0.0) * 3.0) * 0.05;
  float k = plumes + rim + haze;
  vec3 col = mix(vec3(1.0, 0.32, 0.03), vec3(1.0, 0.80, 0.35), clamp(plumes + rim * 0.6, 0.0, 1.0));
  gl_FragColor = vec4(col * k * 1.3 * uDim, 1.0);
}
`

export default function Sun() {
  const group = useRef<THREE.Group>(null)

  const surface = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uDim: { value: 1 } },
        vertexShader: surfaceVertex,
        fragmentShader: surfaceFragment,
        toneMapped: false,
      }),
    [],
  )

  const corona = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uDim: { value: 1 } },
        vertexShader: coronaVertex,
        fragmentShader: coronaFragment,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  const flares = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uDim: { value: 1 } },
        vertexShader: flareVertex,
        fragmentShader: flareFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    surface.uniforms.uTime.value = t
    corona.uniforms.uTime.value = t
    flares.uniforms.uTime.value = t
    const g = group.current
    if (!g) return
    if (!reducedMotion) g.rotation.y += delta * 0.03
    // Hero: the Sun drifts from the right of the screen toward the centre.
    // System reveal: it settles at the origin of the orbital plane and
    // shrinks so the planets' orbits have room around it.
    const k = scrollState.hero
    const sys = Math.min(scrollState.system / 0.4, 1)
    const settle = sys * sys * (3 - 2 * sys)
    // Acts II and III: the Sun exits to the right and dims so the
    // diagrams sit on clean dark space, then returns for the system.
    const ex = scrollState.explain
    const exit = ex * ex * (3 - 2 * ex)
    // Finale: the star recedes as the wordmark arrives.
    const f = Math.min(Math.max((scrollState.finale - 0.7) / 0.25, 0), 1)
    const dim = (1 - exit) * (1 - 0.6 * f * f * (3 - 2 * f))
    surface.uniforms.uDim.value = dim
    corona.uniforms.uDim.value = dim
    flares.uniforms.uDim.value = dim
    g.visible = dim > 0.01
    g.position.x = THREE.MathUtils.lerp(1.7, 1.15, k) * (1 - settle) + exit * 3.2
    g.position.y = THREE.MathUtils.lerp(-0.1, 0.4, k) * (1 - settle)
    const s = THREE.MathUtils.lerp(1.0, 0.55, k) * THREE.MathUtils.lerp(1, 0.55, settle)
    g.scale.setScalar(s)
  })

  useEffect(
    () => () => {
      surface.dispose()
      corona.dispose()
      flares.dispose()
    },
    [surface, corona, flares],
  )

  return (
    <group ref={group}>
      <mesh material={surface}>
        <sphereGeometry args={[1.4, 128, 128]} />
      </mesh>
      <mesh material={corona} scale={1.3}>
        <sphereGeometry args={[1.4, 64, 64]} />
      </mesh>
      <Billboard>
        <mesh material={flares}>
          <planeGeometry args={[PLANE, PLANE]} />
        </mesh>
      </Billboard>
    </group>
  )
}
