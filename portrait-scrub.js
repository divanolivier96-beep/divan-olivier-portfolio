/* Divan Olivier — photo portrait that looks at the cursor.
   divan-look-x.webp: head turning left <-> right.  divan-look-y.webp: head tilting up <-> down.
   The cursor's horizontal position picks a frame from the first sheet and its vertical position
   picks one from the second; the two are dissolved into each other where they meet. */
(() => {
  const img0 = document.querySelector('img[alt="Portrait of Divan Olivier"]');
  if (!img0) return;
  const FW = 496, FH = 620;                                   // size of one frame in the sheets
  const X = { src: 'divan-look-x.webp', n: 43, c: 21, cols: 7 };   // c = the straight-ahead frame
  const Y = { src: 'divan-look-y.webp', n: 29, c: 11, cols: 6 };
  const HEAD = [0.5, 0.34];                                   // face centre, as a fraction of the picture
  const GAIN = 1.2;                                           // >1: full turn is reached just before the screen edge
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

  Promise.all([load(X.src), load(Y.src)]).then(([ix_, iy_]) => {
    X.img = ix_; Y.img = iy_;
    const st = document.createElement('style');
    st.textContent = '.portrait canvas.hero-portrait{display:block;width:100%;height:auto;' +
      'filter:grayscale(100%) contrast(105%);user-select:none;pointer-events:none}';
    document.head.appendChild(st);

    const cv = document.createElement('canvas');
    cv.width = FW; cv.height = FH; cv.className = 'hero-portrait';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', img0.alt);
    img0.replaceWith(cv);
    const wrap = cv.closest('.portrait-wrapper'); if (wrap) wrap.classList.add('scrub');
    const ctx = cv.getContext('2d');

    let u = 0, v = 0, ix = X.c, iy = Y.c, w = 0, mode = 0, scale = 1, last = '';
    const clamp = x => Math.max(-1, Math.min(1, x));

    function fit() {                                           // draw at the screen's real pixel density
      const px = Math.round(cv.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 3));
      if (!px || px === cv.width) return;
      cv.width = px; cv.height = Math.round(px * FH / FW); scale = cv.width / FW; last = '';
    }
    function aim(px, py) {                                     // each side reaches full range at the screen edge
      const r = cv.getBoundingClientRect();
      const hx = r.left + r.width * HEAD[0], hy = r.top + r.height * HEAD[1];
      const dx = px - hx, dy = py - hy;
      u = clamp(dx / Math.max(1, dx < 0 ? hx : innerWidth - hx));
      v = clamp(dy / Math.max(1, dy < 0 ? hy : innerHeight - hy));
    }
    if (!reduce) {
      addEventListener('pointermove', e => aim(e.clientX, e.clientY), { passive: true });
      addEventListener('touchmove', e => { const t = e.touches[0]; if (t) aim(t.clientX, t.clientY); }, { passive: true });
      const home = () => { u = 0; v = 0; };
      document.documentElement.addEventListener('mouseleave', home);
      addEventListener('touchend', home, { passive: true });
    }

    const frame = (S, i, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(S.img, (i % S.cols) * FW, Math.floor(i / S.cols) * FH, FW, FH, 0, 0, FW, FH);
    };
    const pair = (f, n) => { const i0 = Math.min(n - 1, Math.floor(f)); return { i0, i1: Math.min(n - 1, i0 + 1), a: f - i0 }; };

    function draw() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, FW, FH);
      const pa = pair(ix, X.n), pb = pair(iy, Y.n);
      if (w < 0.999) {                                          // left-right sheet (cross-fades between neighbouring frames)
        frame(X, pa.i0, 1);
        if (pa.a > 0.04 && pa.i1 !== pa.i0) frame(X, pa.i1, pa.a);
      }
      if (w > 0.001) {                                          // up-down sheet, dissolved in by weight w
        const b = pb.a > 0.04 && pb.i1 !== pb.i0 ? pb.a : 0;
        const w1 = w * b, w0 = 1 - (1 - w) / (1 - w1);
        frame(Y, pb.i0, w0);
        if (b) frame(Y, pb.i1, w1);
      }
      ctx.globalAlpha = 1;
    }

    addEventListener('resize', fit);
    fit();
    (function tick() {
      const gx = clamp(u * GAIN), gy = clamp(v * GAIN);
      const tx = Math.round(gx < 0 ? X.c + gx * X.c : X.c + gx * (X.n - 1 - X.c));   // rest on a real frame = sharpest
      const ty = Math.round(gy < 0 ? Y.c + gy * Y.c : Y.c + gy * (Y.n - 1 - Y.c));
      ix += (tx - ix) * 0.14; iy += (ty - iy) * 0.14;
      // one clean photo at a time: left-right leads, and the up-down sheet takes over only when the cursor is
      // clearly more vertical than horizontal. Hysteresis stops it flickering; a short dissolve hides the switch.
      const ax = Math.abs(gx), ay = Math.abs(gy), r = ay / (ax + ay + 1e-6);
      if (ax + ay < 0.06) mode = 0;
      else if (mode === 0 && r > 0.65) mode = 1;
      else if (mode === 1 && r < 0.5) mode = 0;
      w += (mode - w) * 0.35;
      if (Math.abs(mode - w) < 0.01) w = mode;
      const key = ix.toFixed(2) + '|' + iy.toFixed(2) + '|' + w.toFixed(2);
      if (key !== last) { last = key; draw(); }
      requestAnimationFrame(tick);
    })();
    draw();
  }).catch(() => {
    // images missing: keep the static photo
  });
})();
