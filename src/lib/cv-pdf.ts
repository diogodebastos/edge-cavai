/* Single source of truth for the prebuilt CV PDF.
   Mirrored in src/lib/generate-cv-pdf.mjs, which writes the file. */

/** Path of the static asset served from ./public. */
export const CV_PDF_PATH = "/diogo-de-bastos-cv.pdf";

/** Name the browser saves it as, via the anchor's download attribute. */
export const CV_PDF_FILENAME = "Diogo de Bastos - CV.pdf";
