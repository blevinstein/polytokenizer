import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { GoogleProvider } from '../../src/providers/google.js';
import { embedText, countTokens, configure } from '../../src/index.js';

describe('GoogleProvider', () => {
  let provider: GoogleProvider;
  
  beforeEach(() => {
    provider = new GoogleProvider('fake-api-key-for-testing');
  });

  describe('Unit Tests', () => {
    describe('Supported Models', () => {
      it('should have supported models', () => {
        expect(provider.supportedModels).toBeDefined();
        expect(Array.isArray(provider.supportedModels)).toBe(true);
      });
    });

    describe('Provider Configuration', () => {
      it('should initialize with API key', () => {
        expect(() => new GoogleProvider('test-key')).not.toThrow();
      });

      it('should create provider instance', () => {
        const testProvider = new GoogleProvider('test-api-key');
        expect(testProvider).toBeInstanceOf(GoogleProvider);
        expect(testProvider.supportedModels).toBeDefined();
      });
    });

    describe('Tokenizer Interface', () => {
      it('should provide tokenizer for models', () => {
        const tokenizer = provider.getTokenizer('test-model');
        expect(tokenizer).toBeDefined();
        expect(typeof tokenizer.count).toBe('function');
      });
    });
  });

  describe('Integration Tests', () => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    
    beforeAll(() => {
      if (hasApiKey) {
        configure({ google: { apiKey: process.env.GEMINI_API_KEY! } });
      }
    });

    describe('Token Counting', () => {
      it.skipIf(!hasApiKey)('should count tokens for Gemini chat models', async () => {
        const count = await countTokens('google/gemini-1.5-pro', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for Gemini flash models', async () => {
        const count = await countTokens('google/gemini-1.5-flash', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should handle longer text correctly', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words and punctuation!';
        
        const shortCount = await countTokens('google/gemini-1.5-pro', shortText);
        const longCount = await countTokens('google/gemini-1.5-pro', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });
    });

    describe('Embeddings', () => {
      it.skipIf(!hasApiKey)('should generate embeddings with new experimental model', async () => {
        const result = await embedText('google/gemini-embedding-exp-03-07', 'Hello world');
        
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(3072); // New model has 3072 dimensions
        expect(result.model).toBe('google/gemini-embedding-exp-03-07');
        
        // Check that vector contains numbers
        expect(result.vector.every(num => typeof num === 'number')).toBe(true);
      });

      it.skipIf(!hasApiKey)('should generate embeddings with text-embedding-004', async () => {
        const result = await embedText('google/text-embedding-004', 'Hello world');
        
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(768); // text-embedding-004 dimension
        expect(result.model).toBe('google/text-embedding-004');
      });

      it.skipIf(!hasApiKey)('should handle different text inputs', async () => {
        const shortResult = await embedText('google/gemini-embedding-exp-03-07', 'Hi');
        const longResult = await embedText('google/gemini-embedding-exp-03-07', 'This is a much longer text that should have more tokens and produce a different embedding vector');
        
        expect(longResult.vector.length).toBe(shortResult.vector.length);
        
        // Vectors should be different
        expect(longResult.vector).not.toEqual(shortResult.vector);
      });

      it.skipIf(!hasApiKey)('should demonstrate improved performance of experimental model', async () => {
        const testText = 'Natural language processing and machine learning are important fields in artificial intelligence.';
        
        // Test both old and new models
        const oldResult = await embedText('google/text-embedding-004', testText);
        const newResult = await embedText('google/gemini-embedding-exp-03-07', testText);
        
        // New model should have higher dimensionality
        expect(newResult.vector.length).toBeGreaterThan(oldResult.vector.length);
        expect(newResult.vector.length).toBe(3072);
        expect(oldResult.vector.length).toBe(768);
      });

      it.skipIf(!hasApiKey)('should reject invalid API keys', async () => {
        configure({ google: { apiKey: 'invalid-key-test' } });
        await expect(embedText('google/text-embedding-004', 'test')).rejects.toThrow();
        
        // Restore valid key
        if (hasApiKey) {
          configure({ google: { apiKey: process.env.GEMINI_API_KEY! } });
        }
      });
    });
  });
}); 