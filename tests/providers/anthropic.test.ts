import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { AnthropicProvider } from '../../src/providers/anthropic.js';
import { countTokens, configure } from '../../src/index.js';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  
  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key-for-testing');
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
        const tokenizer = provider.getTokenizer('test-model');
        expect(tokenizer).toBeDefined();
        expect(typeof tokenizer.count).toBe('function');
      });

      it('should provide async tokenization', () => {
        const tokenizer = provider.getTokenizer('test-model');
        const result = tokenizer.count('Hello world');
        expect(result).toBeDefined();
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
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    
    beforeAll(() => {
      if (hasApiKey) {
        configure({ anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! } });
      }
    });

    describe('Token Counting', () => {
      it.skipIf(!hasApiKey)('should count tokens for Claude 3.5 Sonnet', async () => {
        const count = await countTokens('anthropic/claude-3.5-sonnet', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for Claude 3.7 Sonnet', async () => {
        const count = await countTokens('anthropic/claude-3.7-sonnet', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should count tokens for Claude 3.5 Haiku', async () => {
        const count = await countTokens('anthropic/claude-3.5-haiku', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should handle longer text correctly', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words and punctuation!';
        
        const shortCount = await countTokens('anthropic/claude-3.5-sonnet', shortText);
        const longCount = await countTokens('anthropic/claude-3.5-sonnet', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });

      it.skipIf(!hasApiKey)('should handle empty text', async () => {
        const count = await countTokens('anthropic/claude-3.5-sonnet', '');
        expect(count).toBe(0);
      });

      it.skipIf(!hasApiKey)('should work with complex text', async () => {
        const complexText = `
          Here's a complex text with multiple paragraphs,
          special characters: !@#$%^&*(),
          and different formatting.
          
          It includes numbers like 123, 456.789,
          and various punctuation marks: "quotes", 'apostrophes', and dashes—like this.
        `;
        
        const count = await countTokens('anthropic/claude-3.5-sonnet', complexText);
        expect(count).toBeGreaterThan(20); // Should be significantly more than a few words
        expect(typeof count).toBe('number');
      });

      it.skipIf(!hasApiKey)('should reject invalid API keys', async () => {
        configure({ anthropic: { apiKey: 'sk-ant-invalid-key-test' } });
        await expect(countTokens('anthropic/claude-3.5-sonnet', 'test')).rejects.toThrow();
        
        // Restore valid key
        if (hasApiKey) {
          configure({ anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! } });
        }
      });
    });
  });
}); 