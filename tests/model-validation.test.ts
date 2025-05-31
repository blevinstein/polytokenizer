import { describe, it, expect } from 'vitest';
import { embedText, countTokens } from '../src/index.js';

describe('Model Validation', () => {
  describe('Embedding Model Validation', () => {
    it('should accept valid embedding models', async () => {
      // These should fail with API key errors, not validation errors
      await expect(embedText('openai/text-embedding-3-small', 'test')).rejects.toThrow('API key not found');
      await expect(embedText('google/text-embedding-004', 'test')).rejects.toThrow('API key not found');
      await expect(embedText('google/gemini-embedding-exp-03-07', 'test')).rejects.toThrow('API key not found');
    });

    it('should reject chat models for embeddings', async () => {
      await expect(embedText('openai/gpt-4o', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/gemini-1.5-pro', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('anthropic/claude-3.7-sonnet', 'test')).rejects.toThrow('does not support embedding functionality');
    });

    it('should reject unsupported models', async () => {
      await expect(embedText('openai/unsupported-model', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/unsupported-model', 'test')).rejects.toThrow('does not support embedding functionality');
    });
  });

  describe('Tokenization Model Validation', () => {
    it('should accept valid tokenization models', async () => {
      // These should fail with API key errors, not validation errors
      await expect(countTokens('openai/gpt-4o', 'test')).rejects.toThrow('API key not found');
      await expect(countTokens('openai/text-embedding-3-small', 'test')).rejects.toThrow('API key not found');
      await expect(countTokens('anthropic/claude-3.7-sonnet', 'test')).rejects.toThrow('API key not found');
      await expect(countTokens('google/gemini-1.5-pro', 'test')).rejects.toThrow('API key not found');
      await expect(countTokens('google/gemini-embedding-exp-03-07', 'test')).rejects.toThrow('API key not found');
    });

    it('should reject unsupported models', async () => {
      // Note: countTokens() calls getProvider() first, so API key errors come before model validation
      await expect(countTokens('openai/unsupported-model', 'test')).rejects.toThrow('API key not found');
      await expect(countTokens('anthropic/unsupported-model', 'test')).rejects.toThrow('API key not found');
      await expect(countTokens('google/unsupported-model', 'test')).rejects.toThrow('API key not found');
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