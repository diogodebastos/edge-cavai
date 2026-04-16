import type { Context } from "hono";
import type { BlogPostMeta, Env } from "../types";
import { renderMarkdown } from "../lib/markdown";
import { layout } from "../lib/html";

import bp1 from "../content/blog/blogpost_1.md";
import bp2 from "../content/blog/blogpost_2.md";

const posts: Record<string, string> = {
  "blogpost-1": bp1,
  "blogpost-2": bp2,
};

function extractTitle(md: string): string {
  for (const line of md.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) return trimmed.slice(2);
  }
  return "Untitled";
}

function getPostList(): BlogPostMeta[] {
  return Object.entries(posts)
    .map(([slug, md]) => ({ title: extractTitle(md), slug }))
    .reverse();
}

export function blogListHandler(c: Context<Env>) {
  const list = getPostList();
  const cards = list.length
    ? list
        .map(
          (p) =>
            `<a href="/blog/${p.slug}" class="blog-card"><h2>${p.title}</h2></a>`,
        )
        .join("\n    ")
    : "<p>No posts yet.</p>";

  const body = `
<div class="blog-list-container">
    <a href="/" class="back-link">&larr; back to chat</a>
    <h1>Blog</h1>
    <p class="subtitle">Thoughts, experiments, and project write-ups.</p>
    ${cards}
</div>`;

  return c.html(
    layout(body, {
      title: "db-blog",
      css: ["/css/shared.css", "/css/blog.css"],
    }),
  );
}

export function blogDetailHandler(c: Context<Env>) {
  const slug = c.req.param("slug") ?? "";
  const md = posts[slug];

  if (!md) {
    return c.html(
      layout("<p>Blog post not found.</p>", {
        title: "db-blog",
        css: ["/css/shared.css", "/css/blog.css"],
      }),
      404,
    );
  }

  const blogHtml = renderMarkdown(md);

  const body = `
<div id="scroll-progress-container">
    <div id="scroll-progress-bar"></div>
</div>
<div class="blog-layout" id="blog-layout">
    <aside class="blog-sidebar">
        <div class="blog-actions">
            <a href="/blog" class="back-blog-button">&larr; All Posts</a>
            <button class="theme-toggle-button" id="theme-toggle" aria-label="Switch to Dark Mode">&#9790;</button>
        </div>
        <nav class="blog-toc" id="blog-toc" aria-label="Table of contents">
            <h2>Contents</h2>
            <ul class="toc-list"></ul>
        </nav>
    </aside>
    <div class="blog-main" id="blog-content">
        ${blogHtml}
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
