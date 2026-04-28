/**
 * loader.js — Écran de chargement première visite (style Wildcard)
 * Auto-exécuté à l'import. Utilise sessionStorage pour ne s'afficher
 * qu'une seule fois par session de navigation.
 */
(function () {
  var loader = document.getElementById('siteLoader');
  if (!loader || loader.style.display === 'none') return;

  sessionStorage.setItem('k_loaded', '1');

  var bar = loader.querySelector('.loader__bar');
  if (!bar) return;

  var progress = 0;

  function step() {
    var inc = progress < 55
      ? Math.random() * 10 + 5
      : progress < 80
        ? Math.random() * 5 + 1.5
        : 0.5;
    progress = Math.min(progress + inc, 94);
    bar.style.width = progress + '%';
    if (progress < 94) setTimeout(step, 65);
  }

  step();

  function finish() {
    bar.style.width = '100%';
    setTimeout(function () {
      loader.classList.add('site-loader--hidden');
      setTimeout(function () {
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      }, 700);
    }, 300);
  }

  if (document.readyState === 'complete') {
    finish();
  } else {
    window.addEventListener('load', finish, { once: true });
    // Failsafe
    setTimeout(finish, 5000);
  }
}());
