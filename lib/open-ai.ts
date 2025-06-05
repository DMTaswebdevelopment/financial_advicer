import { OpenAIEmbeddings } from "@langchain/openai";

// Initialize OpenAI embeddings with text-embedding-3-large model
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY!,
});

export default embeddings;
