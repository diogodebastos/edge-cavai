/**
 * Initialize dark/light theme toggle.
 * @param {string} buttonId - ID of the toggle button
 */
function initTheme(buttonId) {
  var button = document.getElementById(buttonId);
  if (!button) return;

  var sunSvg = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<circle cx="12" cy="12" r="4.2"/>'
    + '<line x1="12" y1="2.5" x2="12" y2="5"/>'
    + '<line x1="12" y1="19" x2="12" y2="21.5"/>'
    + '<line x1="2.5" y1="12" x2="5" y2="12"/>'
    + '<line x1="19" y1="12" x2="21.5" y2="12"/>'
    + '<line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/>'
    + '<line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/>'
    + '<line x1="4.9" y1="19.1" x2="6.7" y2="17.3"/>'
    + '<line x1="17.3" y1="6.7" x2="19.1" y2="4.9"/>'
    + '</svg>';
  var moonSvg = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
    + '</svg>';

  function updateButton() {
    if (document.body.classList.contains('dark-theme')) {
      button.innerHTML = sunSvg;
      button.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      button.innerHTML = moonSvg;
      button.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  }

  // Toggle theme and update icon
  button.addEventListener('click', function () {
    document.body.classList.toggle('dark-theme');
    updateButton();
  });

  // Set initial state based on current body class
  updateButton();
}

/**
 * Initialize scroll progress bar.
 * @param {string} barId - ID of the progress bar element
 */
function initScrollProgress(barId) {
  var bar = document.getElementById(barId);
  if (!bar) return;

  window.addEventListener('scroll', function () {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var scrollHeight = doc.scrollHeight - doc.clientHeight;
    var progress = scrollHeight ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = progress + '%';
  });
}
