import { Hono } from "hono";
import type { Env } from "./types";
import { chatHandler } from "./routes/chat";
import { cvHandler } from "./routes/cv";
import { blogListHandler, blogDetailHandler } from "./routes/blog";
import { vibeHandler } from "./routes/vibe";

const app = new Hono<Env>();

/* diogodebastos.com is the canonical host; aliases get a permanent redirect.
   Only GET/HEAD move: a chat page still open on an old host keeps POSTing. */
const CANONICAL_HOST = "diogodebastos.com";
const REDIRECT_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (REDIRECT_HOSTS.has(url.hostname) && (c.req.method === "GET" || c.req.method === "HEAD")) {
    return c.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
  }
  await next();
});

app.post("/api/chat", chatHandler);
app.get("/cv", cvHandler);
app.get("/blog", blogListHandler);
app.get("/blog/:slug", blogDetailHandler);
app.get("/vibe-coding", vibeHandler);

// Everything else falls through to static assets (public/)
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
