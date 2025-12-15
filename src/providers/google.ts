import { GoogleGenAI } from '@google/genai';
import type { EmbeddingResult, EmbeddingProvider, TokenizerProvider, TokenizerInterface, ProviderError } from '../types/index.js';

const EMBEDDING_MODELS = [
  'gemini-embedding-001',       // 3072 dimensions (default), configurable (768/1536/3072), MRL-trained
];

const CHAT_MODELS = [
  'gemini-2.5-flash',           // Current flash model (2025)
  'gemini-2.5-flash-lite',      // Lite flash model
  'gemini-2.5-pro',             // Pro model
  'gemini-2.0-flash',           // Previous generation flash
  'gemini-2.0-flash-lite',      // Previous generation lite
];

export class GoogleProvider implements EmbeddingProvider, TokenizerProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async embed(text: string, model: string, dimensions?: number): Promise<EmbeddingResult> {
    if (!EMBEDDING_MODELS.includes(model)) {
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
    try {
      const response = await this.client.models.countTokens({
        model,
        contents: text,
      });
      return response.totalTokens || 0;
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
