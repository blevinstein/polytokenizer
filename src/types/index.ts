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
  provider: 'openai' | 'anthropic' | 'google' | 'vertex';
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

export interface VertexConfig {
  projectId: string;
  location?: string;
  credentials: any; // Service account JSON object
}

export interface LibraryConfig {
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  google?: ProviderConfig;
  vertex?: VertexConfig;
}

export interface SplitTextOptions {
  preserveSentences?: boolean;
  preserveWords?: boolean;
  overlap?: number;
}

export interface TruncateOptions {
  strategy?: 'early' | 'late';
  preserveSystem?: boolean;
  /**
   * Extra tokens added per message for chat formatting overhead (e.g., OpenAI adds ~4 tokens per message for role/boundaries)
   * Defaults to 4 for OpenAI models
   */
  extraTokensPerMessage?: number;
  /**
   * Extra tokens added for the entire conversation (e.g., OpenAI adds 2 tokens for priming assistant reply)
   * Defaults to 2 for OpenAI models
   */
  extraTokensTotal?: number;
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

export interface TokenizerProvider {
  countTokens(model: string, text: string): Promise<number>;
  getTokenizer(model: string): TokenizerInterface;
  supportedModels: string[];
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

// Import model constants from the consolidated constants file
export { 
  CONTEXT_LIMITS
} from '../constants/models.js'; 