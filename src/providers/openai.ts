import { OpenAI } from 'openai';
import { getEncoding, Tiktoken } from 'js-tiktoken';
import type { EmbeddingResult, EmbeddingProvider, TokenizerProvider, TokenizerInterface, ProviderError } from '../types/index.js';

const EMBEDDING_MODELS = [
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002'
];

const EMBEDDING_COSTS = {
  'text-embedding-3-small': 0.02e-6,
  'text-embedding-3-large': 0.13e-6,
  'text-embedding-ada-002': 0.1e-6,
} as const;

export class OpenAIProvider implements EmbeddingProvider, TokenizerProvider {
  private client: OpenAI;
  private tokenizers = new Map<string, Tiktoken>();
  
  readonly supportedModels = EMBEDDING_MODELS;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ 
      apiKey,
      baseURL,
    });
  }

  async embed(text: string, model: string): Promise<EmbeddingResult> {
    if (!this.supportedModels.includes(model)) {
      throw this.createError('INVALID_MODEL', `Model ${model} not supported for embeddings`);
    }

    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
      });

      const embedding = response.data[0].embedding;
      const tokens = response.usage.prompt_tokens;
      const cost = this.calculateEmbeddingCost(model, tokens);

      return {
        vector: embedding,
        model: `openai/${model}`,
        usage: {
          tokens,
          cost,
        },
      };
    } catch (error: any) {
      throw this.createError(
        error.status === 401 ? 'API_KEY_INVALID' : 
        error.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
        error.message,
        error.status
      );
    }
  }

  async countTokens(model: string, text: string): Promise<number> {
    const tokenizer = this.getTokenizer(model);
    return tokenizer.count(text);
  }

  getTokenizer(model?: string): TokenizerInterface {
    const encoding = this.getEncodingForModel(model);
    
    if (!this.tokenizers.has(encoding)) {
      this.tokenizers.set(encoding, getEncoding(encoding));
    }
    
    const tokenizer = this.tokenizers.get(encoding)!;
    
    return {
      count: (text: string) => tokenizer.encode(text).length,
      encode: (text: string) => tokenizer.encode(text),
      decode: (tokens: number[]) => tokenizer.decode(tokens),
    };
  }

  private getEncodingForModel(model?: string): 'gpt2' | 'cl100k_base' | 'o200k_base' {
    if (!model) return 'cl100k_base';
    
    // o200k_base models (newer models)
    if (model.startsWith('gpt-4.1') || 
        model.startsWith('gpt-4o') || 
        model.startsWith('o1') || 
        model.startsWith('o3') || 
        model.startsWith('o4')) {
      return 'o200k_base';
    } 
    // cl100k_base models (older GPT-4 and GPT-3.5)
    else if (model.startsWith('gpt-4') || 
             model.startsWith('gpt-3.5') || 
             model.startsWith('text-embedding')) {
      return 'cl100k_base';
    } 
    // Legacy models
    else {
      return 'gpt2';
    }
  }

  private calculateEmbeddingCost(model: string, tokens: number): number {
    const costPerToken = EMBEDDING_COSTS[model as keyof typeof EMBEDDING_COSTS];
    return costPerToken ? costPerToken * tokens : 0;
  }

  private createError(code: string, message: string, statusCode?: number): ProviderError {
    const error = new Error(message) as ProviderError;
    error.code = code;
    error.provider = 'openai';
    
    if (statusCode !== undefined) {
      error.statusCode = statusCode;
      error.retryable = statusCode === 429 || statusCode >= 500;
    } else {
      error.retryable = false;
    }
    
    return error;
  }

  dispose(): void {
    this.tokenizers.clear();
  }
} 