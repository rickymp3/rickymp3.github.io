/* ═══════════════════════════════════════════════════════════════════════
   CO3 ONE v6 — "THE VOID"
   AAA scene: logo billboard, circular particles, color lerp, glacial motion
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ── Config ──
const M = window.innerWidth < 768;
const ORANGE = new THREE.Color(0xff6700);
const GOLD   = new THREE.Color(0xC4A265);
const accent  = new THREE.Color().copy(ORANGE);
const aTgt    = new THREE.Color().copy(ORANGE);
const MIJI_TINT = new THREE.Vector3(0.96, 0.96, 0.97);
let tintStr = 0, tintTgt = 0;
const colored = []; // [{mat, type:'basic'|'standard'}]

// ── Renderer ──
const R = new THREE.WebGLRenderer({ antialias: !M, powerPreference: 'high-performance' });
R.setSize(window.innerWidth, window.innerHeight);
R.setPixelRatio(Math.min(window.devicePixelRatio, M ? 1.5 : 2));
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 0.85;
document.getElementById('scene-container').appendChild(R.domElement);

const S = new THREE.Scene();
S.background = new THREE.Color(0x08080e);
const cam = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);

// ── Post-processing ──
const pr = Math.min(window.devicePixelRatio, M ? 1.5 : 2);
const rt = new THREE.WebGLRenderTarget(window.innerWidth * pr, window.innerHeight * pr);
const pSc = new THREE.Scene(), pCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postU = { tDiffuse:{value:null}, uTime:{value:0}, uRes:{value:new THREE.Vector2(window.innerWidth, window.innerHeight)} };
const postMat = new THREE.ShaderMaterial({ uniforms: postU,
  vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position,1);}',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 v;
    void main() {
      vec2 u = v;
      // 1. CRT barrel distortion — 2%
      vec2 c = u - 0.5; u += c * dot(c,c) * 0.02;
      // 2. Chromatic aberration — distance-scaled
      float ca = 0.001 * length(u - 0.5);
      vec3 col = vec3(
        texture2D(tDiffuse, u + vec2(ca, 0.0)).r,
        texture2D(tDiffuse, u).g,
        texture2D(tDiffuse, u - vec2(ca, 0.0)).b
      );
      // 3. Bloom pass 1 — tight, catches bright orange
      vec3 b1 = vec3(0.0); float s1 = 3.0 / uRes.x;
      for (float i=-2.;i<=2.;i++) for (float j=-2.;j<=2.;j++) {
        vec3 s = texture2D(tDiffuse, u + vec2(i,j)*s1).rgb;
        b1 += s * smoothstep(0.15, 0.7, dot(s, vec3(0.2126,0.7152,0.0722)));
      }
      col += b1 / 25.0 * 0.55;
      // 4. Bloom pass 2 — wide atmospheric haze
      vec3 b2 = vec3(0.0); float s2 = 8.0 / uRes.x;
      for (float i=-2.;i<=2.;i++) for (float j=-2.;j<=2.;j++) {
        vec3 s = texture2D(tDiffuse, u + vec2(i,j)*s2).rgb;
        b2 += s * smoothstep(0.05, 0.35, dot(s, vec3(0.2126,0.7152,0.0722)));
      }
      col += b2 / 25.0 * 0.22;
      // 5. Warm color grade
      col *= vec3(1.02, 0.99, 0.96);
      // 6. Breathing exposure — imperceptible
      col *= 1.0 + 0.02 * sin(uTime * 0.08);
      gl_FragColor = vec4(col, 1.0);
    }`
});
pSc.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), postMat));

// ═══════════════════════════════════════════════════════════
//  STARS — spherical, warm twinkle, circular points
// ═══════════════════════════════════════════════════════════
const STAR_N = M ? 1500 : 4000;
const starG = new THREE.BufferGeometry();
const starP = new Float32Array(STAR_N*3), starSz = new Float32Array(STAR_N);
for (let i=0; i<STAR_N; i++) {
  const th = Math.random()*6.2832, ph = Math.acos(2*Math.random()-1);
  const r = 100 + Math.random()*150;
  starP[i*3]   = r*Math.sin(ph)*Math.cos(th);
  starP[i*3+1] = r*Math.sin(ph)*Math.sin(th);
  starP[i*3+2] = r*Math.cos(ph);
  starSz[i] = 0.5 + Math.random()*2.0;
}
starG.setAttribute('position', new THREE.BufferAttribute(starP,3));
starG.setAttribute('aSize', new THREE.BufferAttribute(starSz,1));
const starU = { uTime:{value:0} };
const starMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, uniforms:starU,
  vertexShader: `
    attribute float aSize; uniform float uTime; varying float vA; varying float vCol;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vA = (0.6 + 0.4 * sin(uTime*1.5 + position.x*0.1 + position.y*0.2)) * 0.7;
      vCol = fract(position.x * 0.01 + position.z * 0.007);
      gl_PointSize = aSize * (80.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying float vA; varying float vCol;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float g = exp(-d * 6.0);
      vec3 warm = vec3(1.0, 0.92, 0.82);
      vec3 cool = vec3(0.82, 0.88, 1.0);
      vec3 col = mix(warm, cool, vCol);
      gl_FragColor = vec4(col, g * vA);
    }`
});
S.add(new THREE.Points(starG, starMat));

// ═══════════════════════════════════════════════════════════
//  NEBULA — 2 shader planes, radial glow, barely there
// ═══════════════════════════════════════════════════════════
const nebU = { uTime:{value:0} };
const nebMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, side:THREE.DoubleSide, uniforms:nebU,
  vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader: `
    uniform float uTime; varying vec2 v;
    void main() {
      vec2 p = v - 0.5; float d = length(p);
      float g = exp(-d * 2.5) * 0.15;
      vec3 c = mix(vec3(0.4, 0.15, 0.02), vec3(0.08, 0.03, 0.01), d * 2.0);
      gl_FragColor = vec4(c, g * (0.8 + 0.2 * sin(uTime * 0.05 + d * 3.0)));
    }`
});
const neb1 = new THREE.Mesh(new THREE.PlaneGeometry(200,200), nebMat);
neb1.position.z = -80; S.add(neb1);

const neb2Mat = nebMat.clone();
neb2Mat.fragmentShader = `
  uniform float uTime; varying vec2 v;
  void main() {
    vec2 p = v - vec2(0.55, 0.45); float d = length(p);
    vec3 c = mix(vec3(0.1,0.05,0.2), vec3(0.02,0.01,0.05), d*2.0);
    gl_FragColor = vec4(c, exp(-d*3.0) * 0.08);
  }`;
const neb2 = new THREE.Mesh(new THREE.PlaneGeometry(200,200), neb2Mat);
neb2.position.set(20,10,-100); neb2.scale.set(1.5,1.5,1); S.add(neb2);

// ═══════════════════════════════════════════════════════════
//  FOG LAYERS — 3 planes, noise-based, organic, subliminal
// ═══════════════════════════════════════════════════════════
function makeFogLayer(z, speed, density) {
  const u = { uTime:{value:0}, uSpeed:{value:speed}, uDensity:{value:density} };
  const mat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, side:THREE.DoubleSide, uniforms:u,
    vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
    fragmentShader: `
      uniform float uTime, uSpeed, uDensity; varying vec2 v;
      void main() {
        vec2 p = v * 4.0;
        float n = sin(p.x*1.2 + uTime*uSpeed) * cos(p.y*0.9 - uTime*uSpeed*0.7)
                + sin(p.x*2.5 - uTime*uSpeed*1.3) * cos(p.y*1.8 + uTime*uSpeed*0.5) * 0.5;
        n = n * 0.5 + 0.5;
        float edge = smoothstep(0.0, 0.2, v.x) * smoothstep(1.0, 0.8, v.x)
                   * smoothstep(0.0, 0.2, v.y) * smoothstep(1.0, 0.8, v.y);
        gl_FragColor = vec4(vec3(0.06, 0.06, 0.10), n * edge * uDensity);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), mat);
  mesh.position.z = z;
  mesh.userData = { fogUniforms: u };
  S.add(mesh);
  return mesh;
}
const fog1 = makeFogLayer(-5, 0.025, 0.05);
const fog2 = makeFogLayer(5, 0.035, 0.04);
const fog3 = makeFogLayer(15, 0.02, 0.035);
const fogLayers = [fog1, fog2, fog3];

// ═══════════════════════════════════════════════════════════
//  LOGO — Billboard sprite, ShaderMaterial with tint system
//  Normal blending, ~30% opacity, wireframe visible
// ═══════════════════════════════════════════════════════════
const logoU = {
  uMap: { value: null },
  uOpacity: { value: 0.0 },
  uTint: { value: new THREE.Vector3(0.96, 0.96, 0.97) },
  uTintStrength: { value: 0.0 },
  uTime: { value: 0.0 }
};
const logoMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  // NORMAL blending — preserves gray wireframe
  blending: THREE.NormalBlending,
  uniforms: logoU,
  vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader: `
    uniform sampler2D uMap;
    uniform float uOpacity, uTintStrength, uTime;
    uniform vec3 uTint;
    varying vec2 v;
    void main() {
      vec4 tex = texture2D(uMap, v);
      if (tex.a < 0.01) discard;

      vec3 col = tex.rgb;

      // Detect saturated pixels (orange Co³ text + outer ring)
      float r = col.r, g = col.g, b = col.b;
      float maxC = max(r, max(g, b));
      float minC = min(r, min(g, b));
      float sat = maxC > 0.0 ? (maxC - minC) / maxC : 0.0;

      // Tint only saturated pixels, leave gray wireframe untouched
      float tintMask = smoothstep(0.2, 0.5, sat);
      vec3 tinted = mix(col, uTint * maxC, tintMask * uTintStrength);

      // Subtle pulse — barely there
      float pulse = 0.28 + 0.03 * sin(uTime * 0.1);
      float finalAlpha = tex.a * pulse * uOpacity;

      gl_FragColor = vec4(tinted, finalAlpha);
    }`
});
const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), logoMat);
S.add(logoMesh);

new THREE.TextureLoader().load('img/co3-mark-circle.png', function(tex) {
  tex.encoding = THREE.sRGBEncoding;
  logoU.uMap.value = tex;
  logoU.uOpacity.value = 1.0;
  logoMat.needsUpdate = true;
});

// ═══════════════════════════════════════════════════════════
//  PARTICLE FIELD A — Ambient drift (dust in zero gravity)
// ═══════════════════════════════════════════════════════════
const PA_N = M ? 600 : 1500;
const paG = new THREE.BufferGeometry();
const paP = new Float32Array(PA_N*3), paD = new Float32Array(PA_N*3), paSz = new Float32Array(PA_N);
for (let i=0; i<PA_N; i++) {
  paP[i*3]   = (Math.random()-0.5)*80;
  paP[i*3+1] = (Math.random()-0.5)*50;
  paP[i*3+2] = (Math.random()-0.5)*80;
  // Random drift vector — 0.01-0.03 magnitude
  const spd = 0.01 + Math.random()*0.02;
  const dth = Math.random()*6.2832, dph = Math.acos(2*Math.random()-1);
  paD[i*3]   = Math.sin(dph)*Math.cos(dth)*spd;
  paD[i*3+1] = Math.sin(dph)*Math.sin(dth)*spd;
  paD[i*3+2] = Math.cos(dph)*spd;
  paSz[i] = 1.0 + Math.random()*1.5;
}
paG.setAttribute('position', new THREE.BufferAttribute(paP,3));
paG.setAttribute('aDrift', new THREE.BufferAttribute(paD,3));
paG.setAttribute('aSize', new THREE.BufferAttribute(paSz,1));
const paU = { uTime:{value:0}, uAccent:{value:new THREE.Vector3(1,0.404,0)} };
const paMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:paU,
  vertexShader: `
    attribute vec3 aDrift; attribute float aSize;
    uniform float uTime; varying float vA;
    void main() {
      vec3 pos = position + aDrift * uTime;
      // Wrap around bounds
      pos = mod(pos + 40.0, 80.0) - 40.0;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      float dist = -mv.z;
      vA = smoothstep(70.0, 5.0, dist) * (0.08 + 0.12 * (1.0 - aSize/2.5));
      gl_PointSize = max(1.0, aSize * (20.0 / max(dist, 1.0)));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uAccent; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, d) * vA;
      gl_FragColor = vec4(uAccent, alpha);
    }`
});
S.add(new THREE.Points(paG, paMat));

// ═══════════════════════════════════════════════════════════
//  PARTICLE FIELD B — Gravitational (fireflies near lantern)
// ═══════════════════════════════════════════════════════════
const PB_N = M ? 120 : 300;
const pbG = new THREE.BufferGeometry();
const pbP = new Float32Array(PB_N*3), pbOrb = new Float32Array(PB_N*4); // angle, radius, speed, phase
for (let i=0; i<PB_N; i++) {
  const a = Math.random()*6.2832;
  const r = 5 + Math.random()*10;
  pbP[i*3]   = Math.cos(a)*r;
  pbP[i*3+1] = (Math.random()-0.5)*8;
  pbP[i*3+2] = Math.sin(a)*r;
  pbOrb[i*4]   = a;
  pbOrb[i*4+1] = r;
  pbOrb[i*4+2] = 0.02 + Math.random()*0.04; // 100-300s full orbit
  pbOrb[i*4+3] = Math.random()*6.2832;
}
pbG.setAttribute('position', new THREE.BufferAttribute(pbP,3));
pbG.setAttribute('aOrb', new THREE.BufferAttribute(pbOrb,4));
const pbU = { uTime:{value:0}, uAccent:{value:new THREE.Vector3(1,0.404,0)} };
const pbMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:pbU,
  vertexShader: `
    attribute vec4 aOrb; uniform float uTime; varying float vA;
    void main() {
      float angle = aOrb.x + uTime * aOrb.z;
      float radius = aOrb.y;
      float phase = aOrb.w;
      vec3 pos;
      pos.x = cos(angle) * radius;
      pos.y = position.y + sin(uTime * 0.05 + phase) * 2.0;
      pos.z = sin(angle) * radius;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      float dist = -mv.z;
      vA = smoothstep(50.0, 3.0, dist) * (0.3 + 0.2 * sin(uTime*0.3 + phase));
      gl_PointSize = max(1.0, (1.5 + 1.5 * exp(-dist*0.05)) * (20.0 / max(dist, 1.0)));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uAccent; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float glow = exp(-d * 4.0);
      gl_FragColor = vec4(uAccent, glow * vA);
    }`
});
S.add(new THREE.Points(pbG, pbMat));

// ═══════════════════════════════════════════════════════════
//  DUST — static depth markers, barely visible
// ═══════════════════════════════════════════════════════════
const DUST_N = M ? 300 : 800;
const dustG = new THREE.BufferGeometry();
const dustP = new Float32Array(DUST_N*3);
for (let i=0; i<DUST_N; i++) {
  dustP[i*3]   = (Math.random()-0.5)*100;
  dustP[i*3+1] = (Math.random()-0.5)*60;
  dustP[i*3+2] = (Math.random()-0.5)*100;
}
dustG.setAttribute('position', new THREE.BufferAttribute(dustP,3));
const dustMat = new THREE.PointsMaterial({
  color: 0xff6700, size: 0.05, transparent:true, opacity: 0.12,
  blending: THREE.AdditiveBlending, depthWrite: false
});
S.add(new THREE.Points(dustG, dustMat));
colored.push({ mat: dustMat, type: 'basic' });

// ═══════════════════════════════════════════════════════════
//  LIGHTING
// ═══════════════════════════════════════════════════════════
S.add(new THREE.AmbientLight(0x0a0810, 0.3));
const keyL = new THREE.DirectionalLight(0xffa060, 0.4);
keyL.position.set(0, 0, 20); S.add(keyL);
const rimL = new THREE.DirectionalLight(0xff6700, 0.15);
rimL.position.set(0, 10, -15); S.add(rimL);
colored.push({ mat: rimL, type: 'light' });
const fillL = new THREE.PointLight(0xff6700, 0.6, 20);
fillL.position.set(0, 0, 0); S.add(fillL);
colored.push({ mat: fillL, type: 'light' });

// ═══════════════════════════════════════════════════════════
//  CAMERA STATE MACHINE
// ═══════════════════════════════════════════════════════════
const states = {
  home:     { pos:[0, 0, 25],    look:[0, 0, 0],    oR:3,   oH:2,   oS:0.025 },
  product:  { pos:[15, 3, 18],   look:[1, -0.5, 0],  oR:1.5, oH:0.8, oS:0.015 },
  research: { pos:[0, 1.5, 14],  look:[0, 0, -2],    oR:1,   oH:0.6, oS:0.018 },
  contact:  { pos:[-13, 6, 22],  look:[-1, 0.5, 0],  oR:1.5, oH:1,   oS:0.012 }
};
let curSt = 'home';
let tPos = new THREE.Vector3(0,0,25), tLook = new THREE.Vector3(0,0,0);
let cPos = new THREE.Vector3(0,0,25), cLook = new THREE.Vector3(0,0,0);
let oAngle = 0, trans = false;
cam.position.copy(cPos); cam.lookAt(cLook);

window.co3Scene = {
  setState(n) {
    if (!states[n] || n === curSt) return;
    curSt = n;
    const s = states[n];
    tPos.set(s.pos[0], s.pos[1], s.pos[2]);
    tLook.set(s.look[0], s.look[1], s.look[2]);
    trans = true;
    setTimeout(() => { trans = false; }, 2200);
    // Color
    aTgt.copy(n === 'product' ? GOLD : ORANGE);
    tintTgt = n === 'product' ? 1.0 : 0.0;
  },
  getState() { return curSt; }
};

// ═══════════════════════════════════════════════════════════
//  ANIMATION LOOP — glacial, deliberate, heavy
// ═══════════════════════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  // ── Uniforms ──
  starU.uTime.value = t;
  nebU.uTime.value = t;
  paU.uTime.value = t;
  pbU.uTime.value = t;
  logoU.uTime.value = t;
  postU.uTime.value = t;
  fogLayers.forEach(f => { f.userData.fogUniforms.uTime.value = t; });

  // ── Color lerp — all materials ──
  accent.lerp(aTgt, dt * 1.5);
  tintStr += (tintTgt - tintStr) * dt * 1.5;

  const av = new THREE.Vector3(accent.r, accent.g, accent.b);
  paU.uAccent.value.copy(av);
  pbU.uAccent.value.copy(av);
  logoU.uTintStrength.value = tintStr;

  colored.forEach(({ mat, type }) => {
    if (type === 'light') mat.color.copy(accent);
    else mat.color.copy(accent);
  });
  dustMat.color.copy(accent);

  // ── Logo — billboard (always faces camera, always upright) ──
  logoMesh.quaternion.copy(cam.quaternion);

  // ── Fill light breathe — very slow ──
  fillL.intensity = 0.5 + 0.1 * Math.sin(t * 0.2);

  // ── Camera — viscous steadicam ──
  const ls = trans ? 1.5 : 2.5;
  cPos.lerp(tPos, dt * ls);
  cLook.lerp(tLook, dt * ls);

  const s = states[curSt];
  oAngle += dt * s.oS;

  cam.position.set(
    cPos.x + Math.sin(oAngle) * s.oR + Math.sin(t * 0.1) * 0.15,
    cPos.y + Math.cos(oAngle * 0.7) * s.oH + Math.cos(t * 0.07) * 0.1,
    cPos.z + Math.sin(oAngle * 0.3) * (s.oR * 0.4)
  );
  cam.lookAt(
    cLook.x + Math.sin(t * 0.1) * 0.15,
    cLook.y + Math.cos(t * 0.07) * 0.1,
    cLook.z
  );

  // ── Render pipeline ──
  R.setRenderTarget(rt);
  R.render(S, cam);
  R.setRenderTarget(null);
  postU.tDiffuse.value = rt.texture;
  R.render(pSc, pCam);
}
animate();

// ── Resize ──
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  cam.aspect = w/h; cam.updateProjectionMatrix();
  R.setSize(w, h);
  const p = Math.min(window.devicePixelRatio, M ? 1.5 : 2);
  rt.setSize(w*p, h*p);
  postU.uRes.value.set(w, h);
});

})();
