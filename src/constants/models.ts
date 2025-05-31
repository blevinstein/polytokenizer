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
 */

export const CONTEXT_LIMITS = {
  // OpenAI - Latest models
  'gpt-4.1': 1_000_000,
  'gpt-4.1-mini': 1_000_000,
  'o4-mini': 200_000,
  'o3': 200_000,
  'o1': 200_000,
  'o1-preview': 128_000,
  'o1-mini': 128_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  
  // OpenAI - Older models
  'gpt-4': 8_192,
  'gpt-4-turbo': 128_000,
  'gpt-3.5-turbo': 16_385,
  
  // Anthropic - Claude 4 series (using official aliases)
  'claude-opus-4-0': 200_000,
  'claude-sonnet-4-0': 200_000,
  
  // Anthropic - Claude 3 series (using official aliases)
  'claude-3-7-sonnet-latest': 200_000,
  'claude-3-5-sonnet-latest': 200_000,
  'claude-3-5-haiku-latest': 200_000,
  'claude-3-opus-latest': 200_000,
  
  // Google - Latest models
  'gemini-2.5-pro': 2_000_000,
  'gemini-2.5-flash': 1_000_000,
  'gemini-2.0-flash': 1_000_000,
  'gemini-1.5-pro': 2_000_000,
  'gemini-1.5-flash': 1_000_000,
  'gemini-1.5-flash-8b': 1_000_000,
  'gemini-pro': 32_768,
  
  // OpenAI Embedding models
  'text-embedding-3-small': 8_192,
  'text-embedding-3-large': 8_192,
  'text-embedding-ada-002': 8_192,
  
  // Google Embedding models
  'gemini-embedding-exp-03-07': 8_192,
  'text-embedding-004': 2_048,
  'embedding-001': 2_048,
} as const;

export const EMBEDDING_MODELS: Record<string, string[]> = {
  openai: [
    'text-embedding-3-small', 
    'text-embedding-3-large', 
    'text-embedding-ada-002'
  ],
  google: [
    'gemini-embedding-exp-03-07', 
    'text-embedding-004', 
    'embedding-001'
  ],
  anthropic: [] // Anthropic doesn't have public embedding API
};

export const TOKENIZATION_MODELS: Record<string, string[]> = {
  openai: [
    // Latest models (o200k_base tokenizer)
    'gpt-4.1', 'gpt-4.1-mini', 'o4-mini', 'o3', 'o1', 'o1-preview', 'o1-mini', 
    'gpt-4o', 'gpt-4o-mini',
    // Older models (cl100k_base tokenizer)
    'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo',
    // Embedding models (cl100k_base tokenizer)
    'text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'
  ],
  anthropic: [
    // Claude 4 series (using official aliases)
    'claude-opus-4-0', 'claude-sonnet-4-0',
    // Claude 3 series (using official aliases)
    'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest',
    'claude-3-opus-latest'
  ],
  google: [
    // Latest Gemini chat models
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 
    'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b',
    'gemini-pro',
    // Embedding models
    'gemini-embedding-exp-03-07', 'text-embedding-004', 'embedding-001'
  ]
};

export type SupportedModel = keyof typeof CONTEXT_LIMITS; 