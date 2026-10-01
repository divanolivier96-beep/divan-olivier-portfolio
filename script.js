/* Divan Olivier — cursor spotlight for the animated background typography.
   A duplicate type layer follows the same animation, but is only visible
   in a soft circle around the pointer. */
(() => {
  const base = document.querySelector('.background-type');
  if (!base || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const spot = base.cloneNode(true);
  spot.classList.add('spot');
  spot.setAttribute('aria-hidden', 'true');
  base.parentNode.insertBefore(spot, base.nextSibling);

  const setSpot = (x, y) => {
    spot.style.setProperty('--mx', x + 'px');
    spot.style.setProperty('--my', y + 'px');
    spot.style.setProperty('--r', '145px');
  };

  const reset = () => {
    spot.style.setProperty('--mx', '-999px');
    spot.style.setProperty('--my', '-999px');
  };

  addEventListener('pointermove', e => setSpot(e.clientX, e.clientY), {passive:true});
  addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (t) setSpot(t.clientX, t.clientY);
  }, {passive:true});
  addEventListener('pointerleave', reset, {passive:true});
  addEventListener('touchend', reset, {passive:true});
  reset();
})();