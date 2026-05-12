import type { Context } from "hono";
import type { Env } from "../types";
import { layout, siteNav } from "../lib/html";

type VibeProject = {
  title: string;
  url: string;
  featured?: boolean;
  placeholder?: boolean;
};

const projects: VibeProject[] = [
  { title: "Velvet Blum",           url: "https://velvet-blum.pages.dev/",                                       featured: true },
  { title: "AI Bot Activity",       url: "https://cf-ai-bot-globe.pages.dev/" },
  { title: "LLM Circuits",          url: "https://llm-circuits.diogobastos.workers.dev/" },
  { title: "PKMN RomHack",          url: "https://pokemon-emerald-legacy-solo-leveling-colosseum.pages.dev/" },
  { title: "Claude Takes Control",  url: "https://cf-cl-lin-2.diogobastos.workers.dev/" },
  { title: "Super Position Terrain", url: "https://super-position-grid.diogobastos.workers.dev/" },
  { title: "EuroSweeper",           url: "https://eurosweeper.diogobastos.workers.dev/" },
  { title: "Glow Pong",             url: "https://glow-pong.diogobastos.workers.dev/" },
  { title: "coming soon\u2026",     url: "",                                                                     placeholder: true },
];

function renderCard(p: VibeProject, num: number): string {
  const featuredClass = p.featured ? " featured" : "";

  if (p.placeholder) {
    return `<div class="card vibe-card">
      <h3><i>${p.title}</i></h3>
      <div class="preview-frame placeholder">
        <span class="placeholder-emoji">✦</span>
      </div>
      <div class="card-footer">
        <span class="card-footer-label">Stay tuned</span>
        <span class="card-footer-arrow" aria-hidden="true" style="opacity:0.3">&#x203A;</span>
      </div>
    </div>`;
  }

  return `<div class="card vibe-card${featuredClass}">
      <h3>
        <a href="${p.url}" target="_blank" rel="noopener">${p.title}</a>
        <span class="card-number">#${num}</span>
      </h3>
      <div class="preview-frame">
        <iframe data-src="${p.url}" loading="lazy" title="${p.title}"></iframe>
      </div>
      <div class="card-footer">
        <span class="card-footer-label">Live preview</span>
        <a href="${p.url}" target="_blank" rel="noopener" class="card-footer-arrow" aria-label="Visit ${p.title}">&#x203A;</a>
      </div>
    </div>`;
}

export function vibeHandler(c: Context<Env>) {
  const total = projects.filter((p) => !p.placeholder).length;
  const cards = projects.map((p, i) => renderCard(p, total - i)).join("\n    ");

  const body = `
${siteNav("vibe")}
<div class="grid-page">
  <section class="grid-page-header">
    <h1>Builds &amp; experiments</h1>
    <p>Small things made fast — playgrounds, RomHacks, oddball UIs. Click a tile to open the live version.</p>
  </section>

  <div class="card-grid" data-stagger>
    ${cards}
  </div>
</div>`;

  return c.html(
    layout(body, {
      title: "db-vibes",
      css: ["/css/shared.css", "/css/card-grid.css", "/css/vibe.css"],
      js: ["/js/theme.js"],
      inlineScript: `
        if (typeof initTheme === 'function') initTheme('theme-toggle');

        (function(){
          document.querySelectorAll('.preview-frame').forEach(function(frame){
            if (frame.classList.contains('placeholder')) return;
            var shimmer = document.createElement('div');
            shimmer.className = 'loading-shimmer';
            frame.appendChild(shimmer);
          });

          var queue = [];
          var inflight = 0;
          var MAX_PARALLEL = 2;

          function pump(){
            while (inflight < MAX_PARALLEL && queue.length){
              var f = queue.shift();
              inflight++;
              f.addEventListener('load', function(){
                inflight--;
                this.classList.add('is-loaded');
                var sh = this.parentNode && this.parentNode.querySelector('.loading-shimmer');
                if (sh) sh.classList.add('is-hidden');
                pump();
              }, { once: true });
              f.src = f.getAttribute('data-src');
              f.removeAttribute('data-src');
            }
          }

          var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
              if (!e.isIntersecting) return;
              var f = e.target;
              if (f.hasAttribute('data-src')) { queue.push(f); pump(); }
              io.unobserve(f);
            });
          }, { rootMargin: '100px 0px' });
          document.querySelectorAll('iframe[data-src]').forEach(function(f){ io.observe(f); });
        })();
      `,
    }),
  );
}
