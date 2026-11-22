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

  // ---- Dimension rollouts: one player per dimension, clips play one after another ----
  // Each [data-dimroll] block has a Franka and a GR1 video; both show the same step (sub-factor A,
  // sub-factor B) and the block advances once both clips have ended, looping back to the first step.
  // The step buttons jump; the block plays only while visible; the next step's clips are prefetched
  // with preload="metadata" only.
  var ROBOTS = ['franka', 'gr1'];
  function clipSrc(r, f) { return 'static/videos/' + r + '/' + f + '.mp4'; }
  function clipPoster(r, f) { return 'static/images/posters/' + r + '_' + f + '.jpg'; }
  var dimrolls = Array.prototype.slice.call(document.querySelectorAll('[data-dimroll]'));
  dimrolls.forEach(function (blk) {
    var steps = Array.prototype.slice.call(blk.querySelectorAll('.dr-step'));
    var caps = Array.prototype.slice.call(blk.querySelectorAll('.dr-cap'));
    var vids = Array.prototype.slice.call(blk.querySelectorAll('.dr-v video'));
    var badges = Array.prototype.slice.call(blk.querySelectorAll('.dr-badge .dr-sf'));
    var pre = ROBOTS.map(function () { var p = document.createElement('video'); p.muted = true; p.preload = 'metadata'; return p; });
    var cur = 0, started = false, visible = false, done = [false, false];
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function setStep(k) {
      cur = (k + steps.length) % steps.length;
      started = true; done = [false, false];
      var b = steps[cur], nb = steps[(cur + 1) % steps.length];
      steps.forEach(function (s, j) { s.classList.toggle('on', j === cur); s.setAttribute('aria-pressed', j === cur ? 'true' : 'false'); s.querySelector('.dr-prog').style.width = '0'; });
      caps.forEach(function (c, j) { c.classList.toggle('on', j === cur); });
      badges.forEach(function (x, i) { x.textContent = (i ? b.dataset.lg : b.dataset.lf) || b.dataset.label; });
      vids.forEach(function (v, i) {
        var r = ROBOTS[i], f = b.dataset[r];
        v.poster = clipPoster(r, f);
        v.preload = 'auto';
        v.src = clipSrc(r, f);
        if (visible) play(v);
        var nf = nb.dataset[ROBOTS[i]];
        if (nb !== b && pre[i].dataset.f !== nf) { pre[i].dataset.f = nf; pre[i].src = clipSrc(ROBOTS[i], nf); }
      });
      blk.dataset.step = String(cur);
    }
    vids.forEach(function (v, i) {
      v.addEventListener('ended', function () {
        done[i] = true;
        if (done.every(Boolean)) setStep(cur + 1);
      });
      v.addEventListener('timeupdate', function () {
        // progress of the step = progress of the longer clip
        var p = 0;
        var longest = vids.reduce(function (a, x) { return x.duration > (a ? a.duration : 0) ? x : a; }, null);
        if (longest && longest.duration) p = longest.currentTime / longest.duration;
        steps[cur].querySelector('.dr-prog').style.width = (100 * Math.min(1, p)) + '%';
      });
    });
    steps.forEach(function (s, j) { s.addEventListener('click', function () { visible = true; setStep(j); }); });
    function onVis(isVis) {
      visible = isVis;
      if (isVis) { if (!started) setStep(0); else vids.forEach(function (v, i) { if (!done[i]) play(v); }); }
      else vids.forEach(function (v) { if (!v.paused) v.pause(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { onVis(e.isIntersecting); }); },
        { rootMargin: '100px 0px', threshold: 0.2 }).observe(blk.querySelector('.fc'));
    } else onVis(true);
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
