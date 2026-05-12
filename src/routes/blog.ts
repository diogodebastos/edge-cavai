import type { Context } from "hono";
import type { Env } from "../types";
import { layout, siteNav } from "../lib/html";

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
            return `<a href="/blog/${p.slug}" class="blog-card${featured}">
      <div class="blog-card-body">
        <span class="blog-card-number">#${num}</span>
        <h2>${escapeHtml(p.title)}</h2>
        ${p.excerpt ? `<p class="blog-card-excerpt">${escapeHtml(p.excerpt)}</p>` : ""}
      </div>
      <div class="blog-card-footer">
        <p class="blog-card-meta"><span>${p.minutes} min read</span></p>
        <span class="blog-card-arrow" aria-hidden="true">&#x203A;</span>
      </div>
    </a>`;
          },
        )
        .join("\n    ")
    : "<p>No posts yet.</p>";

  const body = `
${siteNav("blog")}
<div class="blog-list-container">
    <header class="blog-list-header">
      <h1>Blog</h1>
      <p class="subtitle">Thoughts, experiments, and project write-ups.</p>
    </header>
    <div class="blog-cards" data-stagger>
    ${cards}
    </div>
</div>`;

  return c.html(
    layout(body, {
      title: "db-blog",
      css: ["/css/shared.css", "/css/blog.css"],
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
        css: ["/css/shared.css", "/css/blog.css"],
      }),
      404,
    );
  }

  const body = `
<div id="scroll-progress-container">
    <div id="scroll-progress-bar"></div>
</div>
${siteNav("blog")}
<div class="blog-layout" id="blog-layout">
    <aside class="blog-sidebar">
        <div class="blog-actions">
            <a href="/blog" class="back-blog-button">&larr; All Posts</a>
        </div>
        <nav class="blog-toc" id="blog-toc" aria-label="Table of contents">
            <h2>Contents</h2>
            <ul class="toc-list"></ul>
        </nav>
        <p class="blog-meta-aside">${post.minutes} min read</p>
    </aside>
    <div class="blog-main" id="blog-content">
        ${post.html}
    </div>
</div>`;

  return c.html(
    layout(body, {
      title: "db-blog",
      css: ["/css/shared.css", "/css/blog.css"],
      js: ["/js/toc.js", "/js/theme.js"],
      inlineScript: `
        if (typeof buildToc === 'function') buildToc('blog-content', 'blog-toc');
        if (typeof initTheme === 'function') initTheme('theme-toggle');
        if (typeof initScrollProgress === 'function') initScrollProgress('scroll-progress-bar');
      `,
    }),
  );
}
