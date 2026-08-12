import type { Context } from "hono";
import type { Env } from "../types";
import cvHtml from "../content/cv-html";
import { layout, detailPageShell } from "../lib/html";
import { CV_PDF_PATH, CV_PDF_FILENAME } from "../lib/cv-pdf";

export function cvHandler(c: Context<Env>) {

  const body = detailPageShell({
    navPage: "cv",
    tocId: "cv-toc",
    contentId: "cv-content",
    contentHtml: cvHtml,
    // Static asset built by src/lib/generate-cv-pdf.mjs on predeploy. The
    // download attribute pins the saved filename, which the print dialog
    // could never guarantee.
    sidebarActions: `<a class="detail-action-btn" href="${CV_PDF_PATH}" download="${CV_PDF_FILENAME}">Download CV</a>`,
  });

  return c.html(
    layout(body, {
      title: "db-cv",
      css: ["/css/shared.css", "/css/detail-layout.css", "/css/cv.css"],
      js: ["/js/cv-sections.js", "/js/toc.js", "/js/theme.js"],
      inlineScript: `
        // Group each role into a .cv-subsection block. Shared with the PDF
        // pre-render so the page and the PDF stay structurally identical.
        if (typeof wrapCvSubsections === 'function') wrapCvSubsections('cv-content');

        // Ctrl/Cmd-P still works and is styled by the @media print block in
        // cv.css, but the button hands over the prebuilt file instead.

        // Init TOC and theme for cv-content
        if (typeof buildToc === 'function') buildToc('cv-content', 'cv-toc');
        if (typeof initTheme === 'function') initTheme('theme-toggle');
        if (typeof initScrollProgress === 'function') initScrollProgress('scroll-progress-bar');
      `,
    }),
  );
}
