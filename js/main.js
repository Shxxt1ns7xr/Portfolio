/* =====================================================================
   DIMPLE PAWA - PIXEL PORTFOLIO  |  main.js
   Flow:  Loading  ->  Start page  ->  Home (+ About / Projects / Skills / Contact)
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var DESIGN_W = 1366, DESIGN_H = 768;
  var MOBILE_MAX = 860;
  var MIN_LOADING_MS = 2600;           // how long the sand-clock spins at minimum
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- scaling: 1 design pixel = --u screen pixels ---------- */
  var lastW = 0;
  function setScale() {
    var w = window.innerWidth, h = window.innerHeight;
    var u = Math.min(w / DESIGN_W, h / DESIGN_H);
    if (w <= MOBILE_MAX) u = Math.max(0.36, Math.min(0.8, w / 900));
    root.style.setProperty('--u', u.toFixed(4) + 'px');
    // on phones the URL bar changes the height while scrolling - only update when width changes
    if (w !== lastW || w > MOBILE_MAX) root.style.setProperty('--vh', h + 'px');
    lastW = w;
  }
  setScale();
  window.addEventListener('resize', setScale);
  window.addEventListener('orientationchange', setScale);

  /* ---------- state ---------- */
  function setState(s) { root.setAttribute('data-state', s); }
  function getState() { return root.getAttribute('data-state'); }

  var loader   = $('#loader');
  var start    = $('#start');
  var startBtn = $('#start-btn');
  var pages    = $$('.page');

  /* ---------- 1. loading ---------- */
  function preload(urls) {
    return Promise.all(urls.map(function (u) {
      return new Promise(function (res) {
        var i = new Image(); i.onload = i.onerror = res; i.src = u;
      });
    }));
  }
  var imageList = $$('img').map(function (i) { return i.getAttribute('src'); })
    .concat(['assets/img/ground.png', 'assets/img/grass.png']);
  imageList = imageList.filter(function (v, i, a) { return v && a.indexOf(v) === i; });

  var minWait  = new Promise(function (r) { setTimeout(r, MIN_LOADING_MS); });
  var fonts    = (document.fonts && document.fonts.load)
    ? document.fonts.load('22px "Press Start 2P"').catch(function () {}) : Promise.resolve();
  var failSafe = new Promise(function (r) { setTimeout(r, 9000); });

  Promise.race([Promise.all([minWait, preload(imageList), fonts]), failSafe]).then(showStart);

  function showStart() {
    if (getState() !== 'loading') return;
    setState('start');
    loader.classList.add('hide');
  }

  /* ---------- 2. start -> home ---------- */
  function enterSite() {
    if (getState() !== 'start') return;
    setState('main');
    window.scrollTo({ top: 0, behavior: 'auto' });
    start.classList.add('leaving');
    setTimeout(function () { start.hidden = true; }, 750);
    var hash = location.hash.replace('#', '');
    var target = hash && document.getElementById(hash);
    if (target && target.classList.contains('page')) { target.scrollIntoView({ behavior: 'auto' }); }
    updateActive();
    observeReveal();
  }
  if (startBtn) startBtn.addEventListener('click', enterSite);
  document.addEventListener('keydown', function (e) {
    if (getState() === 'start' && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== startBtn) {
      e.preventDefault(); enterSite();
    }
  });

  function backToStart() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    start.hidden = false;
    // force reflow so the fade replays
    void start.offsetWidth;
    start.classList.remove('leaving');
    setState('start');
    history.replaceState(null, '', location.pathname + location.search);
  }

  /* ---------- navigation ---------- */
  var navCurrent = $('#nav-current');
  var navLinks   = $('#nav-links');
  var menuBtn    = $('#menu-btn');
  var currentId  = null;

  function updateActive() {
    var mid = window.innerHeight * 0.5, found = pages[0];
    pages.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) found = p;
    });
    if (!found || found.id === currentId) return;
    currentId = found.id;
    navCurrent.textContent = found.getAttribute('data-label');
    if (!reduceMotion) { navCurrent.classList.remove('swap'); void navCurrent.offsetWidth; navCurrent.classList.add('swap'); }
    $$('li', navLinks).forEach(function (li) { li.classList.toggle('current', li.getAttribute('data-for') === currentId); });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { updateActive(); ticking = false; });
  }, { passive: true });
  updateActive();

  $$('a[href^="#"]', navLinks).forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', '#' + id);
      closeMenu();
    });
  });

  function closeMenu() {
    navLinks.classList.remove('open');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('click', function (e) {
    if (navLinks.classList.contains('open') && !e.target.closest('#nav')) closeMenu();
  });

  /* pointer arrow = "back": previous section (Home -> start page) */
  $$('.back-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var page = btn.closest('.page'), i = pages.indexOf(page);
      if (i <= 0) backToStart();
      else pages[i - 1].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- reveal animations when a section comes into view ---------- */
  var typed = false;
  function observeReveal() {
    if (!('IntersectionObserver' in window)) { pages.forEach(function (p) { p.classList.add('in-view'); }); startTyping(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in-view');
        if (en.target.id === 'about') startTyping();
        io.unobserve(en.target);
      });
    }, { threshold: 0.35 });
    pages.forEach(function (p) { if (!p.classList.contains('in-view')) io.observe(p); });
  }

  /* ---------- typewriter for the About text ---------- */
  var aboutText = $('#about-text'), chars = [];
  (function prepTyping() {
    if (!aboutText) return;
    var full = aboutText.textContent.replace(/\s+/g, ' ').trim();
    var sr = document.createElement('p'); sr.className = 'sr-only'; sr.textContent = full;
    aboutText.parentNode.insertBefore(sr, aboutText);
    aboutText.setAttribute('aria-hidden', 'true');
    var walker = document.createTreeWalker(aboutText, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        part.split('').forEach(function (ch) {
          var c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.appendChild(c); chars.push(c);
        });
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    // a <br> breaks the word list: nothing else to do. Make everything visible when JS animations are off
    if (reduceMotion) chars.forEach(function (c) { c.classList.add('on'); });
  })();

  function startTyping() {
    if (typed || !chars.length) return;
    typed = true;
    if (reduceMotion) { chars.forEach(function (c) { c.classList.add('on'); }); return; }
    var i = 0, STEP = 20, last = performance.now(), done = false;
    function finish() { chars.forEach(function (c) { c.classList.add('on'); c.classList.remove('cur'); }); done = true; }
    aboutText.addEventListener('click', finish);
    setTimeout(function tick() {
      if (done) return;
      var now = performance.now(), steps = Math.max(1, Math.floor((now - last) / STEP));
      last = now;
      for (var s = 0; s < steps && i < chars.length; s++) {
        if (i > 0) { chars[i - 1].classList.remove('cur'); }
        chars[i].classList.add('on'); i++;
      }
      if (i < chars.length) { chars[i].classList.add('cur'); setTimeout(tick, STEP); }
      else { chars[chars.length - 1].classList.remove('cur'); done = true; }
    }, 700);
  }

  /* ---------- 3. resume viewer ---------- */
  var modal = $('#resume-modal'), resumeImg = $('#resume-img'), resumeBtn = $('#resume-btn');
  var lastFocus = null;
  function openResume() {
    lastFocus = document.activeElement;
    if (!resumeImg.getAttribute('src')) resumeImg.setAttribute('src', resumeImg.getAttribute('data-src'));
    modal.hidden = false;
    root.classList.add('modal-open');
    var closeBtn = $('.modal-x', modal); if (closeBtn) closeBtn.focus();
    var sc = $('.resume-scroll', modal); if (sc) sc.scrollTop = 0;
  }
  function closeResume() {
    modal.hidden = true;
    root.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  if (resumeBtn) resumeBtn.addEventListener('click', openResume);
  $$('[data-close]', modal).forEach(function (el) { el.addEventListener('click', closeResume); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeResume(); return; }
    if (e.key === 'Tab') {                       // keep focus inside the dialog
      var f = $$('a[href], button', modal).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  });
})();
