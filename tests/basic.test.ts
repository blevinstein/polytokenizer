import { describe, it, expect, beforeAll } from 'vitest';
import { embedText, countTokens, splitTextMaxTokens, trimMessages, configure } from '../src/index.js';

describe('PolyTokenizer', () => {
  beforeAll(() => {
    configure({
      openai: { apiKey: process.env.OPENAI_API_KEY || 'test-key' },
      anthropic: { apiKey: process.env.ANTHROPIC_API_KEY || 'test-key' },
      google: { apiKey: process.env.GOOGLE_API_KEY || 'test-key' },
    });
  });

  describe('Model parsing', () => {
    it('should parse provider/model format correctly', async () => {
      const invalidCalls = [
        () => countTokens('invalid-format', 'test'),
        () => countTokens('', 'test'),
      ];

      for (const call of invalidCalls) {
        await expect(call()).rejects.toThrow('Invalid model format');
      }
    });
  });

  describe('Token counting', () => {
    it('should count tokens for OpenAI models', async () => {
      const count = await countTokens('openai/gpt-4o', 'Hello world');
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

  describe('Text embeddings', () => {
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
      expect(longResult.vector.length).toBe(shortResult.vector.length); // Same model should return same dimension
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
  });

  describe('Error handling', () => {
    it('should throw error for unsupported provider', async () => {
      await expect(countTokens('unsupported/model', 'test')).rejects.toThrow('Unsupported provider');
    });

    it('should throw error for invalid model format', async () => {
      await expect(countTokens('invalid', 'test')).rejects.toThrow('Invalid model format');
    });
  });
}); 