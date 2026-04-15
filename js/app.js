/* ═══════════════════════════════════════════════════════════
   CO3 ONE — App Controller v5
   ═══════════════════════════════════════════════════════════ */
(function(){
const pages=['home','product','research','contact'];
let cur=0,locked=false;
const LOCK=2000;

function go(idx){
  if(locked||idx===cur||idx<0||idx>=pages.length)return;
  locked=true;
  const name=pages[idx],prev=pages[cur];
  const prevEl=document.getElementById(prev);if(prevEl)prevEl.classList.remove('active');
  const flash=document.querySelector('.transition-flash');
  if(flash){flash.classList.add('active');setTimeout(()=>flash.classList.remove('active'),400)}
  if(window.co3Scene)window.co3Scene.setState(name);
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===name));
  cur=idx;
  setTimeout(()=>{const el=document.getElementById(name);if(el)el.classList.add('active')},name==='home'?500:900);
  history.replaceState(null,null,name==='home'?'#':'#'+name);
  setTimeout(()=>{locked=false},LOCK);
}

// Select helper for premium form
document.querySelectorAll('.c-field select').forEach(sel=>{
  sel.addEventListener('change',()=>{sel.classList.toggle('has-value',sel.value!=='')});
});

// Nav
document.querySelectorAll('nav a[data-page]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const i=pages.indexOf(a.dataset.page);if(i>=0)go(i)}));

// Keyboard
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown')go(cur+1);else if(e.key==='ArrowLeft'||e.key==='ArrowUp')go(cur-1);else if(e.key==='Escape')go(0)});

// Wheel
let wA=0;document.addEventListener('wheel',e=>{e.preventDefault();wA+=e.deltaY;if(Math.abs(wA)>80){go(cur+(wA>0?1:-1));wA=0}},{passive:false});

// Touch
let tx=0,ty=0;
document.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>60)go(cur+(dy<0?1:-1));else if(Math.abs(dx)>60)go(cur+(dx<0?1:-1))},{passive:true});

// Hash init
function init(){const h=location.hash.replace('#',''),i=pages.indexOf(h);
if(i>0){cur=i;if(window.co3Scene)window.co3Scene.setState(pages[i]);document.getElementById(pages[i]).classList.add('active');
document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===pages[i]))}
else{document.getElementById('home').classList.add('active');document.querySelector('nav a[data-page="home"]').classList.add('active')}}
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
