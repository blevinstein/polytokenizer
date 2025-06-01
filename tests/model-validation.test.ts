import { describe, it, expect } from 'vitest';
import { embedText, countTokens } from '../src/index.js';

describe('Model Validation', () => {
  describe('Embedding Model Validation', () => {
    it('should accept valid embedding models', async () => {
      // These should either work (with API keys) or fail with API key errors (without API keys)
      // We test that they don't fail with model validation errors
      try {
        await embedText('openai/text-embedding-3-small', 'test');
        // If it succeeds, that's fine - we have API keys
      } catch (error) {
        // If it fails, it should be an API key error, not a model validation error
        expect(error.message).not.toMatch(/does not support embedding functionality/);
        expect(error.message).not.toMatch(/Invalid model format/);
      }

      try {
        await embedText('google/text-embedding-004', 'test');
      } catch (error) {
        expect(error.message).not.toMatch(/does not support embedding functionality/);
        expect(error.message).not.toMatch(/Invalid model format/);
      }

      try {
        await embedText('google/gemini-embedding-exp-03-07', 'test');
      } catch (error) {
        expect(error.message).not.toMatch(/does not support embedding functionality/);
        expect(error.message).not.toMatch(/Invalid model format/);
      }
    });

    it('should reject chat models for embeddings', async () => {
      await expect(embedText('openai/gpt-4o', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/gemini-1.5-pro', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('anthropic/claude-3-5-sonnet-latest', 'test')).rejects.toThrow('does not support embedding functionality');
    });

    it('should reject unsupported models', async () => {
      await expect(embedText('openai/unsupported-model', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/unsupported-model', 'test')).rejects.toThrow('does not support embedding functionality');
    });
  });

  describe('Tokenization Model Validation', () => {
    it('should accept valid tokenization models', async () => {
      // OpenAI tokenization works locally, so it should return a number
      const openaiResult = await countTokens('openai/gpt-4o', 'test');
      expect(typeof openaiResult).toBe('number');
      expect(openaiResult).toBeGreaterThan(0);

      const openaiEmbedResult = await countTokens('openai/text-embedding-3-small', 'test');
      expect(typeof openaiEmbedResult).toBe('number');
      expect(openaiEmbedResult).toBeGreaterThan(0);

      // Anthropic models require API keys
      try {
        const anthropicResult = await countTokens('anthropic/claude-3-5-sonnet-latest', 'test');
        expect(typeof anthropicResult).toBe('number');
        expect(anthropicResult).toBeGreaterThan(0);
      } catch (error) {
        // If it fails, it should be an API key error, not a model validation error
        expect(error.message).not.toMatch(/does not support tokenization functionality/);
        expect(error.message).not.toMatch(/Invalid model format/);
      }

      try {
        const googleResult = await countTokens('google/gemini-1.5-pro', 'test');
        expect(typeof googleResult).toBe('number');
        expect(googleResult).toBeGreaterThan(0);
      } catch (error) {
        expect(error.message).not.toMatch(/does not support tokenization functionality/);
        expect(error.message).not.toMatch(/Invalid model format/);
      }

      try {
        const googleEmbedResult = await countTokens('google/gemini-embedding-exp-03-07', 'test');
        expect(typeof googleEmbedResult).toBe('number');
        expect(googleEmbedResult).toBeGreaterThan(0);
      } catch (error) {
        expect(error.message).not.toMatch(/does not support tokenization functionality/);
        expect(error.message).not.toMatch(/Invalid model format/);
      }
    });

    it('should reject unsupported models', async () => {
      // These should fail with model validation errors, not API key errors
      await expect(countTokens('openai/unsupported-model', 'test')).rejects.toThrow('does not support tokenization functionality');
      await expect(countTokens('anthropic/unsupported-model', 'test')).rejects.toThrow('does not support tokenization functionality');
      await expect(countTokens('google/unsupported-model', 'test')).rejects.toThrow('does not support tokenization functionality');
    });
  });

  describe('Model Format Validation', () => {
    it('should reject invalid model formats', async () => {
      await expect(embedText('invalid-format', 'test')).rejects.toThrow('Invalid model format');
      await expect(countTokens('invalid-format', 'test')).rejects.toThrow('Invalid model format');
    });

    it('should reject unsupported providers', async () => {
      // Note: embedText() validates model capability first, so unsupported providers get model capability errors
      await expect(embedText('unsupported/model', 'test')).rejects.toThrow('does not support embedding functionality');
      // countTokens() calls getProvider() first, so it gets the "Unsupported provider" error
      await expect(countTokens('unsupported/model', 'test')).rejects.toThrow('Unsupported provider');
    });
  });
}); 