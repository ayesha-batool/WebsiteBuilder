import OpenAI from 'openai';

/** OpenRouter reserves credits for max_tokens; keep this within your balance. */
export const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 8192;

export const AI_MODEL = process.env.AI_MODEL || "kwaipilot/kat-coder-pro-v2";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY,
 
});
export default openai;