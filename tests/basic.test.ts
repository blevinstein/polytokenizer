import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { embedText, countTokens, splitTextMaxTokens, trimMessages, configure } from '../src/index.js';

describe('PolyTokenizer', () => {
  const originalConfig = {
    openai: { apiKey: process.env.OPENAI_API_KEY! },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
    google: { apiKey: process.env.GOOGLE_API_KEY! },
  };

  beforeAll(() => {
    configure(originalConfig);
  });

  afterEach(() => {
    // Restore original configuration after each test
    configure(originalConfig);
  });

  describe('Configuration', () => {
    it('should accept API keys via configure()', () => {
      const testConfig = {
        openai: { apiKey: 'sk-test-openai-key' },
        anthropic: { apiKey: 'sk-ant-test-key' },
        google: { apiKey: 'test-google-key' },
      };
      
      expect(() => configure(testConfig)).not.toThrow();
    });

    it('should accept partial configuration', () => {
      expect(() => configure({ openai: { apiKey: 'test-key' } })).not.toThrow();
    });

    it('should accept baseURL configuration', () => {
      expect(() => configure({ 
        openai: { apiKey: 'test-key', baseURL: 'https://custom-api.example.com' } 
      })).not.toThrow();
    });
  });

  describe('Model parsing and validation', () => {
    it('should parse provider/model format correctly', async () => {
      const invalidCalls = [
        () => countTokens('invalid-format', 'test'),
        () => countTokens('', 'test'),
      ];

      for (const call of invalidCalls) {
        await expect(call()).rejects.toThrow('Invalid model format');
      }
    });

    it('should validate embedding model capabilities', async () => {
      // Test that chat models reject embedding requests
      await expect(embedText('openai/gpt-4o', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('anthropic/claude-3-7-sonnet-20250219', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/gemini-1.5-pro', 'test')).rejects.toThrow('does not support embedding functionality');
    });

    it('should validate tokenization model capabilities', async () => {
      // Test unsupported models
      await expect(countTokens('openai/unsupported-model', 'test')).rejects.toThrow('does not support tokenization functionality');
      await expect(countTokens('anthropic/unsupported-model', 'test')).rejects.toThrow('does not support tokenization functionality');
      await expect(countTokens('google/unsupported-model', 'test')).rejects.toThrow('does not support tokenization functionality');
    });
  });

  describe('OpenAI Provider', () => {
    describe('Token counting', () => {
      it('should count tokens for OpenAI chat models', async () => {
        const count = await countTokens('openai/gpt-4o', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it('should count tokens for OpenAI embedding models', async () => {
        const count = await countTokens('openai/text-embedding-3-small', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it('should handle empty text', async () => {
        const count = await countTokens('openai/gpt-4o', '');
        expect(count).toBe(0);
      });

      it('should handle longer text', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words.';
        
        const shortCount = await countTokens('openai/gpt-4o', shortText);
        const longCount = await countTokens('openai/gpt-4o', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });
    });

    describe('Embeddings', () => {
      it('should generate embeddings for OpenAI models', async () => {
        const result = await embedText('openai/text-embedding-3-small', 'Hello world');
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBeGreaterThan(0);
        expect(result.model).toBe('text-embedding-3-small');
        expect(result.usage.tokens).toBeGreaterThan(0);
        expect(typeof result.usage.cost).toBe('number');
      });

      it('should handle different text inputs', async () => {
        const shortResult = await embedText('openai/text-embedding-3-small', 'Hi');
        const longResult = await embedText('openai/text-embedding-3-small', 'This is a much longer text that should have more tokens');
        
        expect(longResult.usage.tokens).toBeGreaterThan(shortResult.usage.tokens);
        expect(longResult.vector.length).toBe(shortResult.vector.length);
      });

      it('should reject API calls without valid keys', async () => {
        configure({ openai: { apiKey: 'invalid-key' } });
        await expect(embedText('openai/text-embedding-3-small', 'test')).rejects.toThrow();
      });
    });
  });

  describe('Anthropic Provider', () => {
    describe('Token counting', () => {
      it('should count tokens for Anthropic models', async () => {
        const count = await countTokens('anthropic/claude-3-7-sonnet-20250219', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it('should handle longer text', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words and punctuation!';
        
        const shortCount = await countTokens('anthropic/claude-3-7-sonnet-20250219', shortText);
        const longCount = await countTokens('anthropic/claude-3-7-sonnet-20250219', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });

      it('should reject API calls without valid keys', async () => {
        configure({ anthropic: { apiKey: 'invalid-key' } });
        await expect(countTokens('anthropic/claude-3-7-sonnet-20250219', 'test')).rejects.toThrow();
      });
    });
  });

  describe('Google Provider', () => {
    describe('Token counting', () => {
      it('should count tokens for Google models', async () => {
        const count = await countTokens('google/gemini-1.5-pro', 'Hello world');
        expect(count).toBeGreaterThan(0);
        expect(typeof count).toBe('number');
      });

      it('should handle longer text', async () => {
        const shortText = 'Hello';
        const longText = 'Hello world this is a longer sentence with more words and punctuation!';
        
        const shortCount = await countTokens('google/gemini-1.5-pro', shortText);
        const longCount = await countTokens('google/gemini-1.5-pro', longText);
        
        expect(longCount).toBeGreaterThan(shortCount);
      });

      it('should reject API calls without valid keys', async () => {
        configure({ google: { apiKey: 'invalid-key' } });
        await expect(countTokens('google/gemini-1.5-pro', 'test')).rejects.toThrow();
      });
    });

    describe('Embeddings', () => {
      it('should generate embeddings for Google models', async () => {
        const result = await embedText('google/text-embedding-004', 'Hello world');
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBeGreaterThan(0);
        expect(result.model).toBe('text-embedding-004');
        expect(result.usage.tokens).toBeGreaterThan(0);
      });

      it('should handle different text inputs', async () => {
        const shortResult = await embedText('google/text-embedding-004', 'Hi');
        const longResult = await embedText('google/text-embedding-004', 'This is a much longer text that should have more tokens');
        
        expect(longResult.usage.tokens).toBeGreaterThan(shortResult.usage.tokens);
        expect(longResult.vector.length).toBe(shortResult.vector.length);
      });

      it('should reject API calls without valid keys', async () => {
        configure({ google: { apiKey: 'invalid-key' } });
        await expect(embedText('google/text-embedding-004', 'test')).rejects.toThrow();
      });
    });
  });

  describe('Text splitting', () => {
    it('should return single chunk for short text', async () => {
      const chunks = await splitTextMaxTokens('openai/gpt-4o', 'Hello world', 100);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Hello world');
    });

    it('should split long text into multiple chunks', async () => {
      const longText = Array(100).fill('This is a sentence.').join(' ');
      const chunks = await splitTextMaxTokens('openai/gpt-4o', longText, 50);
      
      expect(chunks.length).toBeGreaterThan(1);
      
      for (const chunk of chunks) {
        const tokenCount = await countTokens('openai/gpt-4o', chunk);
        expect(tokenCount).toBeLessThanOrEqual(50);
      }
    });

    it('should handle empty text', async () => {
      const chunks = await splitTextMaxTokens('openai/gpt-4o', '', 100);
      expect(chunks).toEqual([]);
    });

    it('should preserve sentences when possible', async () => {
      const text = 'First sentence with many words to make it longer. Second sentence with many words to make it longer. Third sentence with many words to make it longer.';
      const chunks = await splitTextMaxTokens('openai/gpt-4o', text, 15);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });

    it('should work with different providers', async () => {
      const text = 'Test sentence for splitting across providers.';
      
      const openaiChunks = await splitTextMaxTokens('openai/gpt-4o', text, 10);
      expect(openaiChunks.length).toBeGreaterThanOrEqual(1);
      
      const anthropicChunks = await splitTextMaxTokens('anthropic/claude-3-7-sonnet-20250219', text, 10);
      expect(anthropicChunks.length).toBeGreaterThanOrEqual(1);
      
      const googleChunks = await splitTextMaxTokens('google/gemini-1.5-pro', text, 10);
      expect(googleChunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Message trimming', () => {
    const testMessages = [
      { role: 'system' as const, content: 'You are a helpful assistant.' },
      { role: 'user' as const, content: 'Hello!' },
      { role: 'assistant' as const, content: 'Hi there! How can I help you today?' },
      { role: 'user' as const, content: 'What is the weather like?' },
      { role: 'assistant' as const, content: 'I don\'t have access to current weather data.' },
    ];

    it('should return all messages if under limit', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 1000);
      expect(trimmed).toHaveLength(testMessages.length);
    });

    it('should preserve system messages by default', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 10);
      const systemMessages = trimmed.filter(m => m.role === 'system');
      const originalSystemMessages = testMessages.filter(m => m.role === 'system');
      expect(systemMessages).toHaveLength(originalSystemMessages.length);
    });

    it('should trim with early strategy', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 25, { strategy: 'early' });
      expect(trimmed.length).toBeLessThan(testMessages.length);
      
      const totalTokens = await Promise.all(
        trimmed.map(msg => countTokens('openai/gpt-4o', msg.content))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));
      
      expect(totalTokens).toBeLessThanOrEqual(25);
    });

    it('should trim with late strategy', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 25, { strategy: 'late' });
      expect(trimmed.length).toBeLessThan(testMessages.length);
      
      const totalTokens = await Promise.all(
        trimmed.map(msg => countTokens('openai/gpt-4o', msg.content))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));
      
      expect(totalTokens).toBeLessThanOrEqual(25);
    });

    it('should handle empty messages array', async () => {
      const trimmed = await trimMessages([], 'openai/gpt-4o', 100);
      expect(trimmed).toEqual([]);
    });

    it('should work with different providers', async () => {
      const simpleMessages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi' },
      ];
      
      const openaiTrimmed = await trimMessages(simpleMessages, 'openai/gpt-4o', 5);
      expect(openaiTrimmed.length).toBeGreaterThanOrEqual(0);
      
      const anthropicTrimmed = await trimMessages(simpleMessages, 'anthropic/claude-3-7-sonnet-20250219', 5);
      expect(anthropicTrimmed.length).toBeGreaterThanOrEqual(0);
      
      const googleTrimmed = await trimMessages(simpleMessages, 'google/gemini-1.5-pro', 5);
      expect(googleTrimmed.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported provider', async () => {
      await expect(countTokens('unsupported/model', 'test')).rejects.toThrow('Unsupported provider');
    });

    it('should throw error for invalid model format', async () => {
      await expect(countTokens('invalid', 'test')).rejects.toThrow('Invalid model format');
    });

    it('should throw error for missing API keys', async () => {
      configure({ openai: { apiKey: '' } });
      // Use embedding since token counting for OpenAI is local (tiktoken)
      await expect(embedText('openai/text-embedding-3-small', 'test')).rejects.toThrow('API key not found');
    });

    it('should provide helpful error messages for capability mismatches', async () => {
      // Test embedding with chat model
      await expect(embedText('openai/gpt-4o', 'test')).rejects.toThrow('does not support embedding functionality');
      
      // Test with unsupported model
      await expect(countTokens('openai/nonexistent-model', 'test')).rejects.toThrow('does not support tokenization functionality');
    });

    it('should handle provider-specific errors gracefully', async () => {
      // Test with obviously invalid API keys to trigger provider errors
      configure({ 
        openai: { apiKey: 'sk-invalid' },
        anthropic: { apiKey: 'sk-ant-invalid' },
        google: { apiKey: 'invalid' }
      });

      // These should fail with API errors, not library errors
      await expect(embedText('openai/text-embedding-3-small', 'test')).rejects.toThrow();
      await expect(countTokens('anthropic/claude-3-7-sonnet-20250219', 'test')).rejects.toThrow();
      await expect(countTokens('google/gemini-1.5-pro', 'test')).rejects.toThrow();
    });
  });
}); 