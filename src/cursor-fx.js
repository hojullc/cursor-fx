/*!
 * cursor-fx v1.0.0
 * Experimental cursor tracking — trail, magnetic, spotlight, blob, text-label.
 * Zero dependencies. MIT License — https://github.com/hojullc/cursor-fx
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory()
    : typeof define === 'function' && define.amd ? define(factory)
    : (global.CursorFx = factory());
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const isMobile = () => window.matchMedia('(hover: none)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const raf = requestAnimationFrame.bind(window);

  /* ─── Base cursor ─────────────────────────────────────────────────────── */
  function createCursor(opts = {}) {
    if (isMobile()) return { destroy: () => {} };

    const {
      size       = 20,
      color      = 'rgba(112,100,255,0.85)',
      mixBlend   = 'difference',
      smooth     = 0.12,
      hideNative = true,
    } = opts;

    const dot = document.createElement('div');
    dot.id = 'cfx-dot';
    dot.style.cssText = `
      position:fixed;top:0;left:0;width:${size}px;height:${size}px;
      border-radius:50%;background:${color};pointer-events:none;
      mix-blend-mode:${mixBlend};z-index:999999;transform:translate(-50%,-50%);
      transition:width .2s,height .2s,opacity .2s;will-change:transform;
    `;
    document.body.appendChild(dot);
    if (hideNative) document.body.style.cursor = 'none';

    let mx = 0, my = 0, cx = 0, cy = 0, frame;

    const onMove = e => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove);

    function tick() {
      cx = lerp(cx, mx, smooth);
      cy = lerp(cy, my, smooth);
      dot.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 50%))`;
      frame = raf(tick);
    }
    frame = raf(tick);

    // Scale on interactive elements
    document.querySelectorAll('a,button,[data-cfx-hover]').forEach(el => {
      el.addEventListener('mouseenter', () => { dot.style.width = `${size * 2.4}px`; dot.style.height = `${size * 2.4}px`; dot.style.opacity = '0.6'; });
      el.addEventListener('mouseleave', () => { dot.style.width = `${size}px`; dot.style.height = `${size}px`; dot.style.opacity = '1'; });
    });

    return {
      el: dot,
      destroy() {
        cancelAnimationFrame(frame);
        window.removeEventListener('mousemove', onMove);
        dot.remove();
        if (hideNative) document.body.style.cursor = '';
      },
    };
  }

  /* ─── Trail ───────────────────────────────────────────────────────────── */
  function trail(opts = {}) {
    if (isMobile()) return { destroy: () => {} };

    const {
      count    = 12,
      size     = 10,
      color    = '#7064ff',
      smooth   = 0.18,
      fade     = true,
    } = opts;

    const dots = Array.from({ length: count }, (_, i) => {
      const d = document.createElement('div');
      const scale = fade ? 1 - i / count : 1;
      d.style.cssText = `
        position:fixed;top:0;left:0;width:${size}px;height:${size}px;
        border-radius:50%;background:${color};pointer-events:none;z-index:999998;
        transform:translate(-50%,-50%);opacity:${scale};will-change:transform;
      `;
      document.body.appendChild(d);
      return { el: d, x: 0, y: 0 };
    });

    document.body.style.cursor = 'none';
    let mx = 0, my = 0, frame;
    const onMove = e => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove);

    function tick() {
      dots[0].x = lerp(dots[0].x, mx, smooth);
      dots[0].y = lerp(dots[0].y, my, smooth);
      for (let i = 1; i < count; i++) {
        dots[i].x = lerp(dots[i].x, dots[i - 1].x, smooth * 0.8);
        dots[i].y = lerp(dots[i].y, dots[i - 1].y, smooth * 0.8);
      }
      dots.forEach(d => {
        d.el.style.transform = `translate(calc(${d.x}px - 50%), calc(${d.y}px - 50%))`;
      });
      frame = raf(tick);
    }
    frame = raf(tick);

    return {
      destroy() {
        cancelAnimationFrame(frame);
        window.removeEventListener('mousemove', onMove);
        dots.forEach(d => d.el.remove());
        document.body.style.cursor = '';
      },
    };
  }

  /* ─── Magnetic ────────────────────────────────────────────────────────── */
  function magnetic(selector, opts = {}) {
    if (isMobile()) return { destroy: () => {} };

    const {
      strength = 0.35,
      ease     = 0.12,
    } = opts;

    const els = document.querySelectorAll(selector);
    const cleanups = [];

    els.forEach(el => {
      let tx = 0, ty = 0, frame;
      el.style.transition = 'transform 0.3s ease';

      const onMove = e => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        tx = (e.clientX - cx) * strength;
        ty = (e.clientY - cy) * strength;
      };

      const onLeave = () => { tx = 0; ty = 0; };

      let lx = 0, ly = 0;
      function tick() {
        lx = lerp(lx, tx, ease);
        ly = lerp(ly, ty, ease);
        el.style.transform = `translate(${lx}px, ${ly}px)`;
        frame = raf(tick);
      }

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      frame = raf(tick);

      cleanups.push(() => {
        cancelAnimationFrame(frame);
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.style.transform = '';
      });
    });

    return { destroy() { cleanups.forEach(fn => fn()); } };
  }

  /* ─── Spotlight ───────────────────────────────────────────────────────── */
  function spotlight(container, opts = {}) {
    if (isMobile()) return { destroy: () => {} };

    const {
      radius   = 220,
      color    = 'rgba(112,100,255,0.15)',
      blur     = 60,
      dark     = true,
    } = opts;

    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return { destroy: () => {} };

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:10;transition:opacity .3s;
      background:${dark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.0)'};
    `;
    el.style.position = el.style.position || 'relative';
    el.appendChild(overlay);

    const onMove = e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      overlay.style.background = `radial-gradient(circle ${radius}px at ${x}px ${y}px,
        transparent 0%, ${dark ? 'rgba(0,0,0,0.75)' : color} 100%)`;
    };

    const onLeave = () => { overlay.style.background = dark ? 'rgba(0,0,0,0.75)' : 'transparent'; };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return {
      destroy() {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        overlay.remove();
      },
    };
  }

  /* ─── Blob ────────────────────────────────────────────────────────────── */
  function blob(opts = {}) {
    if (isMobile()) return { destroy: () => {} };

    const {
      size     = 48,
      color    = 'rgba(112,100,255,0.6)',
      smooth   = 0.08,
      morph    = true,
      speed    = 0.8,
    } = opts;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-1 -1 2 2');
    svg.style.cssText = `
      position:fixed;top:0;left:0;width:${size}px;height:${size}px;
      pointer-events:none;z-index:999999;overflow:visible;
      transform:translate(-50%,-50%);will-change:transform;
    `;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', color);
    svg.appendChild(path);
    document.body.appendChild(svg);
    document.body.style.cursor = 'none';

    let mx = 0, my = 0, cx = 0, cy = 0, t = 0, frame;

    const onMove = e => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove);

    function blobPath(t) {
      const pts = 6;
      const coords = [];
      for (let i = 0; i < pts; i++) {
        const angle = (i / pts) * Math.PI * 2;
        const r = morph
          ? 0.75 + 0.25 * Math.sin(t * speed + i * 1.3) * Math.cos(t * speed * 0.7 + i)
          : 0.85;
        coords.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      let d = `M ${coords[0][0]} ${coords[0][1]}`;
      for (let i = 0; i < pts; i++) {
        const next = coords[(i + 1) % pts];
        const curr = coords[i];
        const mx2 = (curr[0] + next[0]) / 2;
        const my2 = (curr[1] + next[1]) / 2;
        d += ` Q ${curr[0]} ${curr[1]} ${mx2} ${my2}`;
      }
      return d + ' Z';
    }

    function tick() {
      t += 0.025;
      cx = lerp(cx, mx, smooth);
      cy = lerp(cy, my, smooth);
      svg.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 50%))`;
      path.setAttribute('d', blobPath(t));
      frame = raf(tick);
    }
    frame = raf(tick);

    return {
      destroy() {
        cancelAnimationFrame(frame);
        window.removeEventListener('mousemove', onMove);
        svg.remove();
        document.body.style.cursor = '';
      },
    };
  }

  /* ─── Text label ──────────────────────────────────────────────────────── */
  function label(opts = {}) {
    if (isMobile()) return { destroy: () => {} };

    const {
      offset = { x: 16, y: -8 },
      style  = '',
    } = opts;

    const tag = document.createElement('div');
    tag.style.cssText = `
      position:fixed;top:0;left:0;pointer-events:none;z-index:999999;
      font-size:.75rem;font-weight:600;color:#fff;background:#7064ff;
      padding:4px 10px;border-radius:20px;white-space:nowrap;
      transform:translate(0,-50%);opacity:0;transition:opacity .15s;${style}
    `;
    document.body.appendChild(tag);

    const onMove = e => {
      tag.style.left = `${e.clientX + offset.x}px`;
      tag.style.top  = `${e.clientY + offset.y}px`;
    };

    const triggers = document.querySelectorAll('[data-cfx-label]');
    triggers.forEach(el => {
      el.addEventListener('mouseenter', () => {
        tag.textContent = el.getAttribute('data-cfx-label');
        tag.style.opacity = '1';
      });
      el.addEventListener('mouseleave', () => { tag.style.opacity = '0'; });
    });

    window.addEventListener('mousemove', onMove);

    return {
      destroy() {
        window.removeEventListener('mousemove', onMove);
        tag.remove();
      },
    };
  }

  /* ─── Auto-init ───────────────────────────────────────────────────────── */
  function autoInit() {
    const mode = document.body.getAttribute('data-cfx');
    if (!mode) return;
    const opts = {};
    try { Object.assign(opts, JSON.parse(document.body.getAttribute('data-cfx-opts') || '{}')); } catch (e) {}
    switch (mode) {
      case 'cursor':   createCursor(opts); break;
      case 'trail':    trail(opts); break;
      case 'blob':     blob(opts); break;
      case 'label':    label(opts); break;
    }
  }

  if (typeof document !== 'undefined') {
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', autoInit)
      : autoInit();
  }

  return { createCursor, trail, magnetic, spotlight, blob, label, autoInit };
}));
