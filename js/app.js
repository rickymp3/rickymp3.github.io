/* ═══════════════════════════════════════════════════════════
   CO3 ONE — App Controller
   Navigation state machine + page transitions
   ═══════════════════════════════════════════════════════════ */

(function(){

const pages = ['home','product','research','contact'];
let current = 0;
let locked = false;
const LOCK_MS = 2000;

function navigateTo(idx){
  if(locked || idx===current || idx<0 || idx>=pages.length) return;
  locked = true;

  const name = pages[idx];
  const prev = pages[current];

  // Deactivate current page
  const prevEl = document.getElementById(prev);
  if(prevEl) prevEl.classList.remove('active');

  // Flash transition
  const flash = document.querySelector('.transition-flash');
  if(flash){ flash.classList.add('active'); setTimeout(()=>flash.classList.remove('active'),400); }

  // Move camera
  if(window.co3Scene) window.co3Scene.setState(name);

  // Update nav
  document.querySelectorAll('nav a').forEach(a=>{
    a.classList.toggle('active', a.dataset.page===name);
  });

  // Activate new page after camera settles
  current = idx;
  setTimeout(()=>{
    const el = document.getElementById(name);
    if(el) el.classList.add('active');
  }, name==='home' ? 600 : 900);

  // Update URL
  history.replaceState(null,null, name==='home' ? '#' : '#'+name);

  setTimeout(()=>{ locked=false; }, LOCK_MS);
}

// ── Nav clicks ──
document.querySelectorAll('nav a[data-page]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const idx = pages.indexOf(a.dataset.page);
    if(idx>=0) navigateTo(idx);
  });
});

// Corner logo → home
const cornerLogo = document.querySelector('.corner-logo');
if(cornerLogo){
  cornerLogo.addEventListener('click', e=>{
    e.preventDefault();
    navigateTo(0);
  });
}

// ── Keyboard ──
document.addEventListener('keydown', e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowDown') navigateTo(current+1);
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp') navigateTo(current-1);
  else if(e.key==='Escape') navigateTo(0);
});

// ── Mouse wheel ──
let wheelAccum = 0;
const WHEEL_THRESHOLD = 80;
document.addEventListener('wheel', e=>{
  e.preventDefault();
  wheelAccum += e.deltaY;
  if(Math.abs(wheelAccum) > WHEEL_THRESHOLD){
    navigateTo(current + (wheelAccum>0?1:-1));
    wheelAccum = 0;
  }
}, {passive:false});

// ── Touch swipe ──
let touchStartX=0, touchStartY=0;
document.addEventListener('touchstart', e=>{
  touchStartX=e.touches[0].clientX;
  touchStartY=e.touches[0].clientY;
},{passive:true});
document.addEventListener('touchend', e=>{
  const dx=e.changedTouches[0].clientX-touchStartX;
  const dy=e.changedTouches[0].clientY-touchStartY;
  if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>60){
    navigateTo(current+(dy<0?1:-1));
  } else if(Math.abs(dx)>60){
    navigateTo(current+(dx<0?1:-1));
  }
},{passive:true});

// ── Hash on load ──
function initFromHash(){
  const hash = location.hash.replace('#','');
  const idx = pages.indexOf(hash);
  if(idx>0){
    current = idx;
    if(window.co3Scene) window.co3Scene.setState(pages[idx]);
    document.getElementById(pages[idx]).classList.add('active');
    document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===pages[idx]));
  } else {
    document.getElementById('home').classList.add('active');
    document.querySelector('nav a[data-page="home"]').classList.add('active');
  }
}

// Wait for scene to initialize
if(document.readyState==='complete') initFromHash();
else window.addEventListener('load', initFromHash);

})();
