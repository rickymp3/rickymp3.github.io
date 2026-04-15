/* ═══════════════════════════════════════════════════════════
   CO3 ONE — Gateway v5 (final synthesis)
   Smooth rings · Color lerp · Logo in 3D · 2077 alien tech
   ═══════════════════════════════════════════════════════════ */
(function(){
const ORANGE=new THREE.Color(0xff6700);
const GOLD=new THREE.Color(0xC4A265);
const accent=new THREE.Color().copy(ORANGE);
const accentTarget=new THREE.Color().copy(ORANGE);
const M=window.innerWidth<768;
const TSEG=M?128:256; // tubular segments — SMOOTH
const RSEG=48; // radial segments — round cross-section

const R=new THREE.WebGLRenderer({antialias:!M,powerPreference:'high-performance'});
R.setSize(window.innerWidth,window.innerHeight);
R.setPixelRatio(Math.min(window.devicePixelRatio,M?1.5:2));
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=.85;
document.getElementById('scene-container').appendChild(R.domElement);

const S=new THREE.Scene();S.background=new THREE.Color(0x08080e);S.fog=new THREE.FogExp2(0x08080e,.008);
const cam=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,.1,500);

// Post
const pr=Math.min(window.devicePixelRatio,M?1.5:2);
const rt=new THREE.WebGLRenderTarget(window.innerWidth*pr,window.innerHeight*pr);
const pS=new THREE.Scene(),pC=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const pM=new THREE.ShaderMaterial({
  uniforms:{tDiffuse:{value:null},uTime:{value:0},uRes:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position,1);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uRes;varying vec2 v;
    void main(){vec2 u=v;vec2 c=u-.5;u+=c*dot(c,c)*.02;float ca=.001*length(u-.5);
    vec3 col=vec3(texture2D(tDiffuse,u+vec2(ca,0)).r,texture2D(tDiffuse,u).g,texture2D(tDiffuse,u-vec2(ca,0)).b);
    vec3 b=vec3(0);float bs=3./uRes.x;
    for(float i=-2.;i<=2.;i++)for(float j=-2.;j<=2.;j++){vec3 s=texture2D(tDiffuse,u+vec2(i,j)*bs).rgb;b+=s*smoothstep(.15,.7,dot(s,vec3(.2126,.7152,.0722)));}
    col+=b/25.*.55;
    vec3 b2=vec3(0);float bs2=8./uRes.x;
    for(float i=-2.;i<=2.;i++)for(float j=-2.;j<=2.;j++){vec3 s=texture2D(tDiffuse,u+vec2(i,j)*bs2).rgb;b2+=s*smoothstep(.05,.35,dot(s,vec3(.2126,.7152,.0722)));}
    col+=b2/25.*.22;col*=vec3(1.02,.99,.96);col*=1.+.02*sin(uTime*.08);gl_FragColor=vec4(col,1);}`
});pS.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),pM));

// Stars
const SC=M?1500:4000,sG=new THREE.BufferGeometry(),sP=new Float32Array(SC*3),sZ=new Float32Array(SC);
for(let i=0;i<SC;i++){const t=Math.random()*6.283,p=Math.acos(2*Math.random()-1),r=100+Math.random()*150;sP[i*3]=r*Math.sin(p)*Math.cos(t);sP[i*3+1]=r*Math.sin(p)*Math.sin(t);sP[i*3+2]=r*Math.cos(p);sZ[i]=.5+Math.random()*2}
sG.setAttribute('position',new THREE.BufferAttribute(sP,3));sG.setAttribute('aSize',new THREE.BufferAttribute(sZ,1));
const sM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},
vertexShader:'attribute float aSize;uniform float uTime;varying float a;void main(){vec4 m=modelViewMatrix*vec4(position,1);a=(.6+.4*sin(uTime*1.5+position.x*.1+position.y*.2))*.7;gl_PointSize=aSize*(80./-m.z);gl_Position=projectionMatrix*m;}',
fragmentShader:'varying float a;void main(){float d=length(gl_PointCoord-.5);float g=exp(-d*6.);gl_FragColor=vec4(mix(vec3(1,.9,.8),vec3(.8,.85,1),smoothstep(0,.5,d)),g*a);}'});
S.add(new THREE.Points(sG,sM));

// Nebula
const nM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:2,uniforms:{uTime:{value:0}},
vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
fragmentShader:'uniform float uTime;varying vec2 v;void main(){vec2 p=v-.5;float d=length(p);float g=exp(-d*2.5)*.15;vec3 c=mix(vec3(.4,.15,.02),vec3(.08,.03,.01),d*2.);gl_FragColor=vec4(c,g*(.8+.2*sin(uTime*.05+d*3.)));}'});
const n1=new THREE.Mesh(new THREE.PlaneGeometry(200,200),nM);n1.position.z=-80;S.add(n1);
const n2M=nM.clone();n2M.fragmentShader='uniform float uTime;varying vec2 v;void main(){vec2 p=v-vec2(.55,.45);float d=length(p);gl_FragColor=vec4(mix(vec3(.1,.05,.2),vec3(.02,.01,.05),d*2.),exp(-d*3.)*.08);}';
const n2=new THREE.Mesh(new THREE.PlaneGeometry(200,200),n2M);n2.position.set(20,10,-100);n2.scale.set(1.5,1.5,1);S.add(n2);

// ═══════════════════════════════ GATEWAY ═══════════════════════════════

const gw=new THREE.Group();S.add(gw);
const coloredMats=[]; // Track all materials that need color lerp

// Logo texture baked into gateway
const logoMesh=new THREE.Mesh(new THREE.PlaneGeometry(16.4,16.4),
  new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
logoMesh.position.z=.05;gw.add(logoMesh);
new THREE.TextureLoader().load('img/co3-mark-circle.png',function(t){
  t.encoding=THREE.sRGBEncoding;logoMesh.material.map=t;logoMesh.material.opacity=.2;logoMesh.material.needsUpdate=true;});

// Primary ring
const mainMat=new THREE.MeshStandardMaterial({color:0xff6700,emissive:0xff6700,emissiveIntensity:.5,metalness:.9,roughness:.2});
gw.add(new THREE.Mesh(new THREE.TorusGeometry(8,.07,RSEG,TSEG),mainMat));
coloredMats.push({mat:mainMat,type:'standard'});

// Segmented ring builder
function segRing(radius,tube,segs,gapFrac,opacity){
  const g=new THREE.Group();const arc=(6.283/segs)*(1-gapFrac);
  for(let i=0;i<segs;i++){
    const m=new THREE.MeshBasicMaterial({color:0xff6700,transparent:true,opacity});
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,RSEG,TSEG,arc),m);
    mesh.rotation.z=(i/segs)*6.283;g.add(mesh);coloredMats.push({mat:m,type:'basic'});
  }return g;
}

// Ring 2: 4 arcs, CW creep
const r2=segRing(10,.025,4,.15,.3);r2.userData={spd:.002,zAmp:.1};gw.add(r2);

// Ring 3: continuous ghost
const r3Mat=new THREE.MeshBasicMaterial({color:0xff6700,transparent:true,opacity:.1});
const r3=new THREE.Mesh(new THREE.TorusGeometry(12,.015,RSEG,TSEG),r3Mat);
r3.userData={spd:-.001,zAmp:.18};gw.add(r3);coloredMats.push({mat:r3Mat,type:'basic'});

// Ring 4: 3 arcs, CCW
const r4=segRing(14,.02,3,.2,.18);r4.userData={spd:-.0015,zAmp:.13};gw.add(r4);

// Ring 5: 6 dashes, outermost whisper
const r5=segRing(16.5,.012,6,.6,.06);r5.userData={spd:.0008,zAmp:.22};gw.add(r5);

const dynRings=[r2,r3,r4,r5];

// Trackers
const trMat=new THREE.MeshBasicMaterial({color:0xff6700,transparent:true,opacity:.7});
const tr=new THREE.Mesh(new THREE.SphereGeometry(.1,16,16),trMat);gw.add(tr);
coloredMats.push({mat:trMat,type:'basic'});
const tr2Mat=new THREE.MeshBasicMaterial({color:0xff6700,transparent:true,opacity:.45});
const tr2=new THREE.Mesh(new THREE.SphereGeometry(.07,12,12),tr2Mat);gw.add(tr2);
coloredMats.push({mat:tr2Mat,type:'basic'});

// Portal interior — uses uniform for accent color
const portalUni={uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const portalMat=new THREE.ShaderMaterial({transparent:true,side:2,depthWrite:false,uniforms:portalUni,
vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
fragmentShader:`uniform float uTime;uniform vec3 uAccent;varying vec2 v;void main(){vec2 p=v-.5;float d=length(p);
float pulse=sin(d*30.-uTime*.4)*.5+.5;float edge=smoothstep(.5,.42,d);float eg=smoothstep(.42,.5,d)*smoothstep(.52,.5,d)*3.;float ctr=smoothstep(.25,0.,d);
float al=pulse*edge*.03+eg*.22+ctr*.012;al*=.85+.15*sin(uTime*.2);gl_FragColor=vec4(uAccent*(.4+pulse*.3),al);}`});
gw.add(new THREE.Mesh(new THREE.CircleGeometry(7.8,64),portalMat));

// Particles — uses uniform for accent
const PC=M?500:1800;const pG=new THREE.BufferGeometry(),pp=new Float32Array(PC*3),ph=new Float32Array(PC),sp=new Float32Array(PC),ra=new Float32Array(PC);
for(let i=0;i<PC;i++){const a=Math.random()*6.283,r=Math.random()*7;pp[i*3]=Math.cos(a)*r;pp[i*3+1]=Math.sin(a)*r;pp[i*3+2]=(Math.random()-.5)*60;ph[i]=Math.random()*6.283;sp[i]=.3+Math.random()*1;ra[i]=r}
pG.setAttribute('position',new THREE.BufferAttribute(pp,3));pG.setAttribute('aPhase',new THREE.BufferAttribute(ph,1));
pG.setAttribute('aSpeed',new THREE.BufferAttribute(sp,1));pG.setAttribute('aRadius',new THREE.BufferAttribute(ra,1));
const partUni={uTime:{value:0},uAccent:{value:new THREE.Vector3(1,.404,0)}};
const partMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:partUni,
vertexShader:'attribute float aPhase,aSpeed,aRadius;uniform float uTime;varying float vA;void main(){vec3 pos=position;pos.z=mod(pos.z+uTime*aSpeed*2.+aPhase*20.,60.)-30.;float a2=atan(position.y,position.x)+uTime*.05*aSpeed;pos.x=cos(a2)*aRadius;pos.y=sin(a2)*aRadius;float pp2=exp(-pos.z*pos.z*.005);pos.x*=1.-pp2*.3;pos.y*=1.-pp2*.3;vec4 mv=modelViewMatrix*vec4(pos,1);float dist=-mv.z;vA=(.1+pp2*.35)*smoothstep(60.,5.,dist);gl_PointSize=max(1.,(1.+pp2*2.)*(16./max(dist,1.)));gl_Position=projectionMatrix*mv;}',
fragmentShader:'uniform vec3 uAccent;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(uAccent,exp(-d*5.)*vA);}'});
S.add(new THREE.Points(pG,partMat));

// Dust
const DC=M?300:900;const dG=new THREE.BufferGeometry(),dp=new Float32Array(DC*3);
for(let i=0;i<DC;i++){dp[i*3]=(Math.random()-.5)*100;dp[i*3+1]=(Math.random()-.5)*60;dp[i*3+2]=(Math.random()-.5)*100}
dG.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dustMat=new THREE.PointsMaterial({color:0xff6700,size:.05,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false});
S.add(new THREE.Points(dG,dustMat));coloredMats.push({mat:dustMat,type:'basic'});

// Lighting
S.add(new THREE.AmbientLight(0x0a0810,.3));
const kL=new THREE.DirectionalLight(0xffa060,.5);kL.position.set(0,0,20);S.add(kL);
const rL=new THREE.DirectionalLight(0xff6700,.2);rL.position.set(0,10,-15);S.add(rL);
const fL=new THREE.PointLight(0xff6700,.8,25);fL.position.set(0,0,0);S.add(fL);

// ═══════════════════════════════ CAMERA ═══════════════════════════════

const states={
  home:    {pos:[0,0,30],look:[0,0,0],oR:4,oH:2.5,oS:.03},
  product: {pos:[18,4,22],look:[2,-1,0],oR:2,oH:1,oS:.02},
  research:{pos:[0,2,14],look:[0,0,-3],oR:1.5,oH:.8,oS:.02},
  contact: {pos:[-16,8,26],look:[-2,1,0],oR:2,oH:1.5,oS:.015}
};
let curState='home',tPos=new THREE.Vector3(0,0,30),tLook=new THREE.Vector3(0,0,0);
let cPos=new THREE.Vector3(0,0,30),cLook=new THREE.Vector3(0,0,0),oA=0,trans=false;
cam.position.copy(cPos);cam.lookAt(cLook);

window.co3Scene={
  setState(n){if(!states[n]||n===curState)return;curState=n;const s=states[n];
    tPos.set(s.pos[0],s.pos[1],s.pos[2]);tLook.set(s.look[0],s.look[1],s.look[2]);
    trans=true;setTimeout(()=>{trans=false},2200);
    // Color target
    accentTarget.copy(n==='product'?GOLD:ORANGE);
  },
  getState(){return curState}
};

// ═══════════════════════════════ LOOP ═══════════════════════════════

let glitchTimer=8+Math.random()*7,glitchTgt=null,glitchOff=0,glitchDec=0;
const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05),t=clock.getElapsedTime();

  // Uniforms
  sM.uniforms.uTime.value=t;nM.uniforms.uTime.value=t;
  portalUni.uTime.value=t;partUni.uTime.value=t;pM.uniforms.uTime.value=t;

  // ── Color lerp ──
  accent.lerp(accentTarget,dt*1.5);
  const av=new THREE.Vector3(accent.r,accent.g,accent.b);
  portalUni.uAccent.value.copy(av);
  partUni.uAccent.value.copy(av);
  coloredMats.forEach(({mat,type})=>{
    mat.color.copy(accent);
    if(type==='standard')mat.emissive.copy(accent);
  });
  fL.color.copy(accent);rL.color.copy(accent);
  dustMat.color.copy(accent);

  // ── Rings — slow, precise ──
  dynRings.forEach(r=>{
    r.rotation.z+=r.userData.spd;
    r.position.z=Math.sin(t*.07+dynRings.indexOf(r)*1.5)*r.userData.zAmp;
  });
  r3Mat.opacity=.08+.04*Math.sin(t*.12);

  // ── Glitch ──
  glitchTimer-=dt;
  if(glitchTimer<=0&&!glitchTgt){const tgts=[r2,r4,r5];glitchTgt=tgts[Math.floor(Math.random()*3)];glitchOff=(Math.random()-.5)*.06;glitchDec=.25;glitchTimer=7+Math.random()*12}
  if(glitchTgt){glitchTgt.rotation.z+=glitchOff;glitchDec-=dt;if(glitchDec<=0){glitchTgt=null;glitchOff=0}}

  // ── Trackers ──
  const t1a=t*.1;tr.position.set(Math.cos(t1a)*8.05,Math.sin(t1a)*8.05,.08);
  trMat.opacity=.45+.25*Math.sin(t*.6);
  const t2a=-t*.07+3.14;tr2.position.set(Math.cos(t2a)*14.05,Math.sin(t2a)*14.05,r4.position.z);

  // Logo pulse
  if(logoMesh.material.map)logoMesh.material.opacity=.18+.025*Math.sin(t*.12);

  // Gateway drift
  gw.rotation.z+=dt*.003;

  // Light breathe
  fL.intensity=.7+.12*Math.sin(t*.2);

  // ── Camera ──
  const ls=trans?1.8:3;cPos.lerp(tPos,dt*ls);cLook.lerp(tLook,dt*ls);
  const s=states[curState];oA+=dt*s.oS;
  cam.position.set(cPos.x+Math.sin(oA)*s.oR,cPos.y+Math.cos(oA*.7)*s.oH,cPos.z+Math.sin(oA*.3)*(s.oR*.4));
  cam.lookAt(cLook.x+Math.sin(t*.1)*.15,cLook.y+Math.cos(t*.07)*.1,cLook.z);

  // Render
  R.setRenderTarget(rt);R.render(S,cam);R.setRenderTarget(null);
  pM.uniforms.tDiffuse.value=rt.texture;R.render(pS,pC);
}
animate();

window.addEventListener('resize',()=>{const w=window.innerWidth,h=window.innerHeight;
cam.aspect=w/h;cam.updateProjectionMatrix();R.setSize(w,h);
const p2=Math.min(window.devicePixelRatio,M?1.5:2);rt.setSize(w*p2,h*p2);pM.uniforms.uRes.value.set(w,h);});
})();
