/* ═══════════════════════════════════════════════════════════
   CO3 ONE v8 — App Controller
   Logo fade, tagline reposition, navigation
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const pages = ['home','research','product','contact'];
let cur = 0, locked = false;
const LOCK = 2500;
const tagline = document.querySelector('.tagline');
const heroLogo = document.querySelector('.hero-logo');

function go(idx) {
  if (locked || idx === cur || idx < 0 || idx >= pages.length) return;
  locked = true;
  const name = pages[idx];
  const isHome = name === 'home';

  // Deactivate current page
  const prevEl = document.getElementById(pages[cur]);
  if (prevEl) prevEl.classList.remove('active');

  // Transition flash
  const flash = document.querySelector('.transition-flash');
  if (flash) { flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 400); }

  // Camera + color
  if (window.co3Scene) window.co3Scene.setState(name);

  // Logo: visible on home, fades on everything else
  if (heroLogo) heroLogo.classList.toggle('visible', isHome);

  // Tagline (centered): visible on home only
  if (tagline) tagline.classList.toggle('visible', isHome);

  // Nav active
  document.querySelectorAll('nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.page === name)
  );

  // Activate page content — after old page has fully cleared
  cur = idx;
  setTimeout(() => {
    const el = document.getElementById(name);
    if (el) el.classList.add('active');
  }, name === 'home' ? 500 : 700);

  // URL
  history.replaceState(null, null, name === 'home' ? '#' : '#' + name);

  setTimeout(() => { locked = false; }, LOCK);
}

// Nav clicks
document.querySelectorAll('nav a[data-page]').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault();
    const i = pages.indexOf(a.dataset.page);
    if (i >= 0) go(i);
  })
);

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(cur + 1);
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(cur - 1);
  else if (e.key === 'Escape') go(0);
});

// Wheel — scroll within panels first, page-transition only at edges
let wA = 0;
document.addEventListener('wheel', e => {
  // Check if a scrollable container exists on active page
  const active = document.querySelector('.page.active');
  if (active) {
    const sc = active.querySelector('.r-grid, .c-duo, .miji-verse');
    if (sc && sc.scrollHeight > sc.clientHeight) {
      const atTop = sc.scrollTop <= 0;
      const atBot = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
      if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBot)) {
        wA = 0;
        return; // let scroll happen naturally
      }
    }
  }
  e.preventDefault();
  wA += e.deltaY;
  if (Math.abs(wA) > 80) { go(cur + (wA > 0 ? 1 : -1)); wA = 0; }
}, { passive: false });

// Touch swipe — allow scroll within panels
let tY = 0;
document.addEventListener('touchstart', e => { tY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchmove', e => {
  const active = document.querySelector('.page.active');
  if (active) {
    const sc = active.querySelector('.r-grid, .c-duo, .miji-verse');
    if (sc && sc.scrollHeight > sc.clientHeight) return; // allow native scroll
  }
  e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', e => {
  const active = document.querySelector('.page.active');
  if (active) {
    const sc = active.querySelector('.r-grid, .c-duo, .miji-verse');
    if (sc && sc.scrollHeight > sc.clientHeight) {
      const atTop = sc.scrollTop <= 0;
      const atBot = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
      const dy = tY - e.changedTouches[0].clientY;
      if ((dy < 0 && !atTop) || (dy > 0 && !atBot)) return;
    }
  }
  const dy = tY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 40) go(cur + (dy > 0 ? 1 : -1));
}, { passive: true });

// Select helper
document.querySelectorAll('.c-field select').forEach(sel =>
  sel.addEventListener('change', () => sel.classList.toggle('has-value', sel.value !== ''))
);

// Init
function init() {
  const h = location.hash.replace('#', '');
  const i = pages.indexOf(h);
  if (i > 0) {
    cur = i;
    if (window.co3Scene) window.co3Scene.setState(pages[i]);
    document.getElementById(pages[i]).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.dataset.page === pages[i]));
    if (tagline) tagline.classList.remove('visible');
    if (heroLogo) heroLogo.classList.remove('visible');
  } else {
    document.getElementById('home').classList.add('active');
    document.querySelector('nav a[data-page="home"]').classList.add('active');
    if (tagline) tagline.classList.add('visible');
  }
}

if (document.readyState === 'complete') init();
else window.addEventListener('load', init);

})();
