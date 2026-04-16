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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Signika:wght@400;600;700&display=swap" rel="stylesheet">
    ${cssLinks}
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    </script>
</head>
<body${bodyClass}>
    ${body}
    ${jsScripts}
    ${inlineScript}
</body>
</html>`;
}
