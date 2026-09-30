/* Divan Olivier — portrait that follows the cursor.
   Drop this file next to index.html and add, before </body>:
   <script src="head-tracker.js"></script>
   It swaps the <img alt="Portrait of Divan Olivier"> for a canvas that is drawn
   from the same divan.png, so no extra image files are needed. */
(() => {
  const SELECTOR = 'img[alt="Portrait of Divan Olivier"]';

  // ---- tuning (pixels are in the ORIGINAL 1024x1536 image) -----------------
  const T = {
    pivot: [495, 250],          // base of the neck, the head turns around this
    headShift: [2.0, 1.4],      // px the whole head slides toward the cursor
    headRoll: 2.2,              // degrees of tilt toward the cursor
    faceShift: [4.0, 2.6],      // extra px the face plane slides inside the head (the "turn")
    eyeShift: [2.4, 1.2],       // px the irises travel inside the eye openings
    face: { c: [505, 178], rx: 44, ry: 50 },
    eyes: [ { c: [484, 165], rx: 9,   ry: 3.3 },
            { c: [531.5, 171], rx: 9.5, ry: 3.3 } ],
    headFadeY: [232, 255],      // head layer fades out over the neck here
    baseFadeY: [222, 240]       // body layer fades in here (mirror of the above)
  };
  // ---------------------------------------------------------------------------

  const img0 = document.querySelector(SELECTOR);
  if (!img0) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const src = new Image();
  src.onload = () => { try { init(src); } catch (e) { console.warn('head-tracker:', e); } };
  src.src = img0.currentSrc || img0.src;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  function ellipseMask(ctx, cx, cy, rx, ry, inner) {
    // soft-edged ellipse, used with destination-in
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(inner, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.globalCompositeOperation = 'destination-in';
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function init(src) {
    const W = src.naturalWidth, H = src.naturalHeight;
    const k = W / 1024;                       // in case the file is ever swapped for a larger export
    const s = v => v * k;

    // ---- pre-build layers --------------------------------------------------
    const base = mk(W, H), head = mk(W, H), face = mk(W, H);
    const eyeL = T.eyes.map(() => mk(W, H));

    base.getContext('2d').drawImage(src, 0, 0);
    head.getContext('2d').drawImage(src, 0, 0);

    // body layer: erase the head, fade back in over the neck
    {
      const c = base.getContext('2d');
      const g = c.createLinearGradient(0, s(T.baseFadeY[0]), 0, s(T.baseFadeY[1]));
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      c.globalCompositeOperation = 'destination-in';
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(0,0,0,0)'; // rows above the ramp are fully transparent
    }
    // head layer: keep only the head, fade out over the neck
    {
      const c = head.getContext('2d');
      const g = c.createLinearGradient(0, s(T.headFadeY[0]), 0, s(T.headFadeY[1]));
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'destination-in';
      c.fillStyle = g; c.fillRect(0, 0, W, s(T.headFadeY[1]) + 1);
      c.clearRect(0, s(T.headFadeY[1]), W, H);
    }
    // face plane: feathered ellipse around eyes / nose / mouth
    {
      const c = face.getContext('2d'); c.drawImage(src, 0, 0);
      ellipseMask(c, s(T.face.c[0]), s(T.face.c[1]), s(T.face.rx), s(T.face.ry), 0.55);
    }
    // iris patches
    T.eyes.forEach((e, i) => {
      const c = eyeL[i].getContext('2d'); c.drawImage(src, 0, 0);
      ellipseMask(c, s(e.c[0]), s(e.c[1]), s(e.rx), s(e.ry), 0.6);
    });

    // ---- swap <img> for <canvas> -------------------------------------------
    // Your stylesheet styles ".portrait img", so give the canvas the same look.
    const st = document.createElement('style');
    st.textContent = '.portrait canvas.hero-portrait{display:block;width:100%;height:auto;' +
      'filter:grayscale(100%) contrast(105%);user-select:none;pointer-events:none}';
    document.head.appendChild(st);
    const cv = mk(W, H);
    cv.className = (img0.className + ' hero-portrait').trim(); cv.id = img0.id;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', img0.alt);
    img0.replaceWith(cv);
    const ctx = cv.getContext('2d');

    // ---- pointer tracking --------------------------------------------------
    let tx = 0, ty = 0;           // target, -1..1, relative to the head
    let hx = 0, hy = 0;           // head (slow)
    let ex = 0, ey = 0;           // eyes (fast)
    let last = '';
    const clamp = v => Math.max(-1, Math.min(1, v));

    addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      const hc = [r.left + r.width * (T.face.c[0] / 1024), r.top + r.height * (T.face.c[1] / 1536)];
      const span = Math.max(innerWidth, innerHeight) * 0.5;
      tx = clamp((e.clientX - hc[0]) / span);
      ty = clamp((e.clientY - hc[1]) / span);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { tx = 0; ty = 0; });
    // touch screens: follow a finger drag (pointermove is cancelled once a touch scrolls)
    addEventListener('touchmove', e => {
      const t = e.touches[0]; if (!t) return;
      const r = cv.getBoundingClientRect();
      const span = Math.max(innerWidth, innerHeight) * 0.5;
      tx = clamp((t.clientX - (r.left + r.width * (T.face.c[0] / 1024))) / span);
      ty = clamp((t.clientY - (r.top + r.height * (T.face.c[1] / 1536))) / span);
    }, { passive: true });
    addEventListener('touchend', () => { tx = 0; ty = 0; }, { passive: true });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0);

      ctx.save();
      ctx.translate(s(T.pivot[0]), s(T.pivot[1]));
      ctx.rotate(hx * T.headRoll * Math.PI / 180);
      ctx.translate(s(hx * T.headShift[0]), s(hy * T.headShift[1]));
      ctx.translate(-s(T.pivot[0]), -s(T.pivot[1]));
      ctx.drawImage(head, 0, 0);

      // face plane slides further than the skull -> reads as a head turn
      ctx.save();
      ctx.translate(s(hx * T.faceShift[0]), s(hy * T.faceShift[1]));
      ctx.drawImage(face, 0, 0);
      // irises slide furthest, and lead the head
      T.eyes.forEach((e, i) => {
        ctx.drawImage(eyeL[i], s(ex * T.eyeShift[0]), s(ey * T.eyeShift[1]));
      });
      ctx.restore();
      ctx.restore();
    }

    (function tick() {
      hx += (tx - hx) * 0.06; hy += (ty - hy) * 0.06;
      ex += (tx - ex) * 0.18; ey += (ty - ey) * 0.18;
      const key = [hx, hy, ex, ey].map(v => v.toFixed(3)).join();
      if (key !== last) { last = key; draw(); }
      requestAnimationFrame(tick);
    })();
    draw();
  }
})();
