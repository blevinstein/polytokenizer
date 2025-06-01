import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { embedText, countTokens, configure } from '../src/index.js';

describe('PolyTokenizer Core', () => {
  let originalConfig: any;

  beforeEach(() => {
    // Save current configuration
    originalConfig = {
      openai: { apiKey: process.env.OPENAI_API_KEY },
      anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
      google: { apiKey: process.env.GEMINI_API_KEY },
      vertex: process.env.VERTEX_PROJECT_ID ? {
        projectId: process.env.VERTEX_PROJECT_ID,
        location: process.env.VERTEX_LOCATION || 'us-central1',
        credentials: JSON.parse(process.env.VERTEX_CREDENTIALS || '{}')
      } : undefined
    };
  });

  afterEach(() => {
    // Restore original configuration
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
      await expect(embedText('anthropic/claude-3-5-sonnet-latest', 'test')).rejects.toThrow('does not support embedding functionality');
      await expect(embedText('google/gemini-1.5-pro', 'test')).rejects.toThrow('does not support embedding functionality');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported provider', async () => {
      await expect(countTokens('unsupported/model', 'test')).rejects.toThrow('Unsupported provider');
    });

    it('should throw error for invalid model format', async () => {
      await expect(countTokens('invalid', 'test')).rejects.toThrow('Invalid model format');
    });

    it('should provide helpful error messages for capability mismatches', async () => {
      // Test embedding with chat model
      await expect(embedText('openai/gpt-4o', 'test')).rejects.toThrow('does not support embedding functionality');
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
    });
  });
}); 