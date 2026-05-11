/**
 * Measure the sticky nav height and expose it as a CSS variable.
 * Called once on load; sidebar sticky `top` and IO rootMargin use it.
 */
function setStickyNavOffset() {
  var wrap = document.querySelector('.site-header-wrap');
  if (!wrap) return 0;
  var h = wrap.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--nav-h', h + 'px');
  return h;
}

/**
 * Build a table of contents from headings inside a content element.
 * @param {string} contentId - ID of the element containing headings
 * @param {string} tocId - ID of the nav element containing ul.toc-list
 */
function buildToc(contentId, tocId) {
  var navH = setStickyNavOffset();
  var content = document.getElementById(contentId);
  var tocNav = document.getElementById(tocId);
  var tocList = tocNav ? tocNav.querySelector('.toc-list') : null;
  if (!content || !tocList) return;

  var headings = content.querySelectorAll('h1, h2, h3');
  var slugCounts = {};
  var items = [];

  headings.forEach(function (heading, index) {
    var text = heading.textContent.trim();
    if (!text) return;

    var level = heading.tagName.toLowerCase();
    var slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (!slug) slug = 'section-' + (index + 1);

    if (slugCounts[slug]) {
      slugCounts[slug] += 1;
      slug = slug + '-' + slugCounts[slug];
    } else {
      slugCounts[slug] = 1;
    }

    heading.id = slug;

    var item = document.createElement('li');
    item.classList.add('toc-level-' + level);
    item.dataset.slug = slug;
    var link = document.createElement('a');
    link.href = '#' + slug;
    link.textContent = text;
    item.appendChild(link);
    tocList.appendChild(item);
    items.push({ heading: heading, item: item });
  });

  if (!items.length) {
    tocNav.style.display = 'none';
    return;
  }

  tocNav.addEventListener('click', function (event) {
    if (event.target instanceof HTMLAnchorElement) {
      event.preventDefault();
      var targetId = event.target.getAttribute('href').slice(1);
      var target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Scroll-spy via IntersectionObserver
  if (!('IntersectionObserver' in window)) return;

  var lookup = {};
  items.forEach(function (it) { lookup[it.heading.id] = it.item; });
  var visible = new Set();

  function refresh() {
    var firstVisible = null;
    items.forEach(function (it) {
      if (visible.has(it.heading.id) && !firstVisible) firstVisible = it;
    });
    items.forEach(function (it) { it.item.classList.remove('is-active'); });
    if (firstVisible) firstVisible.item.classList.add('is-active');
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    refresh();
  }, { rootMargin: '-' + (navH || 80) + 'px 0px -65% 0px', threshold: 0 });

  items.forEach(function (it) { io.observe(it.heading); });
}
