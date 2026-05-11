// Prefetch nav links on hover/touchstart so the next page loads instantly.
(function () {
  var fetched = {};
  function prefetch(href) {
    if (fetched[href]) return;
    fetched[href] = true;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
  document.addEventListener('pointerenter', function (e) {
    var a = e.target.closest && e.target.closest('a.nav-pill[href]');
    var raw = a && a.getAttribute('href');
    if (raw && !raw.startsWith('http')) prefetch(raw);
  }, true);
})();
