import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { AnthropicProvider } from '../../src/providers/anthropic.js';
import { countTokens, configure } from '../../src/index.js';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  
  beforeEach(() => {
    const apiKey = process.env.ANTHROPIC_API_KEY || 'fake-api-key-for-testing';
    provider = new AnthropicProvider(apiKey);
  });

  describe('Unit Tests', () => {
    describe('Functionality', () => {
      it('should provide tokenization interface', () => {
        expect(typeof provider.getTokenizer).toBe('function');
        expect(typeof provider.countTokens).toBe('function');
      });

      it('should not provide embedding functionality', () => {
        expect('embed' in provider).toBe(false);
      });
    });

    describe('Tokenization Support', () => {
      it('should provide tokenizer for models', () => {
        const tokenizer = provider.getTokenizer('claude-3-5-sonnet-latest');
        expect(tokenizer).toBeDefined();
        expect(typeof tokenizer.count).toBe('function');
      });

      it.skipIf(!hasApiKey)('should provide async tokenization', async () => {
        const tokenizer = provider.getTokenizer('claude-3-5-sonnet-latest');
        const result = await tokenizer.count('Hello world');
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      });
    });

    describe('Provider Configuration', () => {
      it('should initialize with API key', () => {
        expect(() => new AnthropicProvider('test-key')).not.toThrow();
      });

      it('should accept baseURL parameter', () => {
        expect(() => new AnthropicProvider('test-key', 'https://custom.api.url')).not.toThrow();
      });

      it('should create provider instance', () => {
        const testProvider = new AnthropicProvider('test-api-key', 'https://custom.url');
        expect(testProvider).toBeInstanceOf(AnthropicProvider);
        expect(typeof testProvider.getTokenizer).toBe('function');
      });
    });
  });

  describe('Integration Tests', () => {
    beforeAll(() => {
      if (hasApiKey) {
        configure({ anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! } });
      }
    });

    describe('Token Counting', () => {
      it.skipIf(!hasApiKey)('should count tokens for Claude 3.5 Sonnet', async () => {
        const count = await countTokens('anthropic/claude-3-5-sonnet-latest', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for Claude 3.7 Sonnet', async () => {
        const count = await countTokens('anthropic/claude-3-7-sonnet-latest', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for Claude 3.5 Haiku', async () => {
        const count = await countTokens('anthropic/claude-3-5-haiku-latest', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should handle longer text correctly', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words and punctuation!';
        
        const shortCount = await countTokens('anthropic/claude-3-5-sonnet-latest', shortText);
        const longCount = await countTokens('anthropic/claude-3-5-sonnet-latest', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });

      it.skipIf(!hasApiKey)('should reject empty text for token counting', async () => {
        await expect(countTokens('anthropic/claude-3-5-sonnet-latest', '')).rejects.toThrow();
      });

      it.skipIf(!hasApiKey)('should work with complex text', async () => {
        const complexText = `
          Here's a complex text with multiple paragraphs,
          special characters: !@#$%^&*(),
          and different formatting.
          
          It includes numbers like 123, 456.789,
          and various punctuation marks: "quotes", 'apostrophes', and dashes—like this.
        `;
        
        const count = await countTokens('anthropic/claude-3-5-sonnet-latest', complexText);
        expect(count).toBeGreaterThan(20); // Should be significantly more than a few words
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should reject invalid API keys', async () => {
        configure({ anthropic: { apiKey: 'sk-ant-invalid-key-test' } });
        await expect(countTokens('anthropic/claude-3-5-sonnet-latest', 'test')).rejects.toThrow();
        
        // Restore valid key
        if (hasApiKey) {
          configure({ anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! } });
        }
      });

      it.skipIf(!hasApiKey)('should handle large payloads and find failure point above 10k tokens', async () => {
        // Base text pattern to repeat for generating large payloads
        const baseText = 'This is a sample sentence with various words and punctuation marks. ';
        
        let lastSuccessfulSize = 0;
        let currentMultiplier = 1_000;
        
        while (true) {
          const testText = baseText.repeat(currentMultiplier);
          
          try {
            const count = await countTokens('anthropic/claude-3-5-sonnet-latest', testText);
            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThan(0);
            
            lastSuccessfulSize = count;
            currentMultiplier *= 10;
          } catch (error) {
            if (error.statusCode === 413) {
              break;
            } else {
              throw error;
            }
          }
        }
        
        // Assert that we can handle payloads with at least 10k tokens
        expect(lastSuccessfulSize).toBeGreaterThan(10000);
        
        console.log(`Maximum successful payload size: ${lastSuccessfulSize} tokens`);
      }, 300_000); // Increase timeout to 5min for this test
    });
  });
}); 