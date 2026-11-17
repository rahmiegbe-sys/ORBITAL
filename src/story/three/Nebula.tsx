import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { NOISE } from './noise'

// Deep-space backdrop: a sky sphere coloured by direction only, so it never
// pixelates at any screen size. A tilted galactic band of blue haze with dark
// dust lanes, plus a dense field of faint background stars drawn in the shader.
const vertex = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // always at the far plane
}
`

const fragment = /* glsl */ `
varying vec3 vDir;
${NOISE}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 6; i++){ v += a * snoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main(){
  vec3 d = normalize(vDir);
  vec3 bandNormal = normalize(vec3(0.25, 1.0, 0.35));
  float lat = dot(d, bandNormal);
  float band = exp(-pow(lat / 0.30, 2.0));
  float core = exp(-pow(lat / 0.10, 2.0));

  float haze = fbm(d * 2.4) * 0.5 + 0.5;
  float detail = fbm(d * 7.0 + 3.1) * 0.5 + 0.5;
  float dust = smoothstep(0.48, 0.78, fbm(d * 4.2 + 11.0) * 0.5 + 0.5);

  vec3 deep = vec3(0.006, 0.010, 0.026);
  vec3 navy = vec3(0.030, 0.055, 0.120);
  vec3 blue = vec3(0.090, 0.160, 0.300);
  vec3 col = deep + navy * haze * 0.55;
  col += blue * band * haze * detail * 0.9;
  col += vec3(0.22, 0.28, 0.40) * core * detail * 0.35;
  col *= 1.0 - dust * band * 0.75;

  // Faint background stars: a fine grid of cells, a few lit per cell.
  vec3 cell = floor(d * 380.0);
  float h = hash(cell);
  float star = step(0.9965 - band * 0.003, h) * pow(hash(cell + 7.0), 3.0);
  col += vec3(0.75, 0.82, 1.0) * star * 0.9;

  // Colours above are picked in display (sRGB) terms; convert to linear
  // so the renderer's output conversion does not lift the darks to grey.
  gl_FragColor = vec4(pow(col * 1.25, vec3(2.2)), 1.0);
}
`

export default function Nebula() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[300, 64, 32]} />
    </mesh>
  )
}
