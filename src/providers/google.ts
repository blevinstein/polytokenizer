import { GoogleGenAI } from '@google/genai';
import { backOff } from 'exponential-backoff';
import { LRUCache } from 'lru-cache';
import type { EmbeddingResult, EmbeddingProvider, TokenizerProvider, TokenizerInterface, ProviderError } from '../types/index.js';

export const EMBEDDING_MODELS = [
  'gemini-embedding-001',       // 3072 dimensions (default), configurable (768/1536/3072), MRL-trained
] as const;

export const CHAT_MODELS = [
  // Gemini 2.5 series (current - recommended)
  'gemini-2.5-flash',           // Current flash model
  'gemini-2.5-flash-lite',      // Lite flash model - cost efficient
  'gemini-2.5-pro',             // Pro model - best for complex tasks
] as const;

/**
 * Maps embedding models to their corresponding chat models for tokenization.
 * Gemini embedding models use the same tokenizer as Gemini chat models,
 * but the countTokens API only accepts chat model names.
 * This mapping is used internally to convert embedding model names to chat model names.
 */
const EMBEDDING_TO_TOKENIZER_MODEL = {
  'gemini-embedding-001': 'gemini-2.5-flash',
} as const;

export class GoogleProvider implements EmbeddingProvider, TokenizerProvider {
  private client: GoogleGenAI;
  private tokenCountCache: LRUCache<string, number>;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
    // Cache up to 10,000 token count results
    this.tokenCountCache = new LRUCache<string, number>({
      max: 10000,
    });
  }

  async embed(text: string, model: string, dimensions?: number): Promise<EmbeddingResult> {
    if (!(EMBEDDING_MODELS as readonly string[]).includes(model)) {
      throw this.createError('INVALID_MODEL', `Model ${model} not supported for embeddings`);
    }

    try {
      const params: any = {
        model,
        contents: text,
      };

      if (dimensions) {
        params.config = { outputDimensionality: dimensions };
      }

      const response = await this.client.models.embedContent(params);

      if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
        throw this.createError('API_ERROR', 'No embedding returned from API');
      }

      return {
        vector: response.embeddings[0].values,
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
    // Return 0 for empty text
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // Convert embedding models to their corresponding chat models for tokenization
    // Gemini embedding models use the same tokenizer as chat models, but the API
    // only accepts chat model names for countTokens
    const tokenizerModel = this.getTokenizerModel(model);

    // Check cache first
    const cacheKey = `${tokenizerModel}:${text}`;
    const cachedResult = this.tokenCountCache.get(cacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    try {
      // Use exponential backoff for retryable errors (rate limits, server errors)
      const response = await backOff(
        () => this.client.models.countTokens({
          model: tokenizerModel,
          contents: text,
        }),
        {
          numOfAttempts: 3,
          startingDelay: 1000,
          timeMultiple: 2,
          retry: (error: any) => {
            // Retry on rate limits (429) and server errors (500+)
            const status = error?.status || error?.statusCode;
            return status === 429 || (status >= 500 && status < 600);
          },
        }
      );
      const tokenCount = response.totalTokens || 0;

      // Cache the result
      this.tokenCountCache.set(cacheKey, tokenCount);

      return tokenCount;
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

  /**
   * Gets the appropriate model name for tokenization.
   * If the model is an embedding model, returns the corresponding chat model.
   * Otherwise, returns the model as-is.
   */
  private getTokenizerModel(model: string): string {
    if ((EMBEDDING_MODELS as readonly string[]).includes(model)) {
      const tokenizerModel = EMBEDDING_TO_TOKENIZER_MODEL[model as keyof typeof EMBEDDING_TO_TOKENIZER_MODEL];
      if (!tokenizerModel) {
        throw this.createError(
          'INVALID_MODEL',
          `Embedding model ${model} does not have a corresponding tokenizer model configured`
        );
      }
      return tokenizerModel;
    }
    return model;
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
