/**
 * Model constants and configurations
 * 
 * This file contains all model-related constants including context limits,
 * and supported capabilities. Update this file when providers add new models or change specifications.
 * 
 * Sources for model information:
 * - OpenAI: https://platform.openai.com/docs/models/
 * - Anthropic: https://docs.anthropic.com/en/docs/about-claude/models
 * - Google Gemini: https://ai.google.dev/gemini-api/docs/models
 * - Vertex AI: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings
 * - Vertex AI: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api
 */

export const CONTEXT_LIMITS = {
  // OpenAI
  'openai/gpt-4.1': 1_000_000,
  'openai/gpt-4.1-mini': 1_000_000,
  'openai/o4-mini': 200_000,
  'openai/o3': 200_000,
  'openai/o1': 200_000,
  'openai/o1-preview': 128_000,
  'openai/o1-mini': 128_000,
  'openai/gpt-4o': 128_000,
  'openai/gpt-4o-mini': 128_000,
  'openai/gpt-4': 8_192,
  'openai/gpt-4-turbo': 128_000,
  'openai/gpt-3.5-turbo': 16_385,
  
  // Anthropic - Claude 4.5 series (current)
  'anthropic/claude-sonnet-4-5': 200_000,
  'anthropic/claude-haiku-4-5': 200_000,
  'anthropic/claude-opus-4-5': 200_000,

  // Anthropic - Claude 4 series (legacy)
  'anthropic/claude-opus-4-1': 200_000,
  'anthropic/claude-sonnet-4-0': 200_000,
  'anthropic/claude-opus-4-0': 200_000,

  // Anthropic - Claude 3 series (legacy)
  'anthropic/claude-3-7-sonnet-latest': 200_000,
  'anthropic/claude-3-5-haiku-latest': 200_000,
  
  // Google - Latest models
  'google/gemini-2.5-pro': 2_000_000,
  'google/gemini-2.5-flash': 1_000_000,
  'google/gemini-2.0-flash': 1_000_000,
  'google/gemini-1.5-pro': 2_000_000,
  'google/gemini-1.5-flash': 1_000_000,
  'google/gemini-1.5-flash-8b': 1_000_000,
  'google/gemini-pro': 32_768,
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
  'vertex/multilingual-e5-small',
  'vertex/multilingual-e5-large',
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
  'vertex/multilingual-e5-small': 512,
  'vertex/multilingual-e5-large': 512,
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
  'vertex/multilingual-e5-small': 384,
  'vertex/multilingual-e5-large': 1024,
} as const;

export type SupportedModel = keyof typeof CONTEXT_LIMITS;
export type SupportedEmbeddingModel = keyof typeof EMBEDDING_LIMITS;
export type SupportedEmbeddingModelName = typeof EMBEDDING_MODELS[number];
