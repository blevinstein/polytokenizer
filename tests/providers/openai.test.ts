import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { OpenAIProvider, EMBEDDING_MODELS, CHAT_MODELS } from '../../src/providers/openai.js';
import { embedText, countTokens, configure } from '../../src/index.js';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  
  beforeEach(() => {
    provider = new OpenAIProvider('fake-api-key-for-testing');
  });

  describe('Unit Tests', () => {
    describe('Tokenizer Support', () => {
      it('should provide local tokenization', () => {
        const tokenizer = provider.getTokenizer('test-model');
        expect(tokenizer).toBeDefined();
        expect(typeof tokenizer.count).toBe('function');
        expect(typeof tokenizer.encode).toBe('function');
        expect(typeof tokenizer.decode).toBe('function');
      });

      it('should count tokens locally', () => {
        const tokenizer = provider.getTokenizer('test-model');
        const count = tokenizer.count('Hello world');
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should handle empty text', () => {
        const tokenizer = provider.getTokenizer('test-model');
        const count = tokenizer.count('');
        expect(count).toBe(0);
      });

      it('should encode and decode consistently', () => {
        const tokenizer = provider.getTokenizer('test-model');
        const text = 'Hello world!';
        
        expect(tokenizer.encode).toBeDefined();
        expect(tokenizer.decode).toBeDefined();
        
        const tokens = tokenizer.encode!(text);
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);
        
        const decoded = tokenizer.decode!(tokens);
        expect(decoded).toBe(text);
      });
    });

    describe('Provider Configuration', () => {
      it('should initialize with API key', () => {
        expect(() => new OpenAIProvider('test-key')).not.toThrow();
      });

      it('should accept baseURL parameter', () => {
        expect(() => new OpenAIProvider('test-key', 'https://custom.api.url')).not.toThrow();
      });

      it('should create provider instance', () => {
        const testProvider = new OpenAIProvider('test-api-key', 'https://custom.url');
        expect(testProvider).toBeInstanceOf(OpenAIProvider);
      });
    });

    describe('Resource Management', () => {
      it('should provide dispose method', () => {
        expect(typeof provider.dispose).toBe('function');
        expect(() => provider.dispose()).not.toThrow();
      });
    });
  });

  describe('Integration Tests', () => {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    beforeAll(() => {
      if (hasApiKey) {
        configure({ openai: { apiKey: process.env.OPENAI_API_KEY! } });
      }
    });

    describe('Token Counting', () => {
      it.skipIf(!hasApiKey)('should count tokens for all supported chat models', async () => {
        for (const model of CHAT_MODELS) {
          const count = await countTokens(`openai/${model}`, 'Hello world');
          expect(count).toBeGreaterThan(0);
          expect(typeof count).toBe('number');
        }
      });

      it.skipIf(!hasApiKey)('should count tokens for all supported embedding models', async () => {
        for (const model of EMBEDDING_MODELS) {
          const count = await countTokens(`openai/${model}`, 'Hello world');
          expect(count).toBeGreaterThan(0);
          expect(typeof count).toBe('number');
        }
      });

      it.skipIf(!hasApiKey)('should handle empty text', async () => {
        const count = await countTokens('openai/gpt-5', '');
        expect(count).toBe(0);
      });

      it.skipIf(!hasApiKey)('should handle longer text correctly', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words.';
        
        const shortCount = await countTokens('openai/gpt-5', shortText);
        const longCount = await countTokens('openai/gpt-5', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });
    });

    describe('Embeddings', () => {
      it.skipIf(!hasApiKey)('should generate embeddings for text-embedding-3-small', async () => {
        const result = await embedText('openai/text-embedding-3-small', 'Hello world');
        
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(1536); // text-embedding-3-small dimension
        expect(result.model).toBe('openai/text-embedding-3-small');
        expect(result.usage.tokens).toBeGreaterThan(0);
        expect(typeof result.usage.cost).toBe('number');
        
        // Check that vector contains numbers
        expect(result.vector.every(num => typeof num === 'number')).toBe(true);
      });

      it.skipIf(!hasApiKey)('should generate embeddings for text-embedding-3-large', async () => {
        const result = await embedText('openai/text-embedding-3-large', 'Hello world');

        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(3072); // text-embedding-3-large dimension
        expect(result.model).toBe('openai/text-embedding-3-large');
        expect(result.usage.tokens).toBeGreaterThan(0);
      });

      it.skipIf(!hasApiKey)('should generate embeddings for text-embedding-ada-002', async () => {
        const result = await embedText('openai/text-embedding-ada-002', 'Hello world');

        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(1536); // text-embedding-ada-002 dimension
        expect(result.model).toBe('openai/text-embedding-ada-002');
        expect(result.usage.tokens).toBeGreaterThan(0);
      });

      it.skipIf(!hasApiKey)('should handle different text inputs', async () => {
        const shortResult = await embedText('openai/text-embedding-3-small', 'Hi');
        const longResult = await embedText('openai/text-embedding-3-small', 'This is a much longer text that should have more tokens and produce a different embedding vector');
        
        expect(longResult.usage.tokens).toBeGreaterThan(shortResult.usage.tokens);
        expect(longResult.vector.length).toBe(shortResult.vector.length);
        
        // Vectors should be different
        expect(longResult.vector).not.toEqual(shortResult.vector);
      });

      it.skipIf(!hasApiKey)('should reject invalid API keys', async () => {
        configure({ openai: { apiKey: 'sk-invalid-key-test' } });
        await expect(embedText('openai/text-embedding-3-small', 'test')).rejects.toThrow();
        
        // Restore valid key
        if (hasApiKey) {
          configure({ openai: { apiKey: process.env.OPENAI_API_KEY! } });
        }
      });
    });
  });
}); 
