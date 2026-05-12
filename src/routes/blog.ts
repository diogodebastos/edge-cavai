import type { Context } from "hono";
import type { Env } from "../types";
import { layout, siteNav, detailPageShell } from "../lib/html";

import posts from "../content/blog/index";

function getPostList() {
  return Object.entries(posts)
    .map(([slug, p]) => ({ slug, title: p.title, excerpt: p.excerpt, minutes: p.minutes }))
    .sort((a, b) => {
      const na = Number((a.slug.match(/\d+$/) || [0])[0]);
      const nb = Number((b.slug.match(/\d+$/) || [0])[0]);
      return nb - na;
    });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function blogListHandler(c: Context<Env>) {
  const list = getPostList();
  const cards = list.length
    ? list
        .map(
          (p, i) => {
            const num = Number((p.slug.match(/\d+$/) || [0])[0]);
            const featured = i === 0 ? ' featured' : '';
            return `<a href="/blog/${p.slug}" class="card blog-card${featured}">
      <div class="blog-card-body">
        <span class="card-number">#${num}</span>
        <h2>${escapeHtml(p.title)}</h2>
        ${p.excerpt ? `<p class="blog-card-excerpt">${escapeHtml(p.excerpt)}</p>` : ""}
      </div>
      <div class="card-footer">
        <p class="card-footer-label"><span>${p.minutes} min read</span></p>
        <span class="card-footer-arrow" aria-hidden="true">&#x203A;</span>
      </div>
    </a>`;
          },
        )
        .join("\n    ")
    : "<p>No posts yet.</p>";

  const body = `
${siteNav("blog")}
<div class="grid-page">
    <header class="grid-page-header">
      <h1>Blog</h1>
      <p class="subtitle">Thoughts, experiments, and project write-ups.</p>
    </header>
    <div class="card-grid" data-stagger>
    ${cards}
    </div>
</div>`;

  return c.html(
    layout(body, {
      title: "db-blog",
      css: ["/css/shared.css", "/css/card-grid.css", "/css/blog.css"],
      js: ["/js/theme.js"],
      inlineScript: `if (typeof initTheme === 'function') initTheme('theme-toggle');`,
    }),
  );
}

export function blogDetailHandler(c: Context<Env>) {
  const slug = c.req.param("slug") ?? "";
  const post = posts[slug];

  if (!post) {
    return c.html(
      layout("<p>Blog post not found.</p>", {
        title: "db-blog",
        css: ["/css/shared.css", "/css/detail-layout.css", "/css/blog.css"],
      }),
      404,
    );
  }

  const body = detailPageShell({
    navPage: "blog",
    tocId: "blog-toc",
    contentId: "blog-content",
    contentHtml: post.html,
    sidebarActions: `<a href="/blog" class="detail-action-btn">&larr; All Posts</a>`,
    sidebarMeta: `${post.minutes} min read`,
  });

  return c.html(
    layout(body, {
      title: "db-blog",
      css: ["/css/shared.css", "/css/detail-layout.css", "/css/blog.css"],
      js: ["/js/toc.js", "/js/theme.js"],
      inlineScript: `
        if (typeof buildToc === 'function') buildToc('blog-content', 'blog-toc');
        if (typeof initTheme === 'function') initTheme('theme-toggle');
        if (typeof initScrollProgress === 'function') initScrollProgress('scroll-progress-bar');
      `,
    }),
  );
}
