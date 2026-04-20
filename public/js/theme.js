/**
 * Initialize dark/light theme toggle.
 * @param {string} buttonId - ID of the toggle button
 */
function initTheme(buttonId) {
  var button = document.getElementById(buttonId);
  if (!button) return;

  // Use the same emoji entities as existing code
  var sunHtml = '&#9728;&#65038;';
  var moonHtml = '&#9790;';

  function updateButton() {
    if (document.body.classList.contains('dark-theme')) {
      button.innerHTML = sunHtml;
      button.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      button.innerHTML = moonHtml;
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
