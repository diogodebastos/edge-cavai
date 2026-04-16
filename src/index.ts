import { Hono } from "hono";
import type { Env } from "./types";
import { chatHandler } from "./routes/chat";
import { cvHandler } from "./routes/cv";
import { blogListHandler, blogDetailHandler } from "./routes/blog";

const app = new Hono<Env>();

app.post("/api/chat", chatHandler);
app.get("/cv", cvHandler);
app.get("/blog", blogListHandler);
app.get("/blog/:slug", blogDetailHandler);

// Everything else falls through to static assets (public/)
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
