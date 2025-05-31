import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EmbeddingResult, EmbeddingProvider, TokenizerInterface, ProviderError } from '../types/index.js';

const EMBEDDING_MODELS = [
  'gemini-embedding-exp-03-07',
  'text-embedding-004',
  'embedding-001'
];

export class GoogleProvider implements EmbeddingProvider {
  private client: GoogleGenerativeAI;
  
  readonly supportedModels = EMBEDDING_MODELS;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async embed(text: string, model: string): Promise<EmbeddingResult> {
    const modelName = model.replace('google/', '');
    if (!this.supportedModels.includes(modelName)) {
      throw this.createError('INVALID_MODEL', `Model ${model} not supported for embeddings`);
    }

    try {
      const embeddingModel = this.client.getGenerativeModel({ model: modelName });
      const result = await embeddingModel.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw this.createError('API_ERROR', 'No embedding returned from API');
      }

      return {
        vector: result.embedding.values,
        model: modelName,
        usage: {
          tokens: this.estimateTokens(text),
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
      const modelName = model.replace('google/', '');
      const genModel = this.client.getGenerativeModel({ model: modelName });
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

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
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