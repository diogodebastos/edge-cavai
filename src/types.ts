export type Env = {
  Bindings: {
    OPENAI_API_KEY: string;
    ASSETS: Fetcher;
  };
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  message: string;
  history?: ChatMessage[];
};

export type ChatResponse = {
  response: string;
};

export type BlogPostMeta = {
  title: string;
  slug: string;
};
