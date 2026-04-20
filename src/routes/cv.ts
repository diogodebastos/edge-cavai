import type { Context } from "hono";
import type { Env } from "../types";
import cvMd from "../content/cv.md";
import { renderMarkdown } from "../lib/markdown";
import { layout } from "../lib/html";

export function cvHandler(c: Context<Env>) {
  const cvHtml = renderMarkdown(cvMd);

  const body = `
<div id="scroll-progress-container">
    <div id="scroll-progress-bar"></div>
</div>
<div class="cv-layout" id="cv-layout">
    <aside class="cv-sidebar" data-html2canvas-ignore="true">
        <div class="cv-actions">
            <button class="download-pdf-button" id="download-pdf">Download CV</button>
            <button class="theme-toggle-button" id="theme-toggle" aria-label="Switch to Light Mode">&#9728;&#65038;</button>
        </div>
        <nav class="cv-toc" id="cv-toc" aria-label="Table of contents">
            <h2>Contents</h2>
            <ul class="toc-list"></ul>
        </nav>
    </aside>
    <div class="cv-main" id="cv-content">
        ${cvHtml}
    </div>
</div>`;

  return c.html(
    layout(body, {
      title: "db-cv",
      css: ["/css/shared.css", "/css/cv.css"],
      bodyClass: "dark-theme",
      js: [
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
        "/js/toc.js",
        "/js/theme.js",
      ],
      inlineScript: `
        // PDF download
        document.getElementById('download-pdf').addEventListener('click', function() {
          var el = document.getElementById('cv-content');
          html2pdf().set({
            margin: 0.5,
            filename: 'diogo_de_bastos_cv.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: {
              mode: ['css', 'legacy'],
              avoid: '#cv-content h1, #cv-content h2, #cv-content h3, #cv-content h4, #cv-content h5, #cv-content h6, #cv-content p, #cv-content ul, #cv-content ol, #cv-content li, #cv-content blockquote, .cv-subsection'
            }
          }).from(el).save();
        });

        // Wrap sections for PDF grouping
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
