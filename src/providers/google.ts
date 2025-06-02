import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EmbeddingResult, EmbeddingProvider, TokenizerProvider, TokenizerInterface, ProviderError } from '../types/index.js';

const EMBEDDING_MODELS = [
  'gemini-embedding-exp-03-07', // 3072 dimensions, 8K input, experimental (Mar 2025)
  'text-embedding-004',         // 768 dimensions, current recommended model
  'embedding-001'               // 768 dimensions, legacy model
];

export class GoogleProvider implements EmbeddingProvider, TokenizerProvider {
  private client: GoogleGenerativeAI;
  
  readonly supportedModels = EMBEDDING_MODELS;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async embed(text: string, model: string): Promise<EmbeddingResult> {
    if (!this.supportedModels.includes(model)) {
      throw this.createError('INVALID_MODEL', `Model ${model} not supported for embeddings`);
    }

    try {
      const embeddingModel = this.client.getGenerativeModel({ model });
      const result = await embeddingModel.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw this.createError('API_ERROR', 'No embedding returned from API');
      }

      return {
        vector: result.embedding.values,
        model: `google/${model}`,
        usage: {
          tokens: -1,
        },
      };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      
      throw this.createError(
        error.status === 401 ? 'API_KEY_INVALID' : 
        error.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
        error.message,
        error.status
      );
    }
  }

  async countTokens(model: string, text: string): Promise<number> {
    try {
      const genModel = this.client.getGenerativeModel({ model });
      const result = await genModel.countTokens(text);
      return result.totalTokens;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      
      throw this.createError(
        error.status === 401 ? 'API_KEY_INVALID' : 
        error.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
        error.message,
        error.status
      );
    }
  }

  getTokenizer(model: string): TokenizerInterface {
    return {
      count: (text: string) => this.countTokens(model, text),
    };
  }

  private createError(code: string, message: string, statusCode?: number): ProviderError {
    const error = new Error(message) as ProviderError;
    error.code = code;
    error.provider = 'google';
    
    if (statusCode !== undefined) {
      error.statusCode = statusCode;
      error.retryable = statusCode === 429 || statusCode >= 500;
    } else {
      error.retryable = false;
    }
    
    return error;
  }
} 