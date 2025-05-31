export interface EmbeddingResult {
  vector: number[];
  model: string;
  usage: {
    tokens: number;
    cost?: number;
  };
}

export interface TokenCountResult {
  count: number;
  model: string;
}

export interface ModelInfo {
  provider: 'openai' | 'anthropic' | 'google';
  family: string;
  contextLimit: number;
  supportsEmbedding: boolean;
  supportsChat: boolean;
  costPerToken?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface LibraryConfig {
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  google?: ProviderConfig;
}

export interface SplitTextOptions {
  preserveSentences?: boolean;
  preserveWords?: boolean;
  overlap?: number;
}

export interface TruncateOptions {
  strategy?: 'early' | 'late' | 'balanced';
  preserveSystem?: boolean;
}

export interface OptimizeOptions {
  systemPrompt?: string;
  messages?: Message[];
  documents?: any[];
  maxTokens?: number;
  targetUtilization?: number;
}

export interface TokenizerInterface {
  count(text: string): Promise<number> | number;
  encode?(text: string): number[];
  decode?(tokens: number[]): string;
}

export interface EmbeddingProvider {
  embed(text: string, model: string): Promise<EmbeddingResult>;
  supportedModels: string[];
}

export interface ProviderError extends Error {
  code: string;
  provider: string;
  statusCode?: number;
  retryable?: boolean;
}

export const MODEL_FAMILIES = {
  // OpenAI
  'gpt-4o': 'gpt-4',
  'gpt-4o-mini': 'gpt-4',
  'gpt-4': 'gpt-4',
  'gpt-4-turbo': 'gpt-4',
  'gpt-3.5-turbo': 'gpt-3.5',
  'o1-preview': 'o1',
  'o1-mini': 'o1',
  
  // Anthropic
  'claude-3-5-sonnet-20241022': 'claude-3.5',
  'claude-3-5-haiku-20241022': 'claude-3.5',
  'claude-3-opus-20240229': 'claude-3',
  'claude-3-sonnet-20240229': 'claude-3',
  'claude-3-haiku-20240307': 'claude-3',
  'claude-3-7-sonnet-20250219': 'claude-3.7',
  
  // Google
  'gemini-1.5-pro': 'gemini-1.5',
  'gemini-1.5-flash': 'gemini-1.5',
  'gemini-pro': 'gemini-1.0',
  'gemini-embedding-exp-03-07': 'gemini-embedding',
} as const;

export const CONTEXT_LIMITS = {
  // OpenAI models
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4': 8192,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  'o1-preview': 128000,
  'o1-mini': 128000,
  
  // Anthropic models
  'claude-4-sonnet': 200_000,
  'claude-4-opus': 200_000,
  'claude-3.5-sonnet': 200_000,
  'claude-3.5-haiku': 200_000,
  'claude-3-opus': 200_000,
  'claude-3-sonnet': 200_000,
  'claude-3-haiku': 200_000,
  'claude-3.7-sonnet': 200000,
  'claude-3.7-opus': 200000,
  
  // Google models
  'gemini-1.5-pro': 1000000,
  'gemini-1.5-flash': 1000000,
  'gemini-pro': 32768,
  
  // OpenAI Embedding models
  'text-embedding-3-small': 8192,
  'text-embedding-3-large': 8192,
  'text-embedding-ada-002': 8192,
  
  // Google Embedding models
  'gemini-embedding-exp-03-07': 2048,
} as const;

export type SupportedModel = keyof typeof CONTEXT_LIMITS;
export type ModelFamily = typeof MODEL_FAMILIES[keyof typeof MODEL_FAMILIES]; 