/* gentle parallax: the photograph drifts a few pixels against the cursor */
(() => {
  const img = document.querySelector('.hero-photo');
  if (!img || matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * -14; ty = (e.clientY / innerHeight - .5) * -10; }, { passive: true });
  (function tick() { x += (tx - x) * .06; y += (ty - y) * .06; img.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(1.02)`; requestAnimationFrame(tick); })();
})();
