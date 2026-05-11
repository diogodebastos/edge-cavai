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
  const jsScripts = [`<script src="/js/prefetch.js"></script>`, ...(opts.js ?? [])
    .map((src) => `<script src="${src}"></script>`)]
    .join("\n    ");
  const inlineScript = opts.inlineScript
    ? `<script>${opts.inlineScript}</script>`
    : "";
  const htmlClass = opts.bodyClass ? ` ${opts.bodyClass}` : "";

  return `<!DOCTYPE html>
<html lang="en" style="background:#4a1fb8" class="${htmlClass.trim()}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>${title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preload" as="font" href="/fonts/signika-variable.woff2" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/fonts/signika.css">
    ${cssLinks}
    <script>(function(){try{var d=document.documentElement,t=localStorage.getItem('theme');if(t==='dark'){d.classList.add('dark-theme');}else if(t==='light'){d.classList.remove('dark-theme');}d.style.removeProperty('background');}catch(e){}self.addEventListener('pagereveal',function(e){if(e.viewTransition){d.classList.add('vt-nav');e.viewTransition.finished.then(function(){d.classList.remove('vt-nav');});}});})();</script>
</head>
<body>
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
