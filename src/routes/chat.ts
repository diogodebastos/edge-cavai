import type { Context } from "hono";
import type { ChatMessage, ChatRequest, Env } from "../types";
import { chatCompletion } from "../lib/openai";
import cvMd from "../content/cv.md";

const MAX_HISTORY = 16;

const SYSTEM_MESSAGE: ChatMessage = {
  role: "system",
  content: `You are CV Assistant. Answer only using the provided CV content for Diogo. Audience is hiring managers for research or data science roles.

Style and constraints:
- Be concise and factual. Prefer one to three short sentences.
- When asked for a summary, use one crisp sentence.
- Use plain text with line breaks and hyphen bullets; no tables or code blocks.
- If asked for the CV or a download link, reply: "Check his CV at https://diogodebastos.vercel.app/cv ".`,
};

const CV_CONTEXT: ChatMessage = {
  role: "user",
  content: `Context: Diogo's CV in Markdown below. Use only this as your source.\n\n${cvMd}`,
};

export async function chatHandler(c: Context<Env>) {
  const body = await c.req.json<ChatRequest>();
  const { message, history } = body;

  if (!message || typeof message !== "string") {
    return c.json({ error: "message is required" }, 400);
  }

  const trimmed = (history ?? [])
    .filter(
      (m): m is ChatMessage =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-MAX_HISTORY);

  const messages: ChatMessage[] = [
    SYSTEM_MESSAGE,
    CV_CONTEXT,
    ...trimmed,
    { role: "user", content: message },
  ];

  try {
    const response = await chatCompletion(c.env.OPENAI_API_KEY, messages);
    return c.json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: msg }, 502);
  }
}
