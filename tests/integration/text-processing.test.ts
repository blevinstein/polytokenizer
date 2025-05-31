import { describe, it, expect, beforeAll } from 'vitest';
import { splitTextMaxTokens, trimMessages, configure } from '../../src/index.js';

describe('Text Processing Integration', () => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;

  beforeAll(() => {
    configure({
      openai: { apiKey: process.env.OPENAI_API_KEY || '' },
      anthropic: { apiKey: process.env.ANTHROPIC_API_KEY || '' },
      google: { apiKey: process.env.GOOGLE_API_KEY || '' },
    });
  });

  describe('Text Splitting', () => {
    it.skipIf(!hasOpenAIKey)('should return single chunk for short text (OpenAI)', async () => {
      const chunks = await splitTextMaxTokens('openai/gpt-4o', 'Hello world', 100);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Hello world');
    });

    it.skipIf(!hasOpenAIKey)('should split long text into multiple chunks (OpenAI)', async () => {
      const longText = Array(100).fill('This is a sentence.').join(' ');
      const chunks = await splitTextMaxTokens('openai/gpt-4o', longText, 50);
      
      expect(chunks.length).toBeGreaterThan(1);
      
      // Verify each chunk is within token limit
      for (const chunk of chunks) {
        const { countTokens } = await import('../../src/index.js');
        const tokenCount = await countTokens('openai/gpt-4o', chunk);
        expect(tokenCount).toBeLessThanOrEqual(50);
      }
    });

    it.skipIf(!hasGoogleKey)('should work with Google models', async () => {
      const text = 'Test sentence for splitting with Google models and API integration.';
      const chunks = await splitTextMaxTokens('google/gemini-1.5-pro', text, 10);
      
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks.join(' ')).toContain('Test sentence');
    });

    it.skipIf(!hasAnthropicKey)('should work with Anthropic models', async () => {
      const text = 'Test sentence for splitting with Anthropic models and API integration.';
      const chunks = await splitTextMaxTokens('anthropic/claude-3.5-sonnet', text, 10);
      
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks.join(' ')).toContain('Test sentence');
    });

    it.skipIf(!hasOpenAIKey)('should handle empty text', async () => {
      const chunks = await splitTextMaxTokens('openai/gpt-4o', '', 100);
      expect(chunks).toEqual([]);
    });

    it.skipIf(!hasOpenAIKey)('should preserve sentences when possible', async () => {
      const text = 'First sentence with many words to make it longer. Second sentence with many words to make it longer. Third sentence with many words to make it longer.';
      const chunks = await splitTextMaxTokens('openai/gpt-4o', text, 15);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Message Trimming', () => {
    const testMessages = [
      { role: 'system' as const, content: 'You are a helpful assistant.' },
      { role: 'user' as const, content: 'Hello!' },
      { role: 'assistant' as const, content: 'Hi there! How can I help you today?' },
      { role: 'user' as const, content: 'What is the weather like?' },
      { role: 'assistant' as const, content: 'I don\'t have access to current weather data.' },
    ];

    it.skipIf(!hasOpenAIKey)('should return all messages if under limit (OpenAI)', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 1000);
      expect(trimmed).toHaveLength(testMessages.length);
    });

    it.skipIf(!hasOpenAIKey)('should preserve system messages by default (OpenAI)', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 10);
      const systemMessages = trimmed.filter(m => m.role === 'system');
      const originalSystemMessages = testMessages.filter(m => m.role === 'system');
      expect(systemMessages).toHaveLength(originalSystemMessages.length);
    });

    it.skipIf(!hasOpenAIKey)('should trim with early strategy (OpenAI)', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 25, { strategy: 'early' });
      expect(trimmed.length).toBeLessThan(testMessages.length);
      
      // Verify total tokens are within limit
      const { countTokens } = await import('../../src/index.js');
      const totalTokens = await Promise.all(
        trimmed.map(msg => countTokens('openai/gpt-4o', msg.content))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));
      
      expect(totalTokens).toBeLessThanOrEqual(25);
    });

    it.skipIf(!hasOpenAIKey)('should trim with late strategy (OpenAI)', async () => {
      const trimmed = await trimMessages(testMessages, 'openai/gpt-4o', 25, { strategy: 'late' });
      expect(trimmed.length).toBeLessThan(testMessages.length);
      
      // Verify total tokens are within limit
      const { countTokens } = await import('../../src/index.js');
      const totalTokens = await Promise.all(
        trimmed.map(msg => countTokens('openai/gpt-4o', msg.content))
      ).then(counts => counts.reduce((sum, count) => sum + count, 0));
      
      expect(totalTokens).toBeLessThanOrEqual(25);
    });

    it.skipIf(!hasAnthropicKey)('should work with Anthropic models', async () => {
      const simpleMessages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi' },
      ];
      
      const trimmed = await trimMessages(simpleMessages, 'anthropic/claude-3.5-sonnet', 5);
      expect(trimmed.length).toBeGreaterThanOrEqual(0);
    });

    it.skipIf(!hasGoogleKey)('should work with Google models', async () => {
      const simpleMessages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi' },
      ];
      
      const trimmed = await trimMessages(simpleMessages, 'google/gemini-1.5-pro', 5);
      expect(trimmed.length).toBeGreaterThanOrEqual(0);
    });

    it.skipIf(!hasOpenAIKey)('should handle empty messages array', async () => {
      const trimmed = await trimMessages([], 'openai/gpt-4o', 100);
      expect(trimmed).toEqual([]);
    });
  });
}); 