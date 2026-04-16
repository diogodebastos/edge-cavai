/**
 * Build a table of contents from headings inside a content element.
 * @param {string} contentId - ID of the element containing headings
 * @param {string} tocId - ID of the nav element containing ul.toc-list
 */
function buildToc(contentId, tocId) {
  var content = document.getElementById(contentId);
  var tocNav = document.getElementById(tocId);
  var tocList = tocNav ? tocNav.querySelector('.toc-list') : null;
  if (!content || !tocList) return;

  var headings = content.querySelectorAll('h1, h2, h3');
  var slugCounts = {};

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
    var link = document.createElement('a');
    link.href = '#' + slug;
    link.textContent = text;
    item.appendChild(link);
    tocList.appendChild(item);
  });

  if (!tocList.children.length) {
    tocNav.style.display = 'none';
  } else {
    tocNav.addEventListener('click', function (event) {
      if (event.target instanceof HTMLAnchorElement) {
        event.preventDefault();
        var targetId = event.target.getAttribute('href').slice(1);
        var target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}
