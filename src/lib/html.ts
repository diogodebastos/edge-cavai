type LayoutOptions = {
  title?: string;
  css?: string[];
  js?: string[];
  bodyClass?: string;
  inlineScript?: string;
};

const GA_ID = "G-L58TRTVXWP";

export type NavPage = "chat" | "cv" | "blog" | "vibe";

export function siteNav(current: NavPage): string {
  const item = (key: NavPage, href: string, label: string, extraClass = "") => {
    const isCurrent = key === current;
    const cls = ["nav-pill", extraClass, isCurrent ? "is-current" : ""]
      .filter(Boolean)
      .join(" ");
    const aria = isCurrent ? ' aria-current="page"' : "";
    return `<a href="${href}" class="${cls}"${aria}>${label}</a>`;
  };
  return `<div class="site-header-wrap"><header class="site-header"><nav class="nav-pills" aria-label="Primary">
    ${item("chat", "/", "Chat")}
    ${item("cv", "/cv", "CV")}
    ${item("blog", "/blog", "Blog")}
    ${item("vibe", "/vibe-coding", `<span aria-hidden="true">✦</span> vibe-coding`, "nav-pill-quiet")}
    <button class="theme-toggle-button" id="theme-toggle" aria-label="Switch theme" type="button">&#9728;&#65038;</button>
  </nav></header></div>`;
}

export function layout(body: string, opts: LayoutOptions = {}): string {
  const title = opts.title ?? "db";
  const cssLinks = (opts.css ?? [])
    .map((href) => `<link rel="stylesheet" href="${href}">`)
    .join("\n    ");
  const jsScripts = (opts.js ?? [])
    .map((src) => `<script src="${src}"></script>`)
    .join("\n    ");
  const inlineScript = opts.inlineScript
    ? `<script>${opts.inlineScript}</script>`
    : "";
  const bodyClass = opts.bodyClass ? ` class="${opts.bodyClass}"` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>${title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Signika:wght@400;600;700&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Signika:wght@400;600;700&display=swap" rel="stylesheet">
    ${cssLinks}
    <script>(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.dataset.theme='dark';else if(t==='light')document.documentElement.dataset.theme='light';}catch(e){}document.addEventListener('DOMContentLoaded',function(){var t=document.documentElement.dataset.theme;if(t==='dark')document.body.classList.add('dark-theme');else if(t==='light')document.body.classList.remove('dark-theme');});})();</script>
</head>
<body${bodyClass}>
    ${body}
    ${jsScripts}
    ${inlineScript}
    <script>
      (function(){
        function loadGA(){
          if (window.__ga_loaded) return; window.__ga_loaded = true;
          var s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
          document.head.appendChild(s);
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        }
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadGA, { timeout: 4000 });
        } else {
          setTimeout(loadGA, 2500);
        }
      })();
    </script>
</body>
</html>`;
}
