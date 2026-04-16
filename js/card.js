(function(){
'use strict';
function rand(min,max){return Math.random()*(max-min)+min}
function lerp(a,b,t){return a+(b-a)*t}
const GOLD={r:196,g:162,b:101};

// Hero orb — exact miji.one rendering
function createOrb(canvas,size){
  const ctx=canvas.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  canvas.width=size*dpr;canvas.height=size*dpr;
  canvas.style.width=size+'px';canvas.style.height=size+'px';
  ctx.scale(dpr,dpr);
  const cx=size/2,cy=size/2,baseR=size*0.34;
  let t=rand(0,1000);
  function draw(){
    t+=0.014;
    ctx.clearRect(0,0,size,size);
    const pulse=0.75+Math.sin(t*0.55)*0.25;
    const glowR=baseR*(1.7+Math.sin(t*0.55)*0.25);
    const glow=ctx.createRadialGradient(cx,cy,baseR*0.5,cx,cy,glowR);
    glow.addColorStop(0,`rgba(${GOLD.r},${GOLD.g},${GOLD.b},${0.14*pulse})`);
    glow.addColorStop(0.5,`rgba(${GOLD.r},${GOLD.g},${GOLD.b},${0.05*pulse})`);
    glow.addColorStop(1,'rgba(8,8,15,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,size,size);
    for(let i=5;i>=0;i--){
      const frac=i/5;
      const r=baseR*(0.4+frac*0.6)*(0.94+pulse*0.06);
      const ox=Math.sin(t+i*1.2)*baseR*0.09;
      const oy=Math.cos(t*0.8+i*0.9)*baseR*0.09;
      const alpha=lerp(0.55,0.1,frac)*pulse;
      const cR=Math.round(lerp(GOLD.r,GOLD.r*0.6,frac));
      const cG=Math.round(lerp(GOLD.g,GOLD.g*0.5,frac));
      const cB=Math.round(lerp(GOLD.b,GOLD.b*0.4,frac));
      const grad=ctx.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);
      grad.addColorStop(0,`rgba(${cR},${cG},${cB},${alpha})`);
      grad.addColorStop(1,`rgba(${cR},${cG},${cB},0)`);
      ctx.beginPath();ctx.arc(cx+ox,cy+oy,r,0,Math.PI*2);
      ctx.fillStyle=grad;ctx.fill();
    }
    const coreA=(0.4+Math.sin(t*1.8)*0.15)*pulse;
    const coreG=ctx.createRadialGradient(cx,cy,0,cx,cy,baseR*0.25);
    coreG.addColorStop(0,`rgba(255,240,210,${coreA})`);
    coreG.addColorStop(1,'rgba(196,162,101,0)');
    ctx.beginPath();ctx.arc(cx,cy,baseR*0.3,0,Math.PI*2);
    ctx.fillStyle=coreG;ctx.fill();
    const ringR=baseR*(0.82+Math.sin(t*0.7)*0.12);
    ctx.beginPath();ctx.arc(cx,cy,ringR,0,Math.PI*2);
    ctx.strokeStyle=`rgba(${GOLD.r},${GOLD.g},${GOLD.b},${(0.12+Math.sin(t)*0.07)*pulse})`;
    ctx.lineWidth=0.8;ctx.stroke();
    requestAnimationFrame(draw);
  }
  draw();
}

// Scorecard canvas
const moodPalettes={
  low:{c1:[90,60,100],c2:[50,50,80],c3:[70,40,60]},
  mid:{c1:[120,120,80],c2:[80,100,120],c3:[100,80,90]},
  good:{c1:[196,152,80],c2:[60,140,160],c3:[140,70,90]},
  high:{c1:[210,180,80],c2:[80,180,140],c3:[200,140,60]}
};
function initCard(){
  const card=document.querySelector('.share-card-mini');
  if(!card)return;
  const canvas=card.querySelector('.share-card-canvas-mini');
  if(!canvas)return;
  const mood=card.getAttribute('data-mood')||'good';
  const pal=moodPalettes[mood]||moodPalettes.good;
  const sw=180,sh=240;
  const dpr=window.devicePixelRatio||1;
  canvas.width=sw*dpr;canvas.height=sh*dpr;
  canvas.style.width='100%';canvas.style.height='100%';
  const ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  let t=rand(0,1000);
  const cx1=rand(.15,.55),cy1=rand(.1,.45);
  const cx2=rand(.45,.85),cy2=rand(.55,.9);
  const r1=rand(.45,.8),r2=rand(.35,.7);
  const drift1=rand(.12,.28),drift2=rand(.12,.28);
  const spd1=rand(.25,.5),spd2=rand(.2,.45);
  function draw(){
    t+=.004;
    const x1=sw*(cx1+Math.sin(t*spd1)*drift1);
    const y1=sh*(cy1+Math.sin(t*(spd1*.75))*(drift1*.75));
    const x2=sw*(cx2+Math.cos(t*spd2)*drift2);
    const y2=sh*(cy2+Math.cos(t*(spd2*.7))*(drift2*.75));
    const x3=sw*(.5+Math.sin(t*.2+2)*.3);
    const y3=sh*(.5+Math.cos(t*.15+1)*.3);
    ctx.fillStyle='#08080F';ctx.fillRect(0,0,sw,sh);
    const a1=.28+Math.sin(t*.5)*.08;
    const g1=ctx.createRadialGradient(x1,y1,0,x1,y1,sw*r1);
    g1.addColorStop(0,`rgba(${pal.c1[0]},${pal.c1[1]},${pal.c1[2]},${a1})`);
    g1.addColorStop(1,'rgba(8,8,15,0)');
    ctx.fillStyle=g1;ctx.fillRect(0,0,sw,sh);
    const a2=.2+Math.cos(t*.45)*.06;
    const g2=ctx.createRadialGradient(x2,y2,0,x2,y2,sw*r2);
    g2.addColorStop(0,`rgba(${pal.c2[0]},${pal.c2[1]},${pal.c2[2]},${a2})`);
    g2.addColorStop(1,'rgba(8,8,15,0)');
    ctx.fillStyle=g2;ctx.fillRect(0,0,sw,sh);
    const a3=.12+Math.sin(t*.6+3)*.04;
    const g3=ctx.createRadialGradient(x3,y3,0,x3,y3,sw*.5);
    g3.addColorStop(0,`rgba(${pal.c3[0]},${pal.c3[1]},${pal.c3[2]},${a3})`);
    g3.addColorStop(1,'rgba(8,8,15,0)');
    ctx.fillStyle=g3;ctx.fillRect(0,0,sw,sh);
    requestAnimationFrame(draw);
  }
  draw();
}

function init(){
  const orb=document.getElementById('miji-orb');
  if(orb) createOrb(orb,120);
  initCard();
}
if(document.readyState==='complete')init();
else window.addEventListener('load',init);
})();
