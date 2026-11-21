// Robo3DSG project page: lazy video playback, gallery filters, figure lightbox. Vanilla JS, no dependencies.
(function () {
  'use strict';

  // ---- Lazy-load videos and play only while visible ----
  var videos = Array.prototype.slice.call(document.querySelectorAll('video.lazy-video'));
  function load(v) {
    if (!v.dataset.loaded && v.dataset.src) {
      v.src = v.dataset.src;
      v.dataset.loaded = '1';
    }
  }
  function tryPlay(v) {
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  // Videos inside a [data-sync] block (the teaser pair) load together and start together from frame 0
  // once all of them can play; afterwards each loops at its own length.
  function group(v) {
    var g = v.closest('[data-sync]');
    return g ? Array.prototype.slice.call(g.querySelectorAll('video.lazy-video')) : [v];
  }
  function playGroup(g) {
    if (g.length === 1) { tryPlay(g[0]); return; }
    var host = g[0].closest('[data-sync]');
    if (host.dataset.started) { g.forEach(tryPlay); return; }
    var waiting = g.filter(function (x) { return x.readyState < 3; });
    if (!waiting.length) {
      host.dataset.started = '1';
      g.forEach(function (x) { x.currentTime = 0; tryPlay(x); });
      return;
    }
    if (host.dataset.waiting) return;
    host.dataset.waiting = '1';
    waiting.forEach(function (x) {
      x.preload = 'auto'; x.load();            // preload="none" would never reach canplay without play()
      x.addEventListener('canplay', function () {
        if (g.every(function (y) { return y.readyState >= 3; })) { delete host.dataset.waiting; playGroup(g); }
      });
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        var g = group(v);
        if (e.isIntersecting) { g.forEach(load); playGroup(g); }
        else g.forEach(function (x) { if (!x.paused) x.pause(); });
      });
    }, { rootMargin: '150px 0px', threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
  } else {
    videos.forEach(function (v) { load(v); v.autoplay = true; });
  }

  // ---- Gallery filters (robot x dimension x type) ----
  var state = { robot: 'all', dim: 'all', kind: 'all' };
  var clips = Array.prototype.slice.call(document.querySelectorAll('#gallery-grid .clip'));
  var empty = document.querySelector('.gallery-empty');
  function apply() {
    var shown = 0;
    clips.forEach(function (c) {
      var ok = ['robot', 'dim', 'kind'].every(function (k) {
        return state[k] === 'all' || c.dataset[k] === state[k];
      });
      c.hidden = !ok;
      if (ok) shown++;
      else { var v = c.querySelector('video'); if (v && !v.paused) v.pause(); }
    });
    if (empty) empty.hidden = shown !== 0;
  }
  document.querySelectorAll('.filter-group').forEach(function (g) {
    var key = g.dataset.filter;
    g.addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip');
      if (!b) return;
      g.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('active', x === b); });
      state[key] = b.dataset.value;
      apply();
    });
  });

  // ---- Fixed-canvas figures ----
  // A .fc[data-w] holds one .fc-in laid out at the fixed design width data-w (CSS px). The inner box is
  // scaled uniformly with transform: scale(), and the outer height follows, so text that is positioned
  // on images can never drift, wrap or overlap differently at another window width.
  function fit(box, inner, w, maxH) {
    var s = box.clientWidth / w;
    var h = inner.offsetHeight;
    if (maxH && h * s > maxH) s = maxH / h;
    inner.style.transform = 'scale(' + s + ')';
    box.style.height = (h * s) + 'px';
    return s;
  }
  var canvases = Array.prototype.slice.call(document.querySelectorAll('.fc[data-w]'));
  function fitAll() {
    canvases.forEach(function (fc) { fit(fc, fc.firstElementChild, +fc.dataset.w); });
  }
  canvases.forEach(function (fc) {
    var inner = fc.firstElementChild;
    inner.style.width = fc.dataset.w + 'px';
    fc.classList.add('fc-on');
  });
  fitAll();
  if ('ResizeObserver' in window) {
    // outer width changes (window resize) and inner height changes (images loading) both refit
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) {
        var fc = e.target.classList.contains('fc') ? e.target : e.target.parentElement;
        fit(fc, fc.firstElementChild, +fc.dataset.w);
      });
    });
    canvases.forEach(function (fc) { ro.observe(fc); ro.observe(fc.firstElementChild); });
  } else {
    window.addEventListener('resize', fitAll);
    window.addEventListener('load', fitAll);
  }

  // ---- Click-to-zoom for figures ----
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('img.zoomable').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lb.classList.add('open');
      });
    });
    // HTML/SVG figures: the lightbox shows the SAME canvas (a clone laid out at the same design width),
    // only scaled up to fit the screen; nothing is re-flowed.
    var lbFit = null;
    document.querySelectorAll('.hfig').forEach(function (fig) {
      fig.addEventListener('click', function (e) {
        var body = fig.querySelector('.hfig-body');
        if (!body || e.target.closest('a')) return;
        var fc = body.classList.contains('fc') ? body : null;
        var w = fc ? +fc.dataset.w : body.getBoundingClientRect().width;
        var src = fc ? fc.firstElementChild : body;
        var card = document.createElement('div');
        card.className = 'lb-card';
        var box = document.createElement('div');
        box.className = 'lb-box';
        var inner = document.createElement('div');
        inner.className = 'lb-in hfig';            // same selectors as on the page
        var clone = src.cloneNode(true);
        clone.style.transform = ''; clone.style.position = 'static';
        inner.style.width = w + 'px';
        inner.appendChild(fc ? (function () { var b = document.createElement('div'); b.className = 'hfig-body'; b.appendChild(clone); return b; })() : clone);
        inner.querySelectorAll('img[loading]').forEach(function (i) { i.removeAttribute('loading'); });
        if (fig.hasAttribute('data-lb-video')) {
          // teaser pair: the enlarged unit keeps its videos, continuing from the on-page frame
          var orig = fig.querySelectorAll('video');
          inner.querySelectorAll('video').forEach(function (v, k) {
            var o = orig[k];
            v.removeAttribute('preload'); v.muted = true;
            if (v.dataset.src) v.src = v.dataset.src;
            v.addEventListener('loadedmetadata', function () { if (o) v.currentTime = o.currentTime; tryPlay(v); }, { once: true });
          });
        } else {
          inner.querySelectorAll('video').forEach(function (v) { v.remove(); });
        }
        box.appendChild(inner);
        card.appendChild(box);
        lb.appendChild(card);
        lb.classList.add('open', 'open-html');
        lbFit = function () {
          var p1 = parseFloat(getComputedStyle(lb).paddingLeft) || 0, p2 = parseFloat(getComputedStyle(card).paddingLeft) || 0;
          var pad = 2 * (p1 + p2);
          var availW = window.innerWidth - pad, availH = window.innerHeight - pad;
          var h = inner.offsetHeight;
          var s = Math.min(availW / w, availH / h);
          box.style.width = (w * s) + 'px';
          box.style.height = (h * s) + 'px';
          inner.style.transform = 'scale(' + s + ')';
        };
        lbFit();
        inner.querySelectorAll('img').forEach(function (i) { if (!i.complete) i.addEventListener('load', lbFit); });
      });
    });
    window.addEventListener('resize', function () { if (lbFit) lbFit(); });
    function closeLb() {
      lb.classList.remove('open', 'open-html');
      var c = lb.querySelector('.lb-card'); if (c) c.remove();
      lbFit = null;
    }
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }
})();
