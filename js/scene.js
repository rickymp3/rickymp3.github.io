/* ═══════════════════════════════════════════════════════════
   CO3 ONE — Gateway Scene v3
   Dynamic rings, no radial lines/struts
   ═══════════════════════════════════════════════════════════ */

(function(){
const O = 0xff6700;
const isMobile = window.innerWidth < 768;

const renderer = new THREE.WebGLRenderer({ antialias:!isMobile, powerPreference:'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile?1.5:2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.getElementById('scene-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08080e);
scene.fog = new THREE.FogExp2(0x08080e, 0.008);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 500);

// Post-processing
const pr = Math.min(window.devicePixelRatio, isMobile?1.5:2);
const rt = new THREE.WebGLRenderTarget(window.innerWidth*pr, window.innerHeight*pr);
const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postMat = new THREE.ShaderMaterial({
  uniforms:{tDiffuse:{value:null},uTime:{value:0},uRes:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
  fragmentShader:`
    uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uRes;varying vec2 vUv;
    void main(){
      vec2 uv=vUv;
      vec2 c=uv-.5;uv+=c*dot(c,c)*.02;
      float ca=.0012*length(uv-.5);
      float r=texture2D(tDiffuse,uv+vec2(ca,0)).r;
      float g=texture2D(tDiffuse,uv).g;
      float b=texture2D(tDiffuse,uv-vec2(ca,0)).b;
      vec3 col=vec3(r,g,b);
      vec3 bl=vec3(0);float bs=3./uRes.x;
      for(float i=-2.;i<=2.;i++)for(float j=-2.;j<=2.;j++){
        vec3 s=texture2D(tDiffuse,uv+vec2(i,j)*bs).rgb;
        bl+=s*smoothstep(.12,.6,dot(s,vec3(.2126,.7152,.0722)));
      }col+=bl/25.*.7;
      vec3 bl2=vec3(0);float bs2=7./uRes.x;
      for(float i=-2.;i<=2.;i++)for(float j=-2.;j<=2.;j++){
        vec3 s=texture2D(tDiffuse,uv+vec2(i,j)*bs2).rgb;
        bl2+=s*smoothstep(.06,.4,dot(s,vec3(.2126,.7152,.0722)));
      }col+=bl2/25.*.35;
      col*=vec3(1.02,.99,.96);
      col*=1.+.03*sin(uTime*.1);
      gl_FragColor=vec4(col,1);
    }`
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));

// ── Stars ──
const SC=isMobile?1500:4000;
const sGeo=new THREE.BufferGeometry(),sP=new Float32Array(SC*3),sS=new Float32Array(SC);
for(let i=0;i<SC;i++){const t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1),r=100+Math.random()*150;sP[i*3]=r*Math.sin(p)*Math.cos(t);sP[i*3+1]=r*Math.sin(p)*Math.sin(t);sP[i*3+2]=r*Math.cos(p);sS[i]=.5+Math.random()*2}
sGeo.setAttribute('position',new THREE.BufferAttribute(sP,3));
sGeo.setAttribute('aSize',new THREE.BufferAttribute(sS,1));
const sMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{uTime:{value:0}},
  vertexShader:'attribute float aSize;uniform float uTime;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1);vA=(.6+.4*sin(uTime*1.5+position.x*.1+position.y*.2))*.7;gl_PointSize=aSize*(80./-mv.z);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float g=exp(-d*6.);vec3 c=mix(vec3(1,.9,.8),vec3(.8,.85,1),smoothstep(0,.5,d));gl_FragColor=vec4(c,g*vA);}'
});
scene.add(new THREE.Points(sGeo,sMat));

// ── Nebula ──
const nGeo=new THREE.PlaneGeometry(200,200);
const nMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{uTime:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader:'uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv-.5;float d=length(p);float g=exp(-d*2.5)*.15;vec3 c=mix(vec3(.4,.15,.02),vec3(.08,.03,.01),d*2.);gl_FragColor=vec4(c,g*(.8+.2*sin(uTime*.05+d*3.)));}'
});
const neb=new THREE.Mesh(nGeo,nMat);neb.position.z=-80;scene.add(neb);
const neb2=neb.clone();neb2.material=nMat.clone();
neb2.material.fragmentShader='uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv-vec2(.55,.45);float d=length(p);float g=exp(-d*3.)*.08;vec3 c=mix(vec3(.1,.05,.2),vec3(.02,.01,.05),d*2.);gl_FragColor=vec4(c,g);}';
neb2.position.set(20,10,-100);neb2.scale.set(1.5,1.5,1);scene.add(neb2);

// ═══════════════════════════════════════════════════════════
//  GATEWAY — Dynamic concentric rings only. No spokes/struts.
// ═══════════════════════════════════════════════════════════

const gw = new THREE.Group();
scene.add(gw);
const SEG = isMobile ? 64 : 128;

// Ring config: radius, tube thickness, base opacity, rotation speed, rotation axis, phase
const ringDefs = [
  // Primary ring (the logo ring)
  { r:8,   tube:.10, op:.9,  rotSpeed:0,      axis:'z', phase:0, breathAmp:0,    breathSpeed:0,   zOsc:0 },
  // Inner glow
  { r:8,   tube:.5,  op:.06, rotSpeed:.003,   axis:'z', phase:0, breathAmp:0,    breathSpeed:0,   zOsc:0, glow:true },
  // Scanning rings (counter-rotating, different speeds)
  { r:9.2, tube:.03, op:.5,  rotSpeed:.015,   axis:'z', phase:0, breathAmp:.15,  breathSpeed:.4,  zOsc:.08 },
  { r:10.5,tube:.04, op:.4,  rotSpeed:-.008,  axis:'z', phase:1, breathAmp:.2,   breathSpeed:.3,  zOsc:.12 },
  { r:12,  tube:.03, op:.35, rotSpeed:.012,   axis:'z', phase:2, breathAmp:.1,   breathSpeed:.5,  zOsc:.06 },
  { r:13.5,tube:.025,op:.25, rotSpeed:-.018,  axis:'z', phase:3, breathAmp:.25,  breathSpeed:.25, zOsc:.15 },
  { r:15,  tube:.02, op:.2,  rotSpeed:.006,   axis:'z', phase:4, breathAmp:.15,  breathSpeed:.35, zOsc:.1 },
  { r:16.5,tube:.02, op:.12, rotSpeed:-.01,   axis:'z', phase:5, breathAmp:.3,   breathSpeed:.2,  zOsc:.18 },
  // Tilted accent rings (slight off-axis for depth)
  { r:11,  tube:.02, op:.15, rotSpeed:.02,    axis:'x', phase:0, breathAmp:.1,   breathSpeed:.3,  zOsc:0, tiltX:.08 },
  { r:14,  tube:.015,op:.1,  rotSpeed:-.015,  axis:'x', phase:2, breathAmp:.15,  breathSpeed:.25, zOsc:0, tiltX:-.06 },
];

const rings = [];

ringDefs.forEach((def, idx) => {
  const geo = new THREE.TorusGeometry(def.r, def.tube, def.glow ? 16 : 48, SEG);
  const mat = new THREE.MeshBasicMaterial({
    color: O,
    transparent: true,
    opacity: def.op,
    side: def.glow ? THREE.DoubleSide : THREE.FrontSide
  });

  // For the primary ring, use emissive material
  let mesh;
  if (idx === 0) {
    const eMat = new THREE.MeshStandardMaterial({
      color: O, emissive: O, emissiveIntensity: .6,
      metalness: .8, roughness: .3, transparent: true, opacity: def.op
    });
    mesh = new THREE.Mesh(geo, eMat);
  } else {
    mesh = new THREE.Mesh(geo, mat);
  }

  if (def.tiltX) mesh.rotation.x = def.tiltX;

  mesh.userData = {
    baseOp: def.op,
    rotSpeed: def.rotSpeed,
    axis: def.axis,
    phase: def.phase,
    breathAmp: def.breathAmp,
    breathSpeed: def.breathSpeed,
    zOsc: def.zOsc,
    baseRadius: def.r
  };

  gw.add(mesh);
  rings.push(mesh);
});

// ── Scanning arc — a bright partial ring that orbits ──
const scanGeo = new THREE.TorusGeometry(8.5, .06, 16, SEG, Math.PI * 0.4); // partial arc
const scanMat = new THREE.MeshBasicMaterial({
  color: O, transparent: true, opacity: .7
});
const scanArc = new THREE.Mesh(scanGeo, scanMat);
gw.add(scanArc);

// Second scanner on outer ring
const scan2Geo = new THREE.TorusGeometry(13, .04, 16, SEG, Math.PI * 0.25);
const scan2Mat = new THREE.MeshBasicMaterial({
  color: O, transparent: true, opacity: .4
});
const scanArc2 = new THREE.Mesh(scan2Geo, scan2Mat);
gw.add(scanArc2);

// ── Portal interior ──
const pMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,
  uniforms:{uTime:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv-.5;float d=length(p);float a=atan(p.y,p.x);float sw=sin(a*6.+d*20.-uTime*.8)*.5+.5;float rn=sin(d*40.-uTime*1.2)*.5+.5;float pt=sw*.4+rn*.6;float edge=smoothstep(.5,.42,d);float eG=smoothstep(.42,.5,d)*smoothstep(.52,.5,d)*3.;float ctr=smoothstep(.3,0.,d);vec3 c=vec3(1,.404,0);float al=pt*edge*.06+eG*.3+ctr*.02;al*=.8+.2*sin(uTime*.3);gl_FragColor=vec4(c*(.5+pt*.5),al);}`
});
gw.add(new THREE.Mesh(new THREE.CircleGeometry(7.8,64),pMat));

// ── Particle streams ──
const PC=isMobile?800:2500;
const pGeo=new THREE.BufferGeometry(),pP=new Float32Array(PC*3),pPh=new Float32Array(PC),pSp=new Float32Array(PC),pRa=new Float32Array(PC);
for(let i=0;i<PC;i++){const a=Math.random()*Math.PI*2,r=Math.random()*7;pP[i*3]=Math.cos(a)*r;pP[i*3+1]=Math.sin(a)*r;pP[i*3+2]=(Math.random()-.5)*60;pPh[i]=Math.random()*Math.PI*2;pSp[i]=.5+Math.random()*1.5;pRa[i]=r}
pGeo.setAttribute('position',new THREE.BufferAttribute(pP,3));
pGeo.setAttribute('aPhase',new THREE.BufferAttribute(pPh,1));
pGeo.setAttribute('aSpeed',new THREE.BufferAttribute(pSp,1));
pGeo.setAttribute('aRadius',new THREE.BufferAttribute(pRa,1));
const pMat2=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0}},
  vertexShader:'attribute float aPhase,aSpeed,aRadius;uniform float uTime;varying float vA;void main(){vec3 pos=position;pos.z=mod(pos.z+uTime*aSpeed*3.+aPhase*20.,60.)-30.;float a2=atan(position.y,position.x)+uTime*.1*aSpeed;pos.x=cos(a2)*aRadius;pos.y=sin(a2)*aRadius;float pp=exp(-pos.z*pos.z*.005);pos.x*=1.-pp*.3;pos.y*=1.-pp*.3;vec4 mv=modelViewMatrix*vec4(pos,1);float dist=-mv.z;vA=(.15+pp*.5)*smoothstep(60.,5.,dist);gl_PointSize=max(1.,(1.+pp*2.5)*(20./max(dist,1.)));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1,.404,0,exp(-d*5.)*vA);}'
});
scene.add(new THREE.Points(pGeo,pMat2));

// Dust
const DC=isMobile?400:1200;const dGeo=new THREE.BufferGeometry(),dP2=new Float32Array(DC*3);
for(let i=0;i<DC;i++){dP2[i*3]=(Math.random()-.5)*100;dP2[i*3+1]=(Math.random()-.5)*60;dP2[i*3+2]=(Math.random()-.5)*100}
dGeo.setAttribute('position',new THREE.BufferAttribute(dP2,3));
scene.add(new THREE.Points(dGeo,new THREE.PointsMaterial({color:0xffa060,size:.06,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false})));

// Hexagonal accents
const HC=isMobile?6:14;
for(let i=0;i<HC;i++){
  const a=Math.random()*Math.PI*2,r=22+Math.random()*12;
  const h=new THREE.Mesh(new THREE.CircleGeometry(.3+Math.random()*.5,6),new THREE.MeshBasicMaterial({color:O,transparent:true,opacity:.03+Math.random()*.05,wireframe:true}));
  h.position.set(Math.cos(a)*r,(Math.random()-.5)*8,Math.sin(a)*r);
  h.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0);
  scene.add(h);
}

// ── Lighting ──
scene.add(new THREE.AmbientLight(0x0a0810,.4));
const kL=new THREE.DirectionalLight(0xffa060,.6);kL.position.set(0,0,20);scene.add(kL);
const rL=new THREE.DirectionalLight(O,.3);rL.position.set(0,10,-15);scene.add(rL);
const fL=new THREE.PointLight(O,1,30);fL.position.set(0,0,0);scene.add(fL);

// ═══════════════════════════════════════════════════════════
//  CAMERA STATE MACHINE
// ═══════════════════════════════════════════════════════════

const states = {
  home:     { pos:[0, 0, 30],     look:[0, 0, 0],    orbit:true,  orbitR:5, orbitH:3, orbitS:.04 },
  product:  { pos:[18, 4, 22],    look:[2, -1, 0],   orbit:true,  orbitR:2, orbitH:1, orbitS:.02 },
  research: { pos:[0, 2, 14],     look:[0, 0, -3],   orbit:true,  orbitR:1.5,orbitH:.8,orbitS:.025},
  contact:  { pos:[-16, 8, 26],   look:[-2, 1, 0],   orbit:true,  orbitR:2, orbitH:1.5,orbitS:.02 }
};

let currentState = 'home';
let targetPos = new THREE.Vector3(0,0,30);
let targetLook = new THREE.Vector3(0,0,0);
let currentPos = new THREE.Vector3(0,0,30);
let currentLook = new THREE.Vector3(0,0,0);
let orbitAngle = 0;
let transitioning = false;

camera.position.copy(currentPos);
camera.lookAt(currentLook);

window.co3Scene = {
  setState: function(name){
    if(!states[name] || name===currentState) return;
    currentState = name;
    const s = states[name];
    targetPos.set(s.pos[0],s.pos[1],s.pos[2]);
    targetLook.set(s.look[0],s.look[1],s.look[2]);
    transitioning = true;
    setTimeout(()=>{ transitioning=false; }, 2200);
  },
  getState: function(){ return currentState; }
};

// ═══════════════════════════════════════════════════════════
//  ANIMATION LOOP — Dynamic ring behaviors
// ═══════════════════════════════════════════════════════════

const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(),.05);
  const t = clock.getElapsedTime();

  // Uniforms
  sMat.uniforms.uTime.value=t;
  nMat.uniforms.uTime.value=t;
  pMat.uniforms.uTime.value=t;
  pMat2.uniforms.uTime.value=t;
  postMat.uniforms.uTime.value=t;

  // ── Dynamic ring animation ──
  rings.forEach((ring, idx) => {
    const u = ring.userData;

    // Independent rotation per ring
    if (u.axis === 'z') ring.rotation.z += u.rotSpeed;
    else if (u.axis === 'x') ring.rotation.x += u.rotSpeed;

    // Opacity breathing (wave from center outward)
    if (u.breathAmp > 0) {
      const wave = Math.sin(t * u.breathSpeed + u.phase * 1.5) * u.breathAmp;
      ring.material.opacity = Math.max(0.02, u.baseOp * (1 + wave));
    }

    // Z-axis oscillation (rings drifting forward/back)
    if (u.zOsc > 0) {
      ring.position.z = Math.sin(t * 0.3 + u.phase * 2) * u.zOsc;
    }
  });

  // ── Scanning arcs — continuous rotation ──
  scanArc.rotation.z = t * 0.8;
  scanMat.opacity = 0.4 + 0.3 * Math.sin(t * 1.2);

  scanArc2.rotation.z = -t * 0.5;
  scan2Mat.opacity = 0.2 + 0.2 * Math.sin(t * 0.8 + 1);

  // Gateway base rotation (very slow)
  gw.rotation.z += dt * .01;

  // Fill light pulse
  fL.intensity = .8 + .3 * Math.sin(t * .4);

  // Camera lerp
  const lerpSpeed = transitioning ? 1.8 : 3.0;
  currentPos.lerp(targetPos, dt*lerpSpeed);
  currentLook.lerp(targetLook, dt*lerpSpeed);

  const s = states[currentState];
  if(s.orbit){
    orbitAngle += dt * s.orbitS;
    camera.position.set(
      currentPos.x + Math.sin(orbitAngle)*s.orbitR,
      currentPos.y + Math.cos(orbitAngle*.7)*s.orbitH,
      currentPos.z + Math.sin(orbitAngle*.3)*(s.orbitR*.5)
    );
  } else {
    camera.position.copy(currentPos);
  }

  camera.lookAt(
    currentLook.x + Math.sin(t*.15)*.3,
    currentLook.y + Math.cos(t*.1)*.2,
    currentLook.z
  );

  // Render pipeline
  renderer.setRenderTarget(rt);
  renderer.render(scene,camera);
  renderer.setRenderTarget(null);
  postMat.uniforms.tDiffuse.value=rt.texture;
  renderer.render(postScene,postCamera);
}
animate();

window.addEventListener('resize',()=>{
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h);
  const p2=Math.min(window.devicePixelRatio,isMobile?1.5:2);
  rt.setSize(w*p2,h*p2);
  postMat.uniforms.uRes.value.set(w,h);
});

})();
