#!/usr/bin/env node
/* Pre-renders the CV to a static PDF served from ./public.
 *
 * Why a build artifact rather than window.print(): the print dialog gives no
 * control over the saved filename — document.title is a hint that Chrome
 * honours, Safari and Firefox treat differently, and the user can override.
 * Serving a real file lets the anchor's download attribute pin the name.
 *
 * Pagination comes from the very same @media print block in public/css/cv.css
 * that Ctrl-P uses, so the two stay in agreement.
 */
import fs from "fs";
import path from "path";
import http from "http";
import { spawn } from "child_process";
import os from "os";
import { marked } from "marked";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const CV_MD = path.join(ROOT, "src", "content", "cv.md");
/* Keep in sync with src/lib/cv-pdf.ts */
const OUT_FILE = path.join(PUBLIC_DIR, "diogo-de-bastos-cv.pdf");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function findChrome() {
  return CHROME_CANDIDATES.find((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  });
}

/* The print stylesheet hides the nav, sidebar and TOC, so the PDF only needs
   the content well inside .detail-layout. Everything else is styling context:
   load the same stylesheets the live page loads, in the same order. */
function buildPage(cvHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Diogo de Bastos - CV</title>
<link rel="stylesheet" href="/fonts/signika.css">
<link rel="stylesheet" href="/css/shared.css">
<link rel="stylesheet" href="/css/detail-layout.css">
<link rel="stylesheet" href="/css/cv.css">
</head>
<body>
<div class="detail-layout">
  <div class="detail-main" id="cv-content">${cvHtml}</div>
</div>
<script src="/js/cv-sections.js"></script>
<script>wrapCvSubsections('cv-content');</script>
</body>
</html>`;
}

const MIME = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function serve(pageHtml) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/" || url.pathname === "/cv") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(pageHtml);
      return;
    }
    // Serve ./public, refusing anything that escapes it.
    const filePath = path.join(PUBLIC_DIR, path.normalize(url.pathname));
    if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Chrome 151 writes the PDF and then keeps running when given its own
   --user-data-dir (it exits promptly on the default profile, but that would
   collide with a Chrome the user already has open). So don't wait on exit —
   wait for the output file to stop growing, then shut Chrome down. */
async function runChrome(chrome, url, outFile) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cv-pdf-"));
  fs.rmSync(outFile, { force: true });

  const proc = spawn(chrome, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--user-data-dir=${userDataDir}`,
    // Let the stylesheets, webfont and the section-wrapping script settle.
    "--virtual-time-budget=10000",
    `--print-to-pdf=${outFile}`,
    url,
  ], { stdio: ["ignore", "ignore", "pipe"] });

  let stderr = "";
  proc.stderr.on("data", (d) => { stderr += d; });
  let exited = null;
  proc.on("close", (code) => { exited = code; });
  proc.on("error", (err) => { exited = -1; stderr += err.message; });

  const deadline = Date.now() + 60_000;
  let lastSize = -1;
  let settled = false;
  try {
    while (Date.now() < deadline) {
      await sleep(400);
      const size = fs.existsSync(outFile) ? fs.statSync(outFile).size : -1;
      // Two identical non-zero readings means the write is done.
      if (size > 0 && size === lastSize) { settled = true; break; }
      lastSize = size;
      if (exited !== null && exited !== 0 && size <= 0) {
        throw new Error(`Chrome exited ${exited}\n${stderr}`);
      }
    }
    if (!settled) throw new Error(`Timed out waiting for ${path.basename(outFile)}\n${stderr}`);
  } finally {
    if (exited === null) {
      proc.kill("SIGTERM");
      await sleep(500);
      if (exited === null) proc.kill("SIGKILL");
    }
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

const chrome = findChrome();
if (!chrome) {
  const msg =
    "CV PDF: no Chrome/Chromium found. Set CHROME_PATH to build it.";
  if (fs.existsSync(OUT_FILE)) {
    console.warn(`${msg} Keeping the existing ${path.basename(OUT_FILE)}.`);
    process.exit(0);
  }
  console.error(`${msg} The CV download link would 404, so failing the build.`);
  process.exit(1);
}

/* Chrome stamps the wall clock into /CreationDate, so two builds of identical
   content differ byte-for-byte and the committed PDF churns on every deploy.
   Re-stamp it with cv.md's own mtime: same length, so the xref offsets stay
   valid, and the file now only changes when the CV actually changes. */
function pinCreationDate(file, date) {
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const stamp =
    `D:${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}+00'00'`;
  const buf = fs.readFileSync(file);
  const patched = buf
    .toString("latin1")
    .replace(/D:\d{14}\+00'00'/g, stamp);
  fs.writeFileSync(file, Buffer.from(patched, "latin1"));
}

const cvHtml = marked.parse(fs.readFileSync(CV_MD, "utf8"), { async: false });
const { server, port } = await serve(buildPage(cvHtml));
try {
  await runChrome(chrome, `http://127.0.0.1:${port}/cv`, OUT_FILE);
  pinCreationDate(OUT_FILE, fs.statSync(CV_MD).mtime);
  const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)} (${kb} KB)`);
} finally {
  // Chrome leaves keep-alive sockets behind; close() alone would hang the build.
  server.closeAllConnections();
  server.close();
}
