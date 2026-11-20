const header = document.querySelector('.home-header');

if (header) {
  function updateHeaderHeight() {
    document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  }

  updateHeaderHeight();
  new ResizeObserver(updateHeaderHeight).observe(header);
}
