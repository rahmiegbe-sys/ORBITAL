import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scrollState'

// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT licence).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

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
  float cells = fbm(p * 16.0 + warp * 0.6 + t * 2.0) * 0.7 + fbm(p * 4.0 + warp * 0.8 - t) * 0.5;
  float spots = smoothstep(0.55, 0.85, fbm(p * 1.4 - t * 0.3 + 11.0));
  float heat = clamp(0.55 + cells * 0.7 - spots * 0.5, 0.0, 1.0);

  vec3 deep  = vec3(0.35, 0.05, 0.01);
  vec3 orange = vec3(0.95, 0.30, 0.04);
  vec3 gold  = vec3(1.00, 0.62, 0.20);
  vec3 white = vec3(1.00, 0.90, 0.70);
  vec3 col = mix(deep, orange, smoothstep(0.0, 0.45, heat));
  col = mix(col, gold, smoothstep(0.45, 0.75, heat));
  col = mix(col, white, smoothstep(0.75, 1.0, heat));

  float mu = clamp(dot(vNormal, vView), 0.0, 1.0);
  float limb = 0.25 + 0.75 * pow(mu, 0.6);
  col *= limb;
  col += vec3(1.0, 0.30, 0.04) * pow(1.0 - mu, 4.0) * 0.35;
  gl_FragColor = vec4(col * 1.05, 1.0);
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
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;
${NOISE}
void main(){
  float mu = abs(dot(vNormal, vView));
  float glow = pow(mu, 4.0);
  float flicker = 0.75 + 0.25 * snoise(normalize(vPos) * 3.0 + uTime * 0.08);
  vec3 col = mix(vec3(1.0, 0.30, 0.05), vec3(1.0, 0.70, 0.35), glow);
  gl_FragColor = vec4(col * glow * flicker * 0.9, 1.0);
}
`

export default function Sun() {
  const group = useRef<THREE.Group>(null)

  const surface = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: surfaceVertex,
        fragmentShader: surfaceFragment,
        toneMapped: false,
      }),
    [],
  )

  const corona = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
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

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    surface.uniforms.uTime.value = t
    corona.uniforms.uTime.value = t
    const g = group.current
    if (!g) return
    g.rotation.y += delta * 0.03
    // Scroll through the hero: the Sun drifts from the right of the screen
    // toward the centre and the camera pulls back a little.
    const k = scrollState.hero
    g.position.x = THREE.MathUtils.lerp(1.7, 0.0, k)
    g.position.y = THREE.MathUtils.lerp(-0.1, 0.4, k)
    const s = THREE.MathUtils.lerp(1.0, 0.55, k)
    g.scale.setScalar(s)
  })

  return (
    <group ref={group}>
      <mesh material={surface}>
        <sphereGeometry args={[1.4, 128, 128]} />
      </mesh>
      <mesh material={corona} scale={1.3}>
        <sphereGeometry args={[1.4, 64, 64]} />
      </mesh>
    </group>
  )
}
