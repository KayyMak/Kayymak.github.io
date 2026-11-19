document.querySelectorAll('[data-history-back]').forEach(function (button) {
  button.addEventListener('click', function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = button.dataset.backFallback;
    }
  });
});
