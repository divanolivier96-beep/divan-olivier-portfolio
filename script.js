/* render the hero photo through a canvas so browser Content Credentials overlays do not attach to the image element */
(() => {
  const canvas = document.querySelector('.hero-photo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const photo = new Image();

  const draw = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !photo.naturalWidth || !photo.naturalHeight) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const scale = Math.max(rect.width / photo.naturalWidth, rect.height / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    const x = (rect.width - w) / 2;
    const y = (rect.height - h) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.drawImage(photo, x, y, w, h);
  };

  fetch('hero.webp', { cache: 'force-cache' })
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob))
    .then(bitmap => {
      photo.src = URL.createObjectURL(blob);
      photo.onload = draw;
      photo.src = URL.createObjectURL(blob);
      draw();
      if (bitmap.close) bitmap.close();
    })
    .catch(() => {
      photo.src = 'hero.webp';
      photo.onload = draw;
    });

  addEventListener('resize', draw, { passive: true });
  new ResizeObserver(draw).observe(canvas);
})();

/* gentle parallax: the photograph drifts a few pixels against the cursor */
(() => {
  const canvas = document.querySelector('.hero-photo');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('pointermove', e => {
    tx = (e.clientX / innerWidth - .5) * -14;
    ty = (e.clientY / innerHeight - .5) * -10;
  }, { passive: true });
  (function tick() {
    x += (tx - x) * .06;
    y += (ty - y) * .06;
    canvas.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(1.02)`;
    requestAnimationFrame(tick);
  })();
})();
