/* Boss Lady Bloggers · main.js
   Vanilla JS for every interactive feature (CLAUDE.md §5).
   Each block checks whether its element exists before running. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- F4: popout menu ---------- */
  var menuBtn = document.querySelector('[data-menu-open]');
  var popout = document.getElementById('popout-menu');
  if (menuBtn && popout) {
    var closeBtn = popout.querySelector('[data-menu-close]');
    var lastFocus = null;
    function openMenu() {
      lastFocus = document.activeElement;
      popout.classList.add('open');
      document.body.classList.add('menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      (closeBtn || popout).focus();
    }
    function closeMenu() {
      popout.classList.remove('open');
      document.body.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (lastFocus) lastFocus.focus();
    }
    menuBtn.addEventListener('click', function () {
      popout.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popout.classList.contains('open')) closeMenu();
    });
    popout.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------- F19: scroll reveal (once, staggered 80ms) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window && !reduced) {
    var seen = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var delay = (seen % 6) * 80; seen++;
        setTimeout(function () { el.classList.add('in'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- F6: circled word draw-in ---------- */
  document.querySelectorAll('.circle-draw ellipse').forEach(function (el) {
    var len = 2 * Math.PI * Math.sqrt((96 * 96 + 34 * 34) / 2); // approx
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = reduced ? 0 : len;
    if (reduced) return;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        el.style.transition = 'stroke-dashoffset 900ms ease';
        el.style.strokeDashoffset = 0;
        io2.disconnect();
      });
    }, { threshold: 0.6 });
    io2.observe(el.closest('section') || el);
  });

  /* ---------- F8: sticky stacking cards scale ---------- */
  var stack = document.querySelectorAll('[data-stack] > *');
  if (stack.length && !reduced) {
    var ticking = false;
    function stackScale() {
      stack.forEach(function (card, i) {
        var r = card.getBoundingClientRect();
        var top = 120 + i * 24;
        var cover = Math.min(Math.max((top + 80 - r.top) / 400, 0), 1);
        if (r.top <= top + 81) card.style.transform = 'scale(' + (1 - cover * 0.05) + ')';
        else card.style.transform = '';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(stackScale); ticking = true; }
    }, { passive: true });
  }

  /* ---------- F9/F10: tabs (offers "Fabulous Things", About glossary) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-tabpanel="' + group.getAttribute('data-tabs') + '"]'));
    function select(i) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        t.classList.toggle('tab-active', on);
      });
      panels.forEach(function (p, j) { p.hidden = i !== j; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var n = (i + dir + tabs.length) % tabs.length;
        select(n); tabs[n].focus();
      });
    });
    select(0);
  });

  /* ---------- F11: Boss Blend slider fill ---------- */
  var blends = document.querySelectorAll('[data-blend]');
  if (blends.length && 'IntersectionObserver' in window) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var bar = en.target;
        var v = bar.getAttribute('data-blend');
        var fill = bar.querySelector('.blend-fill');
        if (fill) {
          if (reduced) { fill.style.width = v + '%'; }
          else {
            fill.style.transition = 'width 900ms ease';
            requestAnimationFrame(function () { fill.style.width = v + '%'; });
          }
        }
        io3.unobserve(bar);
      });
    }, { threshold: 0.5 });
    blends.forEach(function (b) { io3.observe(b); });
  }

  /* ---------- F12: FAQ smooth height ---------- */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var a = d.querySelector('.faq-a');
    if (!a || reduced) return;
    d.addEventListener('toggle', function () {
      if (d.open) {
        var h = a.scrollHeight;
        a.style.maxHeight = '0';
        a.style.transition = 'max-height .3s ease';
        requestAnimationFrame(function () { a.style.maxHeight = h + 40 + 'px'; });
      } else {
        a.style.maxHeight = '';
      }
    });
  });

  /* ---------- F17: waitlist forms (Flodesk TODO) ---------- */
  document.querySelectorAll('[data-waitlist]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      // TODO: replace with the real Flodesk form action (see TODO.md).
      if (!form.getAttribute('action') || form.getAttribute('action') === '#') {
        e.preventDefault();
        var success = form.parentElement.querySelector('.form-success');
        if (success) { form.hidden = true; success.hidden = false; }
      }
    });
  });

  /* ---------- Instagram feed (homepage strip) ---------- */
  var feed = document.querySelector('[data-instagram-feed]');
  if (feed) {
    var FEED_URL = 'https://feeds.behold.so/3p9InkPKcoMGdzJUSdtH';
    if (FEED_URL) {
      var cached = null;
      try {
        var raw = localStorage.getItem('blb_ig');
        if (raw) { cached = JSON.parse(raw); if (Date.now() - cached.t > 3600000) cached = null; }
      } catch (err) { cached = null; }
      var render = function (posts) {
        var tiles = feed.querySelectorAll('.ig-tile');
        posts.slice(0, tiles.length).forEach(function (p, i) {
          var a = tiles[i];
          a.href = p.permalink;
          a.innerHTML = '';
          var img = document.createElement('img');
          img.src = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.mediaUrl || p.thumbnailUrl;
          img.alt = (p.caption || 'Instagram post').slice(0, 120);
          img.loading = 'lazy';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:18px';
          a.appendChild(img);
        });
      };
      if (cached) render(cached.p);
      else fetch(FEED_URL).then(function (r) { return r.json(); }).then(function (data) {
        var posts = data.posts || data;
        try { localStorage.setItem('blb_ig', JSON.stringify({ t: Date.now(), p: posts })); } catch (err) {}
        render(posts);
      }).catch(function () {/* keep branded placeholders */});
    }
  }
})();
