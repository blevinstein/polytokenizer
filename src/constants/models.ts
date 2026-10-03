/**
 * Model constants and configurations
 * 
 * This file contains all model-related constants including context limits,
 * and supported capabilities. Update this file when providers add new models or change specifications.
 * 
 * Sources for model information:
 * - OpenAI: https://developers.openai.com/api/docs/models
 * - Anthropic: https://platform.claude.com/docs/en/about-claude/models/overview
 * - Google Gemini: https://ai.google.dev/gemini-api/docs/models
 * - Vertex AI: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings
 * - Vertex AI: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api
 */

export const CONTEXT_LIMITS = {
  // OpenAI GPT-5.6 series (current)
  'openai/gpt-5.6-sol': 1_050_000,    // Flagship GPT-5.6 model
  'openai/gpt-5.6-terra': 1_050_000,  // Balances intelligence and cost
  'openai/gpt-5.6-luna': 1_050_000,   // Cost-sensitive, high-volume workloads

  // OpenAI GPT-5.5 / GPT-5.4 series
  'openai/gpt-5.5': 1_050_000,
  'openai/gpt-5.4': 1_050_000,
  'openai/gpt-5.4-mini': 400_000,     // Max 272K input tokens

  // OpenAI GPT-5 series (previous generation)
  'openai/gpt-5.2': 400_000,      // Previous flagship model
  'openai/gpt-5.1': 400_000,      // Deprecated - shutdown April 1, 2027
  'openai/gpt-5': 400_000,        // Deprecated - shutdown December 11, 2026
  'openai/gpt-5-mini': 400_000,   // Deprecated - shutdown December 11, 2026
  'openai/gpt-5-nano': 400_000,   // Deprecated - shutdown December 11, 2026

  // OpenAI O-series reasoning models
  'openai/o3': 200_000,           // Deprecated - shutdown December 11, 2026
  'openai/o1': 200_000,           // Deprecated

  // Anthropic - current models
  'anthropic/claude-fable-5-1': 1_000_000,
  'anthropic/claude-opus-5-5': 1_000_000,
  'anthropic/claude-sonnet-5-5': 1_000_000,
  'anthropic/claude-haiku-4-5': 200_000,

  // Anthropic - Claude 5 series (legacy)
  'anthropic/claude-fable-5': 1_000_000,
  'anthropic/claude-opus-5': 1_000_000,
  'anthropic/claude-sonnet-5': 1_000_000,

  // Anthropic - Claude 4.x series (legacy)
  'anthropic/claude-opus-4-8': 1_000_000,
  'anthropic/claude-opus-4-7': 1_000_000,
  'anthropic/claude-opus-4-6': 1_000_000,
  'anthropic/claude-sonnet-4-6': 1_000_000,
  'anthropic/claude-opus-4-5': 200_000,
  'anthropic/claude-sonnet-4-5': 200_000,  // Deprecated - retires November 30, 2026

  // Google Gemini 3 series (current)
  'google/gemini-3.8-flash': 1_048_576,
  'google/gemini-3.7-flash': 1_048_576,
  'google/gemini-3.6-flash': 1_048_576,
  'google/gemini-3.5-flash': 1_048_576,
  'google/gemini-3.5-flash-lite': 1_048_576,
  'google/gemini-3.1-flash-lite': 1_048_576,

  // Google Gemini 2.5 series (access limited to existing users)
  'google/gemini-2.5-pro': 1_048_576,
  'google/gemini-2.5-flash': 1_048_576,
  'google/gemini-2.5-flash-lite': 1_048_576,
} as const;

export const EMBEDDING_MODELS = [
  // OpenAI Embedding models
  'openai/text-embedding-3-small', 
  'openai/text-embedding-3-large', 
  'openai/text-embedding-ada-002',
  
  // Google Embedding models (Gemini API)
  'google/gemini-embedding-001',

  // Vertex AI Embedding models
  'vertex/gemini-embedding-001',
  'vertex/text-embedding-005',
  'vertex/text-multilingual-embedding-002',
] as const;

/**
 * Provider capability constants
 * These define which providers support which capabilities
 */
export const TOKENIZATION_PROVIDERS = ['openai', 'anthropic', 'google'] as const;
export const EMBEDDING_PROVIDERS = ['openai', 'google', 'vertex'] as const;

export type TokenizationProvider = typeof TOKENIZATION_PROVIDERS[number];
export type EmbeddingProvider = typeof EMBEDDING_PROVIDERS[number];

export const EMBEDDING_LIMITS = {
  // OpenAI Embedding models
  'openai/text-embedding-3-small': 8_192,
  'openai/text-embedding-3-large': 8_192,
  'openai/text-embedding-ada-002': 8_192,
  
  // Google Embedding models (Gemini API)
  'google/gemini-embedding-001': 2_048,

  // Vertex AI Embedding models
  'vertex/gemini-embedding-001': 2_048,
  'vertex/text-embedding-005': 2_048,
  'vertex/text-multilingual-embedding-002': 2_048,
} as const;

export const EMBEDDING_DIMENSIONS = {
  // OpenAI Embedding models
  'openai/text-embedding-3-small': 1536,
  'openai/text-embedding-3-large': 3072,
  'openai/text-embedding-ada-002': 1536,
  
  // Google Embedding models (Gemini API)
  'google/gemini-embedding-001': 3072,  // Default dimension, configurable (768/1536/3072)

  // Vertex AI Embedding models
  'vertex/gemini-embedding-001': 3072,  // Default dimension, configurable (768/1536/3072)
  'vertex/text-embedding-005': 768,
  'vertex/text-multilingual-embedding-002': 768,
} as const;

export type SupportedModel = keyof typeof CONTEXT_LIMITS;
export type SupportedEmbeddingModel = keyof typeof EMBEDDING_LIMITS;
export type SupportedEmbeddingModelName = typeof EMBEDDING_MODELS[number];
