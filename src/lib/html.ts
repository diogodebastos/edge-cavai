type LayoutOptions = {
  title?: string;
  css?: string[];
  js?: string[];
  bodyClass?: string;
  inlineScript?: string;
};

const GA_ID = "G-L58TRTVXWP";

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
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Signika:wght@400;600&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Signika:wght@400;600&display=swap" rel="stylesheet">
    ${cssLinks}
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
