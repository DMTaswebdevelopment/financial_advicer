import { OpenAIEmbeddings } from "@langchain/openai";

// Initialize OpenAI embeddings with text-embedding-3-large model
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  apiKey: process.env.OPENAI_API_KEY!,
  dimensions: 3072,
});

export default embeddings;
