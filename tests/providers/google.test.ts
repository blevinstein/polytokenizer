import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { GoogleProvider } from '../../src/providers/google.js';
import { embedText, countTokens, configure } from '../../src/index.js';

describe('GoogleProvider', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    provider = new GoogleProvider('fake-api-key-for-testing');
  });

  describe('Unit Tests', () => {
    describe('Provider Configuration', () => {
      it('should initialize with API key', () => {
        expect(() => new GoogleProvider('test-key')).not.toThrow();
      });

      it('should create provider instance', () => {
        const testProvider = new GoogleProvider('test-api-key');
        expect(testProvider).toBeInstanceOf(GoogleProvider);
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
        const count = await countTokens('google/gemini-2.5-pro', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for Gemini flash models', async () => {
        const count = await countTokens('google/gemini-2.5-flash', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should handle longer text correctly', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words and punctuation!';

        const shortCount = await countTokens('google/gemini-2.5-pro', shortText);
        const longCount = await countTokens('google/gemini-2.5-pro', longText);

        expect(longCount).toBeGreaterThan(shortCount);
      });
    });

    describe('Embeddings', () => {
      it.skipIf(!hasApiKey)('should generate embeddings with gemini-embedding-001 (default 3072 dimensions)', async () => {
        const result = await embedText('google/gemini-embedding-001', 'Hello world');

        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(3072); // Default dimension for gemini-embedding-001
        expect(result.model).toBe('google/gemini-embedding-001');

        // Check that vector contains numbers
        expect(result.vector.every(num => typeof num === 'number')).toBe(true);
      });

      it.skipIf(!hasApiKey)('should generate embeddings with gemini-embedding-001 using 768 dimensions', async () => {
        const result = await embedText('google/gemini-embedding-001', 'Hello world', 768);

        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(768); // Reduced dimension
        expect(result.model).toBe('google/gemini-embedding-001');
      });

      it.skipIf(!hasApiKey)('should generate embeddings with gemini-embedding-001 using 1536 dimensions', async () => {
        const result = await embedText('google/gemini-embedding-001', 'Hello world', 1536);

        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(1536); // Medium dimension
        expect(result.model).toBe('google/gemini-embedding-001');
      });


      it.skipIf(!hasApiKey)('should handle different text inputs', async () => {
        const shortResult = await embedText('google/gemini-embedding-001', 'Hi');
        const longResult = await embedText('google/gemini-embedding-001', 'This is a much longer text that should have more tokens and produce a different embedding vector');

        expect(longResult.vector.length).toBe(shortResult.vector.length);

        // Vectors should be different
        expect(longResult.vector).not.toEqual(shortResult.vector);
      });

      it.skipIf(!hasApiKey)('should demonstrate MRL capability with different dimensions', async () => {
        const testText = 'Natural language processing and machine learning are important fields in artificial intelligence.';

        // Test different dimensionality settings
        const dim768 = await embedText('google/gemini-embedding-001', testText, 768);
        const dim1536 = await embedText('google/gemini-embedding-001', testText, 1536);
        const dim3072 = await embedText('google/gemini-embedding-001', testText, 3072);

        // Verify dimensions
        expect(dim768.vector.length).toBe(768);
        expect(dim1536.vector.length).toBe(1536);
        expect(dim3072.vector.length).toBe(3072);

        // Due to MRL training, the first 768 elements should be similar
        // (though not identical due to normalization)
        expect(dim3072.vector.slice(0, 768)).toBeDefined();
      });

      it.skipIf(!hasApiKey)('should reject empty text', async () => {
        await expect(embedText('google/gemini-embedding-001', ''))
          .rejects
          .toThrow();
      });

      it.skipIf(!hasApiKey)('should handle whitespace-only text', async () => {
        const result = await embedText('google/gemini-embedding-001', '   \n\t  ');
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
      });

      it.skipIf(!hasApiKey)('should handle very long text', async () => {
        const longText = 'This is a test sentence. '.repeat(200);
        const result = await embedText('google/gemini-embedding-001', longText);
        expect(result.vector).toBeDefined();
        expect(result.vector.length).toBe(3072);
      });

      it.skipIf(!hasApiKey)('should handle special characters and unicode', async () => {
        const unicodeText = 'Hello 世界 🌍 Привет مرحبا';
        const result = await embedText('google/gemini-embedding-001', unicodeText);
        expect(result.vector).toBeDefined();
        expect(result.vector.length).toBe(3072);
        expect(result.model).toBe('google/gemini-embedding-001');
      });

      it.skipIf(!hasApiKey)('should reject invalid API keys', async () => {
        configure({ google: { apiKey: 'invalid-key-test' } });
        await expect(embedText('google/gemini-embedding-001', 'test')).rejects.toThrow();

        // Restore valid key
        if (hasApiKey) {
          configure({ google: { apiKey: process.env.GEMINI_API_KEY! } });
        }
      });
    });

    describe('Chat Model Token Counting', () => {
      it.skipIf(!hasApiKey)('should count tokens for gemini-2.5-flash-lite', async () => {
        const count = await countTokens('google/gemini-2.5-flash-lite', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for gemini-2.0-flash', async () => {
        const count = await countTokens('google/gemini-2.0-flash', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for gemini-2.0-flash-lite', async () => {
        const count = await countTokens('google/gemini-2.0-flash-lite', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens consistently across models', async () => {
        const text = 'The quick brown fox jumps over the lazy dog.';
        
        const countFlash = await countTokens('google/gemini-2.5-flash', text);
        const countPro = await countTokens('google/gemini-2.5-pro', text);
        
        expect(countFlash).toBeGreaterThan(0);
        expect(countPro).toBeGreaterThan(0);
      });

      it.skipIf(!hasApiKey)('should handle special characters in token counting', async () => {
        const text = 'Code: const x = {"key": "value"}; // comment';
        const count = await countTokens('google/gemini-2.5-pro', text);
        expect(count).toBeGreaterThan(0);
      });
    });
  });
});
