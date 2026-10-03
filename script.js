/* render the hero photo through a canvas so browser Content Credentials overlays do not attach to the image element */
(() => {
  const canvas = document.querySelector('.hero-photo');
  const hero = document.querySelector('.hero');
  const lens = document.querySelector('.difference-lens');
  const headline = document.querySelector('.headline-reveal');
  const hiddenPhrase = document.querySelector('.hidden-phrase');
  if (!canvas) return;

  if (hero && lens && window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.addEventListener('pointermove', event => {
      lens.style.left = event.clientX + 'px';
      lens.style.top = event.clientY + 'px';

      if (headline && hiddenPhrase) {
        const rect = headline.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const radius = Math.max(55, Math.min(110, rect.width * 0.12));
        hiddenPhrase.style.clipPath = 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)';
        hiddenPhrase.style.webkitClipPath = 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)';
      }
    });
    hero.addEventListener('pointerenter', event => {
      lens.style.left = event.clientX + 'px';
      lens.style.top = event.clientY + 'px';
    });
    hero.addEventListener('pointerleave', () => {
      if (hiddenPhrase) {
        hiddenPhrase.style.clipPath = 'circle(0px at 50% 50%)';
        hiddenPhrase.style.webkitClipPath = 'circle(0px at 50% 50%)';
      }
    });
  }
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
    .then(blob => {
      const url = URL.createObjectURL(blob);
      photo.onload = () => {
        draw();
        URL.revokeObjectURL(url);
      };
      photo.src = url;
    })
    .catch(() => {
      photo.src = 'hero.webp';
      photo.onload = draw;
    });

})();
