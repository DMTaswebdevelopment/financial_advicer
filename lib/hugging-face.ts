import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);
const HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: HF_EMBEDDING_MODEL,
    inputs: text,
  });

  // `result` is typically a 2D array [[...embedding]]
  // So flatten if needed:
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as number[];
  }

  return result as number[];
}

export default generateEmbedding;
