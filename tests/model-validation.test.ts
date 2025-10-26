import { describe, it, expect } from 'vitest';
import { embedText, countTokens } from '../src/index.js';

describe('Model Validation', () => {
  describe('Embedding Model Validation', () => {
    it('should accept valid embedding models', async () => {
      // These should work with proper API keys configured
      const result1 = await embedText('openai/text-embedding-3-small', 'test');
      expect(result1.vector).toBeDefined();
      expect(Array.isArray(result1.vector)).toBe(true);
      
      const result2 = await embedText('google/text-embedding-004', 'test');
      expect(result2.vector).toBeDefined();
      expect(Array.isArray(result2.vector)).toBe(true);
      
      const result3 = await embedText('google/gemini-embedding-exp-03-07', 'test');
      expect(result3.vector).toBeDefined();
      expect(Array.isArray(result3.vector)).toBe(true);
    });

    it('should reject chat models for embeddings', async () => {
      await expect(embedText('openai/gpt-4o', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/gemini-2.5-pro', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('anthropic/claude-3-5-sonnet-latest', 'test')).rejects.toThrow('does not support embedding functionality');
    });

    it('should reject unsupported models', async () => {
      await expect(embedText('openai/unsupported-model', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/unsupported-model', 'test')).rejects.toThrow('does not support embedding functionality');
    });
  });

  describe('Tokenization Model Validation', () => {
    it('should accept valid tokenization models', async () => {
      // These should work with proper API keys configured
      const openaiResult = await countTokens('openai/gpt-4o', 'test');
      expect(typeof openaiResult).toBe('number');
      expect(openaiResult).toBeGreaterThan(0);

      const openaiEmbedResult = await countTokens('openai/text-embedding-3-small', 'test');
      expect(typeof openaiEmbedResult).toBe('number');
      expect(openaiEmbedResult).toBeGreaterThan(0);

      const anthropicResult = await countTokens('anthropic/claude-3-5-sonnet-latest', 'test');
      expect(typeof anthropicResult).toBe('number');
      expect(anthropicResult).toBeGreaterThan(0);

      const googleResult = await countTokens('google/gemini-2.5-flash', 'test');
      expect(typeof googleResult).toBe('number');
      expect(googleResult).toBeGreaterThan(0);
    });

    it('should reject unsupported models', async () => {
      // These should fail with model validation errors, not API key errors
      await expect(countTokens('unsupported-provider/model', 'test')).rejects.toThrow('does not support tokenization functionality');
      await expect(countTokens('fake-provider/some-model', 'test')).rejects.toThrow('does not support tokenization functionality');
      await expect(countTokens('invalid/test-model', 'test')).rejects.toThrow('does not support tokenization functionality');
    });
  });

  describe('Model Format Validation', () => {
    it('should reject invalid model formats', async () => {
      await expect(embedText('invalid-format', 'test')).rejects.toThrow('Invalid model format');
      await expect(countTokens('invalid-format', 'test')).rejects.toThrow('Invalid model format');
    });

    it('should reject unsupported providers', async () => {
      // Both functions now check model capability which provides consistent error messages
      await expect(embedText('unsupported/model', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(countTokens('unsupported/model', 'test')).rejects.toThrow('does not support tokenization functionality');
    });
  });
}); 