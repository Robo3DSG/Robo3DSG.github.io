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
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { load(v); tryPlay(v); }
        else if (!v.paused) { v.pause(); }
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
    lb.addEventListener('click', function () { lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
  }
})();
