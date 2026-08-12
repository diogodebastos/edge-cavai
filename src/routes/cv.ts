import type { Context } from "hono";
import type { Env } from "../types";
import cvHtml from "../content/cv-html";
import { layout, detailPageShell } from "../lib/html";

export function cvHandler(c: Context<Env>) {

  const body = detailPageShell({
    navPage: "cv",
    tocId: "cv-toc",
    contentId: "cv-content",
    contentHtml: cvHtml,
    sidebarActions: `<button class="detail-action-btn" id="download-pdf">Save as PDF</button>`,
  });

  return c.html(
    layout(body, {
      title: "db-cv",
      css: ["/css/shared.css", "/css/detail-layout.css", "/css/cv.css"],
      js: ["/js/toc.js", "/js/theme.js"],
      inlineScript: `
        // PDF export via the browser's own print engine: real text, real links,
        // and native pagination (see the @media print block in cv.css).
        document.getElementById('download-pdf').addEventListener('click', function() {
          window.print();
        });

        // Chrome/Safari seed the "Save as PDF" filename from document.title.
        var pageTitle = document.title;
        window.addEventListener('beforeprint', function() { document.title = 'Diogo de Bastos CV'; });
        window.addEventListener('afterprint', function() { document.title = pageTitle; });

        // Wrap sections so each role stays a visually grouped block
        var cvContent = document.getElementById('cv-content');
        if (cvContent) {
          var headings = Array.from(cvContent.querySelectorAll('h3'));
          headings.forEach(function(heading) {
            if (heading.closest('.cv-subsection')) return;
            var wrapper = document.createElement('div');
            wrapper.classList.add('cv-subsection');
            heading.parentNode.insertBefore(wrapper, heading);
            wrapper.appendChild(heading);
            var next = wrapper.nextElementSibling;
            while (next && next.tagName !== 'H2' && next.tagName !== 'H3') {
              var toMove = next;
              next = toMove.nextElementSibling;
              wrapper.appendChild(toMove);
            }
          });
        }

        // Init TOC and theme for cv-content
        if (typeof buildToc === 'function') buildToc('cv-content', 'cv-toc');
        if (typeof initTheme === 'function') initTheme('theme-toggle');
        if (typeof initScrollProgress === 'function') initScrollProgress('scroll-progress-bar');
      `,
    }),
  );
}
