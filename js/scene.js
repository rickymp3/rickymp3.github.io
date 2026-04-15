/* ═══════════════════════════════════════════════════════════
   CO3 ONE — Gateway Scene
   Three.js r128 + GLSL post-processing
   Camera state machine driven by app.js
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
  vertexShader:`attribute float aSize;uniform float uTime;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1);vA=(.6+.4*sin(uTime*1.5+position.x*.1+position.y*.2))*.7;gl_PointSize=aSize*(80./-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);float g=exp(-d*6.);vec3 c=mix(vec3(1,.9,.8),vec3(.8,.85,1),smoothstep(0,.5,d));gl_FragColor=vec4(c,g*vA);}`
});
scene.add(new THREE.Points(sGeo,sMat));

// ── Nebula ──
const nGeo=new THREE.PlaneGeometry(200,200);
const nMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{uTime:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv-.5;float d=length(p);float g=exp(-d*2.5)*.15;vec3 c=mix(vec3(.4,.15,.02),vec3(.08,.03,.01),d*2.);gl_FragColor=vec4(c,g*(.8+.2*sin(uTime*.05+d*3.)));}`
});
const neb=new THREE.Mesh(nGeo,nMat);neb.position.z=-80;scene.add(neb);
const neb2=neb.clone();neb2.material=nMat.clone();
neb2.material.fragmentShader=`uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv-vec2(.55,.45);float d=length(p);float g=exp(-d*3.)*.08;vec3 c=mix(vec3(.1,.05,.2),vec3(.02,.01,.05),d*2.);gl_FragColor=vec4(c,g);}`;
neb2.position.set(20,10,-100);neb2.scale.set(1.5,1.5,1);scene.add(neb2);

// ── Gateway ──
const gw=new THREE.Group();scene.add(gw);
const SEG=isMobile?64:128;

// Main ring — HIGH segment count to eliminate aliasing
const mTGeo=new THREE.TorusGeometry(8,.12,64,SEG);
const mTMat=new THREE.MeshStandardMaterial({color:O,emissive:O,emissiveIntensity:.6,metalness:.8,roughness:.3});
gw.add(new THREE.Mesh(mTGeo,mTMat));

// Inner glow
const iGGeo=new THREE.TorusGeometry(8,.5,32,SEG);
gw.add(new THREE.Mesh(iGGeo,new THREE.MeshBasicMaterial({color:O,transparent:true,opacity:.08,side:THREE.DoubleSide})));

// Concentric rings
[9.5,11,13,15.5].forEach((r,i)=>{
  const g=new THREE.TorusGeometry(r,[.06,.04,.03,.02][i],32,SEG);
  gw.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:O,transparent:true,opacity:[.7,.5,.3,.15][i]})));
});

// Radial rays
for(let i=0;i<24;i++){
  const a=(i/24)*Math.PI*2,iR=8.3,oR=15.8;
  const pts=[new THREE.Vector3(Math.cos(a)*iR,Math.sin(a)*iR,0),new THREE.Vector3(Math.cos(a)*oR,Math.sin(a)*oR,0)];
  gw.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:O,transparent:true,opacity:.1})));
}

// Structural cross-members (4 symmetrical)
for(let q=0;q<4;q++){
  const a=(q/4)*Math.PI*2+Math.PI/8,pg=new THREE.Group();
  const sGeo2=new THREE.BoxGeometry(.15,4.5,.08);
  const sMat2=new THREE.MeshStandardMaterial({color:O,emissive:O,emissiveIntensity:.3,metalness:.9,roughness:.2});
  const s1=new THREE.Mesh(sGeo2,sMat2);s1.position.y=10.2;pg.add(s1);
  const cG=new THREE.ConeGeometry(.3,.6,3);
  const cM=new THREE.MeshBasicMaterial({color:O,transparent:true,opacity:.5});
  const c1=new THREE.Mesh(cG,cM);c1.position.y=8.3;c1.rotation.z=Math.PI;pg.add(c1);
  const s2=s1.clone();s2.position.y=-10.2;pg.add(s2);
  const c2=c1.clone();c2.position.y=-8.3;c2.rotation.z=0;pg.add(c2);
  pg.rotation.z=a;gw.add(pg);
}

// Portal interior shader
const pMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,
  uniforms:{uTime:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){vec2 p=vUv-.5;float d=length(p);float a=atan(p.y,p.x);float sw=sin(a*6.+d*20.-uTime*.8)*.5+.5;float rn=sin(d*40.-uTime*1.2)*.5+.5;float pt=sw*.4+rn*.6;float edge=smoothstep(.5,.42,d);float eG=smoothstep(.42,.5,d)*smoothstep(.52,.5,d)*3.;float ctr=smoothstep(.3,0.,d);vec3 c=vec3(1,.404,0);float al=pt*edge*.06+eG*.3+ctr*.02;al*=.8+.2*sin(uTime*.3);gl_FragColor=vec4(c*(.5+pt*.5),al);}`
});
const portal=new THREE.Mesh(new THREE.CircleGeometry(7.8,64),pMat);portal.position.z=.01;gw.add(portal);

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
  vertexShader:`attribute float aPhase,aSpeed,aRadius;uniform float uTime;varying float vA;void main(){vec3 pos=position;pos.z=mod(pos.z+uTime*aSpeed*3.+aPhase*20.,60.)-30.;float a2=atan(position.y,position.x)+uTime*.1*aSpeed;pos.x=cos(a2)*aRadius;pos.y=sin(a2)*aRadius;float pp=exp(-pos.z*pos.z*.005);pos.x*=1.-pp*.3;pos.y*=1.-pp*.3;vec4 mv=modelViewMatrix*vec4(pos,1);float dist=-mv.z;vA=(.15+pp*.5)*smoothstep(60.,5.,dist);gl_PointSize=max(1.,(1.+pp*2.5)*(20./max(dist,1.)));gl_Position=projectionMatrix*mv;}`,
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
//  CAMERA STATE MACHINE — Exported to window for app.js
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

// ── Render loop ──
const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(),.05);
  const t = clock.getElapsedTime();

  // Update uniforms
  sMat.uniforms.uTime.value=t;
  nMat.uniforms.uTime.value=t;
  pMat.uniforms.uTime.value=t;
  pMat2.uniforms.uTime.value=t;
  postMat.uniforms.uTime.value=t;

  // Gateway rotation
  gw.rotation.z += dt*.015;

  // Fill light pulse
  fL.intensity = .8+.3*Math.sin(t*.4);

  // Camera — lerp toward target + orbit
  const lerpSpeed = transitioning ? 1.8 : 3.0;
  currentPos.lerp(targetPos, dt*lerpSpeed);
  currentLook.lerp(targetLook, dt*lerpSpeed);

  // Orbital drift
  const s = states[currentState];
  if(s.orbit){
    orbitAngle += dt * s.orbitS;
    const ox = Math.sin(orbitAngle) * s.orbitR;
    const oy = Math.cos(orbitAngle*.7) * s.orbitH;
    const oz = Math.sin(orbitAngle*.3) * (s.orbitR*.5);
    camera.position.set(currentPos.x+ox, currentPos.y+oy, currentPos.z+oz);
  } else {
    camera.position.copy(currentPos);
  }

  // Look with breathing
  const bx = Math.sin(t*.15)*.3;
  const by = Math.cos(t*.1)*.2;
  camera.lookAt(currentLook.x+bx, currentLook.y+by, currentLook.z);

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
