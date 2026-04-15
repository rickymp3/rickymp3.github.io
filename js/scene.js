/* ═══════════════════════════════════════════════════════════════════════
   CO3 ONE v7 — "THE CORRIDOR"
   Impossible architecture. 60s sci-fi. Kubrick meets Danielewski.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const M = window.innerWidth < 768;
const ORANGE = new THREE.Color(0xff6700);
const GOLD = new THREE.Color(0xC4A265);
const accent = new THREE.Color().copy(ORANGE);
const aTgt = new THREE.Color().copy(ORANGE);
const MIJI_TINT = new THREE.Vector3(0.96, 0.96, 0.97);
let tintStr = 0, tintTgt = 0;
const FOG_COL = new THREE.Vector3(0.031, 0.031, 0.055); // #08080e

// ── Renderer ──
const R = new THREE.WebGLRenderer({ antialias:!M, powerPreference:'high-performance' });
R.setSize(window.innerWidth, window.innerHeight);
R.setPixelRatio(Math.min(window.devicePixelRatio, M?1.5:2));
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 0.85;
document.getElementById('scene-container').appendChild(R.domElement);

const S = new THREE.Scene();
S.background = new THREE.Color(0x08080e);
const cam = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 300);

// ── Post-processing ──
const pr = Math.min(window.devicePixelRatio, M?1.5:2);
const rt = new THREE.WebGLRenderTarget(window.innerWidth*pr, window.innerHeight*pr);
const pSc = new THREE.Scene(), pCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postU = {tDiffuse:{value:null},uTime:{value:0},uRes:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)}};
const postMat = new THREE.ShaderMaterial({uniforms:postU,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position,1);}',
  fragmentShader:`
    uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uRes;varying vec2 v;
    void main(){
      vec2 u=v;vec2 c=u-.5;u+=c*dot(c,c)*.02;
      float ca=.001*length(u-.5);
      vec3 col=vec3(texture2D(tDiffuse,u+vec2(ca,0)).r,texture2D(tDiffuse,u).g,texture2D(tDiffuse,u-vec2(ca,0)).b);
      vec3 b1=vec3(0);float s1=3./uRes.x;
      for(float i=-2.;i<=2.;i++)for(float j=-2.;j<=2.;j++){vec3 s=texture2D(tDiffuse,u+vec2(i,j)*s1).rgb;b1+=s*smoothstep(.15,.7,dot(s,vec3(.2126,.7152,.0722)));}
      col+=b1/25.*.55;
      vec3 b2=vec3(0);float s2=8./uRes.x;
      for(float i=-2.;i<=2.;i++)for(float j=-2.;j<=2.;j++){vec3 s=texture2D(tDiffuse,u+vec2(i,j)*s2).rgb;b2+=s*smoothstep(.05,.35,dot(s,vec3(.2126,.7152,.0722)));}
      col+=b2/25.*.22;
      col*=vec3(1.02,.99,.96);col*=1.+.02*sin(uTime*.08);
      gl_FragColor=vec4(col,1);}`
});
pSc.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));

// ═══════════════════════════════════ SHARED SHADER CHUNKS ═══════════════════════════════════

const archVert = `
  varying vec3 vWP;
  void main(){
    vec4 wp=modelMatrix*vec4(position,1.0);
    vWP=wp.xyz;
    gl_Position=projectionMatrix*viewMatrix*wp;
  }`;

// Z-based fog function used by all architectural shaders
const fogChunk = `
  vec3 applyFog(vec3 col, float z){
    float f=smoothstep(-25.0,-65.0,z);
    vec3 fogNear=vec3(0.031,0.031,0.055);
    vec3 fogFar=vec3(0.025,0.025,0.045);
    vec3 fc=mix(fogNear,fogFar,f);
    return mix(col,fc,f);
  }`;

const hashChunk = `
  float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`;

// ═══════════════════════════════════ FLOOR ═══════════════════════════════════

const floorU = {uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const floorMat = new THREE.ShaderMaterial({uniforms:floorU,
  vertexShader:archVert,
  fragmentShader:`
    ${fogChunk}
    uniform float uTime;uniform vec3 uAccent;varying vec3 vWP;
    void main(){
      vec3 wp=vWP;
      float gs=2.0;float lw=0.015;
      float gZ=smoothstep(lw,0.,abs(fract(wp.z/gs)-.5)*gs);
      float gX=smoothstep(lw,0.,abs(fract(wp.x/gs)-.5)*gs);
      float grid=clamp(gZ+gX,0.,1.);
      vec3 col=vec3(0.018,0.018,0.032);
      col+=uAccent*grid*0.022;
      col=applyFog(col,wp.z);
      gl_FragColor=vec4(col,1);
    }`
});
const floorGeo = new THREE.PlaneGeometry(14,145);
floorGeo.rotateX(-Math.PI/2);
const floor = new THREE.Mesh(floorGeo,floorMat);
floor.position.set(0,0,-57.5);
S.add(floor);

// ═══════════════════════════════════ CEILING ═══════════════════════════════════

const ceilU = {uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const ceilMat = new THREE.ShaderMaterial({uniforms:ceilU,
  vertexShader:archVert,
  fragmentShader:`
    ${fogChunk}
    ${hashChunk}
    uniform float uTime;uniform vec3 uAccent;varying vec3 vWP;
    void main(){
      vec3 wp=vWP;
      float pW=4.0,pH=4.0,sw=0.025;
      float cZ=mod(-wp.z,pW);float cX=mod(wp.x+6.,pH);
      vec2 pid=vec2(floor(-wp.z/pW),floor((wp.x+6.)/pH));
      float sH=smoothstep(sw*2.,0.,cZ)+smoothstep(pW-sw*2.,pW,cZ);
      float sV=smoothstep(sw*2.,0.,cX)+smoothstep(pH-sw*2.,pH,cX);
      float seam=clamp(sH+sV,0.,1.);
      float isLit=step(.93,hash21(pid*vec2(73.1,157.3)));
      vec3 col=vec3(0.03,0.03,0.055);
      col+=uAccent*seam*0.04;
      col+=uAccent*isLit*0.025*(0.85+0.15*sin(uTime*0.06+pid.x*2.1));
      col=applyFog(col,wp.z);
      gl_FragColor=vec4(col,1);
    }`
});
const ceilGeo = new THREE.PlaneGeometry(14,145);
ceilGeo.rotateX(Math.PI/2);
const ceil = new THREE.Mesh(ceilGeo,ceilMat);
ceil.position.set(0,7.2,-57.5);
S.add(ceil);

// ═══════════════════════════════════ WALLS ═══════════════════════════════════

const wallFrag = `
  ${fogChunk}
  ${hashChunk}
  uniform float uTime;uniform vec3 uAccent;varying vec3 vWP;
  void main(){
    vec3 wp=vWP;
    float pW=4.0,pH=3.5,sw=0.025;
    float cZ=mod(-wp.z,pW);float cY=mod(wp.y,pH);
    vec2 pid=vec2(floor(-wp.z/pW),floor(wp.y/pH));
    float sH=smoothstep(sw*2.,0.,cZ)+smoothstep(pW-sw*2.,pW,cZ);
    float sV=smoothstep(sw*2.,0.,cY)+smoothstep(pH-sw*2.,pH,cY);
    float seam=clamp(sH+sV,0.,1.);
    float isOpen=step(.83,hash21(pid));
    vec3 panelCol=vec3(0.047,0.047,0.082);
    vec3 openCol=vec3(0.012,0.012,0.018);
    vec3 col=mix(panelCol,openCol,isOpen);
    float seamGlow=seam*(1.-isOpen);
    col+=uAccent*seamGlow*0.055;
    float pulse=1.+0.12*sin(uTime*0.08+pid.x*1.7+pid.y*0.9);
    col+=uAccent*seamGlow*0.018*pulse;
    col=applyFog(col,wp.z);
    gl_FragColor=vec4(col,1);
  }`;

// Left wall
const lwU={uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const lwMat=new THREE.ShaderMaterial({uniforms:lwU,vertexShader:archVert,fragmentShader:wallFrag});
const lwGeo=new THREE.PlaneGeometry(145,7.2);
lwGeo.rotateY(Math.PI/2);
const lw=new THREE.Mesh(lwGeo,lwMat);
lw.position.set(-6,3.6,-57.5);S.add(lw);

// Right wall
const rwU={uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const rwMat=new THREE.ShaderMaterial({uniforms:rwU,vertexShader:archVert,fragmentShader:wallFrag});
const rwGeo=new THREE.PlaneGeometry(145,7.2);
rwGeo.rotateY(-Math.PI/2);
const rw=new THREE.Mesh(rwGeo,rwMat);
rw.position.set(6,3.6,-57.5);S.add(rw);

// ═══════════════════════════════════ WRONG PANELS ═══════════════════════════════════
// House of Leaves tells — almost imperceptible geometric wrongness

// Left wall, z≈-12: panel rotated 1.5° on Y
const wpL=new THREE.Mesh(
  new THREE.PlaneGeometry(4,3.5),
  new THREE.MeshBasicMaterial({color:0x0c0c15})
);
wpL.rotation.y=Math.PI/2 + 0.026; // 1.5 degrees off
wpL.position.set(-5.95, 1.75, -12);
S.add(wpL);

// Right wall, z≈-20: panel recessed 0.15 units
const wpR=new THREE.Mesh(
  new THREE.PlaneGeometry(4,3.5),
  new THREE.MeshBasicMaterial({color:0x0a0a13})
);
wpR.rotation.y=-Math.PI/2;
wpR.position.set(6.15, 5.25, -20); // recessed into wall
S.add(wpR);

// ═══════════════════════════════════ LIGHT SHAFTS ═══════════════════════════════════

const shaftDefs=[
  {z:-10, x:0.8, rot:0.18, phase:0},
  {z:-28, x:-0.4, rot:-0.15, phase:2.1},
  {z:-48, x:0.5, rot:0.12, phase:4.3}
];
const shafts=[];

shaftDefs.forEach(d=>{
  const u={uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)},uPhase:{value:d.phase}};
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:u,
    vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
    fragmentShader:`
      uniform float uTime;uniform vec3 uAccent;uniform float uPhase;varying vec2 v;
      void main(){
        float hG=1.-abs(v.x-.5)*2.;hG=hG*hG*hG;
        float vG=smoothstep(0.,.08,v.y)*smoothstep(1.,.92,v.y);
        float i=hG*vG*(0.8+0.2*sin(uTime*0.25+uPhase));
        gl_FragColor=vec4(uAccent,i*0.055);
      }`
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3,7.2),mat);
  mesh.position.set(d.x,3.6,d.z);
  mesh.rotation.y=d.rot;
  S.add(mesh);
  shafts.push({mesh,uniforms:u});
});

// ═══════════════════════════════════ LOGO TERMINUS ═══════════════════════════════════
// At z=-80, fog-exempt, billboard, tint system. The impossible light at the end.

const logoU={
  uMap:{value:null},uOpacity:{value:0},
  uTint:{value:new THREE.Vector3(0.96,0.96,0.97)},
  uTintStrength:{value:0},uTime:{value:0}
};
const logoMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.NormalBlending,uniforms:logoU,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
  fragmentShader:`
    uniform sampler2D uMap;uniform float uOpacity,uTintStrength,uTime;uniform vec3 uTint;varying vec2 v;
    void main(){
      vec4 tex=texture2D(uMap,v);
      if(tex.a<0.01)discard;
      vec3 col=tex.rgb;
      float mx=max(col.r,max(col.g,col.b));
      float mn=min(col.r,min(col.g,col.b));
      float sat=mx>0.?(mx-mn)/mx:0.;
      float tM=smoothstep(0.2,0.5,sat);
      col=mix(col,uTint*mx,tM*uTintStrength);
      float pulse=0.28+0.03*sin(uTime*0.1);
      gl_FragColor=vec4(col,tex.a*pulse*uOpacity);
    }`
});
// Scaled 5x to compensate for z=-80 distance, reads ~same apparent size
const logoMesh=new THREE.Mesh(new THREE.PlaneGeometry(50,50),logoMat);
logoMesh.position.set(0,3.5,-80);
S.add(logoMesh);

new THREE.TextureLoader().load('img/co3-mark-circle.png',function(tex){
  tex.encoding=THREE.sRGBEncoding;
  logoU.uMap.value=tex;logoU.uOpacity.value=1;logoMat.needsUpdate=true;
});

// ═══════════════════════════════════ DUST IN LIGHT SHAFTS ═══════════════════════════════════

const DUST_N=M?250:600;
const dustG=new THREE.BufferGeometry();
const dustP=new Float32Array(DUST_N*3),dustSpd=new Float32Array(DUST_N);
for(let i=0;i<DUST_N;i++){
  // Distribute within shaft volumes
  const shaft=shaftDefs[i%3];
  dustP[i*3]  =shaft.x+(Math.random()-.5)*3;
  dustP[i*3+1]=Math.random()*7.2;
  dustP[i*3+2]=shaft.z+(Math.random()-.5)*2;
  dustSpd[i]=0.015+Math.random()*0.015;
}
dustG.setAttribute('position',new THREE.BufferAttribute(dustP,3));
dustG.setAttribute('aSpd',new THREE.BufferAttribute(dustSpd,1));
const dustU={uTime:{value:0}};
const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:dustU,
  vertexShader:`
    attribute float aSpd;uniform float uTime;varying float vA;
    void main(){
      vec3 pos=position;
      pos.y=mod(pos.y+uTime*aSpd,7.2);
      pos.x+=sin(uTime*0.08+position.z*0.5)*0.15;
      vec4 mv=modelViewMatrix*vec4(pos,1);float d=-mv.z;
      vA=smoothstep(60.,3.,d)*(0.15+0.15*sin(uTime*0.3+position.x*2.));
      gl_PointSize=max(1.,(0.8+0.7*sin(position.z))*(15./max(d,1.)));
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    varying float vA;
    void main(){
      float d=length(gl_PointCoord-.5);
      if(d>.5)discard;
      float a=smoothstep(.5,0.,d)*vA;
      gl_FragColor=vec4(1.,.92,.78,a);
    }`
});
S.add(new THREE.Points(dustG,dustMat));

// ═══════════════════════════════════ AMBIENT PARTICLES ═══════════════════════════════════

const AMB_N=M?150:400;
const ambG=new THREE.BufferGeometry();
const ambP=new Float32Array(AMB_N*3),ambD=new Float32Array(AMB_N*3);
for(let i=0;i<AMB_N;i++){
  ambP[i*3]  =(Math.random()-.5)*11;
  ambP[i*3+1]=Math.random()*7;
  ambP[i*3+2]=10-Math.random()*80;
  const s=0.005+Math.random()*0.01;
  ambD[i*3]  =(Math.random()-.5)*s;
  ambD[i*3+1]=(Math.random()-.5)*s;
  ambD[i*3+2]=(Math.random()-.5)*s;
}
ambG.setAttribute('position',new THREE.BufferAttribute(ambP,3));
ambG.setAttribute('aDrift',new THREE.BufferAttribute(ambD,3));
const ambU={uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const ambMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:ambU,
  vertexShader:`
    attribute vec3 aDrift;uniform float uTime;varying float vA;
    void main(){
      vec3 pos=position+aDrift*uTime;
      vec4 mv=modelViewMatrix*vec4(pos,1);float d=-mv.z;
      vA=smoothstep(50.,2.,d)*0.07;
      gl_PointSize=max(1.,.7*(12./max(d,1.)));
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    uniform vec3 uAccent;varying float vA;
    void main(){
      float d=length(gl_PointCoord-.5);
      if(d>.5)discard;
      gl_FragColor=vec4(uAccent,smoothstep(.5,0.,d)*vA);
    }`
});
S.add(new THREE.Points(ambG,ambMat));

// ═══════════════════════════════════ LIGHTING ═══════════════════════════════════

S.add(new THREE.AmbientLight(0x0a0810,0.25));
const keyL=new THREE.DirectionalLight(0xffa060,0.35);keyL.position.set(0,6,10);S.add(keyL);
const rimL=new THREE.DirectionalLight(0xff6700,0.1);rimL.position.set(0,4,-40);S.add(rimL);
const fillL=new THREE.PointLight(0xff6700,0.5,20);fillL.position.set(0,3.5,0);S.add(fillL);

// ═══════════════════════════════════ CAMERA ═══════════════════════════════════

const states={
  home:    {pos:[0,3.5,6],    look:[0,3.2,-80],  oR:.3,  oH:.15, oS:.02},
  product: {pos:[-3.5,3.5,0], look:[4,3,-5],      oR:.2,  oH:.1,  oS:.015},
  research:{pos:[0,3.5,-8],   look:[0,3,-80],     oR:.25, oH:.12, oS:.018},
  contact: {pos:[3.5,3.5,2],  look:[-4,3,-3],     oR:.2,  oH:.1,  oS:.015}
};
let curSt='home';
let tPos=new THREE.Vector3(0,3.5,6),tLook=new THREE.Vector3(0,3.2,-80);
let cPos=new THREE.Vector3(0,3.5,6),cLook=new THREE.Vector3(0,3.2,-80);
let oA=0,trans=false;
cam.position.copy(cPos);cam.lookAt(cLook);

window.co3Scene={
  setState(n){
    if(!states[n]||n===curSt)return;
    curSt=n;const s=states[n];
    tPos.set(s.pos[0],s.pos[1],s.pos[2]);
    tLook.set(s.look[0],s.look[1],s.look[2]);
    trans=true;setTimeout(()=>{trans=false},2500);
    aTgt.copy(n==='product'?GOLD:ORANGE);
    tintTgt=n==='product'?1:0;
  },
  getState(){return curSt}
};

// ═══════════════════════════════════ ANIMATION ═══════════════════════════════════

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  const t=clock.getElapsedTime();

  // ── Color lerp ──
  accent.lerp(aTgt,dt*1.5);
  tintStr+=(tintTgt-tintStr)*dt*1.5;
  const av=new THREE.Vector3(accent.r,accent.g,accent.b);

  // ── Update all uniforms ──
  floorU.uTime.value=t;floorU.uAccent.value.copy(av);
  ceilU.uTime.value=t;ceilU.uAccent.value.copy(av);
  lwU.uTime.value=t;lwU.uAccent.value.copy(av);
  rwU.uTime.value=t;rwU.uAccent.value.copy(av);
  shafts.forEach(s=>{s.uniforms.uTime.value=t;s.uniforms.uAccent.value.copy(av)});
  dustU.uTime.value=t;
  ambU.uTime.value=t;ambU.uAccent.value.copy(av);
  logoU.uTime.value=t;logoU.uTintStrength.value=tintStr;
  postU.uTime.value=t;

  // ── Lights ──
  fillL.color.copy(accent);
  rimL.color.copy(accent);
  fillL.intensity=.4+.1*Math.sin(t*.2);

  // ── Logo billboard — always faces camera, always upright ──
  logoMesh.quaternion.copy(cam.quaternion);

  // ── Camera — viscous, heavy, inside the corridor ──
  const ls=trans?1.2:2.5;
  cPos.lerp(tPos,dt*ls);cLook.lerp(tLook,dt*ls);
  const s=states[curSt];
  oA+=dt*s.oS;
  cam.position.set(
    cPos.x+Math.sin(oA)*s.oR+Math.sin(t*.1)*.15,
    cPos.y+Math.cos(oA*.7)*s.oH+Math.cos(t*.07)*.1,
    cPos.z+Math.sin(oA*.3)*(s.oR*.3)
  );
  cam.lookAt(
    cLook.x+Math.sin(t*.08)*.1,
    cLook.y+Math.cos(t*.06)*.08,
    cLook.z
  );

  // ── Render ──
  R.setRenderTarget(rt);R.render(S,cam);R.setRenderTarget(null);
  postU.tDiffuse.value=rt.texture;R.render(pSc,pCam);
}
animate();

window.addEventListener('resize',()=>{
  const w=window.innerWidth,h=window.innerHeight;
  cam.aspect=w/h;cam.updateProjectionMatrix();R.setSize(w,h);
  const p=Math.min(window.devicePixelRatio,M?1.5:2);
  rt.setSize(w*p,h*p);postU.uRes.value.set(w,h);
});
})();
