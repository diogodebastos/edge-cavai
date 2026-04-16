# edge-cavai

CV chatbot and portfolio site running on Cloudflare Workers. Talk to Diogo's CV, browse blog posts, download a PDF — all from the edge.

Ported from a Django/Vercel stack to a lightweight Hono + TypeScript worker with two runtime dependencies.

## Stack

- **Runtime:** Cloudflare Workers
- **Framework:** [Hono](https://hono.dev) (~14KB)
- **Markdown:** [marked](https://marked.js.org) (~40KB)
- **LLM:** OpenAI `gpt-4o-mini` via raw `fetch` (no SDK)
- **Static assets:** Cloudflare Workers Assets
- **Language:** TypeScript (strict mode)

## Routes

| Route | Description |
|---|---|
| `GET /` | Chat UI — ask questions about the CV |
| `POST /api/chat` | Chat API — stateless, client sends history |
| `GET /cv` | CV page with sidebar TOC, dark mode, PDF download |
| `GET /blog` | Blog post listing |
| `GET /blog/:slug` | Blog post detail with TOC and dark mode |
| `GET /vibe-coding` | Project showcase |

## Local development

```bash
# Install dependencies
npm install

# Set your OpenAI API key for local dev
echo "OPENAI_API_KEY=sk-..." > .dev.vars

# Start dev server
npm run dev
```

## Deploy

```bash
# Set the secret (one-time)
wrangler secret put OPENAI_API_KEY

# Ship it
npm run deploy
```

## Project structure

```
src/
  index.ts              Entry point — route definitions
  types.ts              Shared TypeScript types
  routes/
    chat.ts             POST /api/chat
    cv.ts               GET /cv
    blog.ts             GET /blog, GET /blog/:slug
  lib/
    openai.ts           Typed fetch wrapper for OpenAI
    markdown.ts         Markdown-to-HTML rendering
    html.ts             HTML layout helper
  content/
    cv.md               CV in Markdown
    blog/               Blog posts in Markdown
public/
  index.html            Chat UI
  vibe-coding.html      Project showcase
  css/                  Stylesheets (shared, chat, cv, blog)
  js/                   Client-side scripts (chat, TOC, theme)
  images/               Blog post images
```

## License

MIT
