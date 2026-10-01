/* Divan Olivier — video-based portrait. The head turns to look at the cursor.
   Needs divan-body.webp and divan-head-sprite.webp next to index.html.
   Replaces head-tracker.js: remove that script tag and add this one instead. */
(() => {
  const img0 = document.querySelector('img[alt="Portrait of Divan Olivier"]');
  if (!img0) return;
  const BODY = 'divan-body.webp', SPRITE = 'divan-head-sprite.webp';
  const W = 268, HB = 760, HS = 600, COLS = 8, N = 61, CI = 27;       // sheet geometry; CI = looking straight ahead
  const DX = [-0.2, -0.2, -0.2, -0.2, -0.2, 0.0, 0.0, -0.2, -0.2, 0.1, -0.1, 0.1, 0.1, -0.1, -0.3, -0.3, -0.3, -0.3, -0.1, -0.1, -0.2, -0.2, -0.2, -0.2, -0.4, -0.4, -0.1, 0.0, 0.2, 0.4, 0.3, 0.4, 0.6, 0.5, 0.9, 0.9, 1.1, 1.3, 1.3, 1.5, 1.5, 1.6, 1.8, 1.6, 2.0, 2.6, 2.7, 3.0, 3.2, 3.6, 4.0, 3.9, 3.9, 3.9, 3.7, 3.5, 3.5, 3.5, 3.3, 3.2, 3.0];                                                      // per-frame shoulder alignment (px)
  const HEAD = [0.5, 70 / 760];                                          // head centre, as a fraction of the canvas
  const GAIN = 1.2;                                                      // >1: full profile is reached just before the screen edge
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const load = src => new Promise((ok, no) => {
    const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src;
  });

  Promise.all([load(BODY), load(SPRITE)]).then(([body, sprite]) => {
    const st = document.createElement('style');
    st.textContent = '.portrait canvas.hero-portrait{display:block;width:100%;height:auto;' +
      'filter:grayscale(100%) contrast(105%);user-select:none;pointer-events:none}';
    document.head.appendChild(st);

    const cv = document.createElement('canvas');
    cv.width = W; cv.height = HB; cv.className = 'hero-portrait';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', img0.alt);
    img0.replaceWith(cv);
    const wrap = cv.closest('.portrait-wrapper'); if (wrap) wrap.classList.add('scrub');
    const ctx = cv.getContext('2d');

    let u = 0, v = 0, idx = CI, vy = 0, last = '';
    const clamp = x => Math.max(-1, Math.min(1, x));

    function aim(px, py) {                       // each side reaches full range at the screen edge
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

    const frame = (i, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, (i % COLS) * W, Math.floor(i / COLS) * HS, W, HS, DX[i], vy, W, HS);
    };
    function draw() {
      ctx.clearRect(0, 0, W, HB);
      ctx.globalAlpha = 1; ctx.drawImage(body, 0, 0);
      const i0 = Math.min(N - 1, Math.floor(idx)), a = idx - i0, i1 = Math.min(N - 1, i0 + 1);
      frame(i0, 1);
      if (a > 0.01 && i1 !== i0) frame(i1, a);   // cross-fade between neighbouring video frames
      ctx.globalAlpha = 1;
    }
    (function tick() {
      const g = clamp(u * GAIN);
      const target = g < 0 ? CI + g * CI : CI + g * (N - 1 - CI);
      idx += (target - idx) * 0.14;
      vy += (v * 2 - vy) * 0.14;
      const key = idx.toFixed(2) + vy.toFixed(2);
      if (key !== last) { last = key; draw(); }
      requestAnimationFrame(tick);
    })();
    draw();
  }).catch(() => {
    // assets missing: keep the static photo and fall back to the older tracker if it is present
    const s = document.createElement('script'); s.src = 'head-tracker.js'; document.body.appendChild(s);
  });
})();
