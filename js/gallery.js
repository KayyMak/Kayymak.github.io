document.querySelectorAll('.photo-gallery').forEach(function (gallery) {
  const track = gallery.querySelector('.gallery-track');
  const slides = Array.from(gallery.querySelectorAll('.gallery-slide'));
  const previous = gallery.querySelector('[data-gallery-prev]');
  const next = gallery.querySelector('[data-gallery-next]');
  const count = gallery.querySelector('[data-gallery-count]');
  let active = 0;
  let scheduled = false;

  function render() {
    count.textContent = (active + 1) + ' / ' + slides.length;
    previous.disabled = active === 0;
    next.disabled = active === slides.length - 1;
  }

  function update() {
    let closest = 0;
    let distance = Infinity;
    slides.forEach(function (slide, index) {
      const left = slide.offsetLeft - slides[0].offsetLeft;
      const difference = Math.abs(track.scrollLeft - left);
      if (difference < distance) {
        distance = difference;
        closest = index;
      }
    });
    active = closest;
    render();
    scheduled = false;
  }

  function move(direction) {
    const index = Math.max(0, Math.min(slides.length - 1, active + direction));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({
      left: slides[index].offsetLeft - slides[0].offsetLeft,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
    active = index;
    render();
  }

  previous.addEventListener('click', function () { move(-1); });
  next.addEventListener('click', function () { move(1); });
  track.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  track.addEventListener('scroll', function () {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
});
