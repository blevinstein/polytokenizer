import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { VertexAIProvider } from '../../src/providers/vertex.js';
import { embedText, configure } from '../../src/index.js';

describe('VertexAIProvider', () => {
  let provider: VertexAIProvider;
  
  const mockCredentials = {
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'test-key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n',
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: 'test-client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  };
  
  beforeEach(() => {
    provider = new VertexAIProvider('test-project-id', 'us-central1', mockCredentials);
  });

  describe('Unit Tests', () => {
    describe('Provider Configuration', () => {
      it('should initialize with project ID and credentials', () => {
        expect(() => new VertexAIProvider('test-project', 'us-central1', mockCredentials)).not.toThrow();
      });

      it('should accept location parameter', () => {
        expect(() => new VertexAIProvider('test-project', 'europe-west1', mockCredentials)).not.toThrow();
      });

      it('should require credentials parameter', () => {
        expect(() => new VertexAIProvider('test-project', 'us-central1', undefined as any)).toThrow('Vertex AI credentials must be provided as a service account object');
      });

      it('should create provider instance', () => {
        const testProvider = new VertexAIProvider('test-project-id', 'us-central1', mockCredentials);
        expect(testProvider).toBeInstanceOf(VertexAIProvider);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for unsupported models', async () => {
        await expect(provider.embed('test text', 'vertex/unsupported-model'))
          .rejects
          .toThrow('Model vertex/unsupported-model is not supported by Vertex AI provider');
      });

      it('should handle authentication errors gracefully', async () => {
        // Provider with mock credentials should fail authentication
        await expect(provider.embed('test text', 'text-embedding-005'))
          .rejects
          .toThrow(/Vertex AI embedding failed/);
      });
    });
  });

  describe('Integration Tests', () => {
    const hasVertexConfig = !!(process.env.VERTEX_PROJECT_ID && process.env.VERTEX_CREDENTIALS);
    
    beforeAll(() => {
      if (hasVertexConfig) {
        let credentials;
        try {
          credentials = JSON.parse(process.env.VERTEX_CREDENTIALS!);
        } catch (error) {
          console.warn('VERTEX_CREDENTIALS is not valid JSON, skipping integration tests');
          return;
        }
        
        configure({ 
          vertex: { 
            projectId: process.env.VERTEX_PROJECT_ID!,
            location: process.env.VERTEX_LOCATION || 'us-central1',
            credentials: credentials
          } 
        });
      }
    });

    describe('Embeddings', () => {
      it.skipIf(!hasVertexConfig)('should generate embeddings for text-embedding-005', async () => {
        const result = await embedText('vertex/text-embedding-005', 'Hello world');
        
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(768); // text-embedding-005 dimension
        expect(result.model).toBe('vertex/text-embedding-005');
        expect(result.usage.tokens).toBeGreaterThan(0);
        expect(typeof result.usage.cost).toBe('number');
        
        // Check that vector contains numbers
        expect(result.vector.every(num => typeof num === 'number')).toBe(true);
      });

      it.skipIf(!hasVertexConfig)('should generate embeddings for gemini-embedding-001', async () => {
        const result = await embedText('vertex/gemini-embedding-001', 'Hello world');

        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(3072); // gemini-embedding-001 default dimension
        expect(result.model).toBe('vertex/gemini-embedding-001');
        expect(result.usage.tokens).toBeGreaterThan(0);
      });

      it.skipIf(!hasVertexConfig)('should generate embeddings for multilingual model', async () => {
        const result = await embedText('vertex/text-multilingual-embedding-002', 'Bonjour le monde');
        
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(768); // text-multilingual-embedding-002 dimension
        expect(result.model).toBe('vertex/text-multilingual-embedding-002');
        expect(result.usage.tokens).toBeGreaterThan(0);
      });

      it.skipIf(!hasVertexConfig)('should handle different text inputs', async () => {
        const shortResult = await embedText('vertex/text-embedding-005', 'Hi');
        const longResult = await embedText('vertex/text-embedding-005', 'This is a much longer text that should have more tokens and produce a different embedding vector');
        
        expect(longResult.usage.tokens).toBeGreaterThan(shortResult.usage.tokens);
        expect(longResult.vector.length).toBe(shortResult.vector.length);
        
        // Vectors should be different
        expect(longResult.vector).not.toEqual(shortResult.vector);
      });

      it.skipIf(!hasVertexConfig)('should handle empty text', async () => {
        await expect(embedText('vertex/text-embedding-005', ''))
          .rejects
          .toThrow('Text cannot be empty');
      });

      it.skipIf(!hasVertexConfig)('should reject whitespace-only text', async () => {
        await expect(embedText('vertex/text-embedding-005', '   \n\t  '))
          .rejects
          .toThrow('Text cannot be empty');
      });

      it.skipIf(!hasVertexConfig)('should handle very long text', async () => {
        const longText = 'This is a test sentence. '.repeat(200);
        const result = await embedText('vertex/text-embedding-005', longText);
        expect(result.vector).toBeDefined();
        expect(result.vector.length).toBe(768);
        expect(result.usage.tokens).toBeGreaterThan(100);
      });

      it.skipIf(!hasVertexConfig)('should handle special characters and unicode', async () => {
        const unicodeText = 'Hello 世界 🌍 Привет مرحبا';
        const result = await embedText('vertex/text-embedding-005', unicodeText);
        expect(result.vector).toBeDefined();
        expect(result.vector.length).toBe(768);
        expect(result.usage.tokens).toBeGreaterThan(0);
      });

      it.skipIf(!hasVertexConfig)('should reject invalid configuration', async () => {
        const invalidCredentials = { ...mockCredentials, project_id: 'invalid-project' };
        configure({ 
          vertex: { 
            projectId: 'invalid-project-id',
            location: 'us-central1',
            credentials: invalidCredentials
          } 
        });
        await expect(embedText('vertex/text-embedding-005', 'test')).rejects.toThrow();
        
        // Restore valid config if available
        if (hasVertexConfig) {
          let credentials;
          try {
            credentials = JSON.parse(process.env.VERTEX_CREDENTIALS!);
            configure({ 
              vertex: { 
                projectId: process.env.VERTEX_PROJECT_ID!,
                location: process.env.VERTEX_LOCATION || 'us-central1',
                credentials: credentials
              } 
            });
          } catch (error) {
            // Ignore restoration error
          }
        }
      });
    });

    describe('Multilingual Support', () => {
      it.skipIf(!hasVertexConfig)('should handle multilingual text with text-multilingual-embedding-002', async () => {
        const multilingualTexts = [
          { text: 'Hello world', lang: 'English' },
          { text: 'Bonjour le monde', lang: 'French' },
          { text: '你好世界', lang: 'Chinese' },
          { text: 'Привет мир', lang: 'Russian' },
          { text: 'مرحبا بالعالم', lang: 'Arabic' }
        ];
        
        for (const { text } of multilingualTexts) {
          const result = await embedText('vertex/text-multilingual-embedding-002', text);
          expect(result.vector).toBeDefined();
          expect(result.vector.length).toBe(768);
          expect(result.usage.tokens).toBeGreaterThan(0);
        }
      });

      it.skipIf(!hasVertexConfig)('should produce different embeddings for different languages', async () => {
        const english = await embedText('vertex/text-multilingual-embedding-002', 'Hello world');
        const french = await embedText('vertex/text-multilingual-embedding-002', 'Bonjour le monde');
        
        expect(english.vector).not.toEqual(french.vector);
        expect(english.vector.length).toBe(french.vector.length);
      });
    });

    describe('Cost Calculation Validation', () => {
      it.skipIf(!hasVertexConfig)('should calculate token-based cost for gemini-embedding-001', async () => {
        const shortText = 'Hi';
        const longText = 'This is a much longer text with many more words and characters that should result in more tokens.';
        
        const shortResult = await embedText('vertex/gemini-embedding-001', shortText);
        const longResult = await embedText('vertex/gemini-embedding-001', longText);
        
        expect(shortResult.usage.cost).toBeDefined();
        expect(longResult.usage.cost).toBeDefined();
        expect(longResult.usage.cost).toBeGreaterThan(shortResult.usage.cost!);
        expect(longResult.usage.tokens).toBeGreaterThan(shortResult.usage.tokens);
      });

      it.skipIf(!hasVertexConfig)('should calculate character-based cost for text-embedding-005', async () => {
        const text = 'Test';
        const result = await embedText('vertex/text-embedding-005', text);
        
        expect(result.usage.cost).toBeDefined();
        expect(result.usage.cost).toBeGreaterThan(0);
        
        const expectedCost = text.length * 0.000025e-3;
        expect(result.usage.cost).toBeCloseTo(expectedCost, 15);
      });

      it.skipIf(!hasVertexConfig)('should calculate character-based cost for multilingual models', async () => {
        const text = 'Hello world';
        const result = await embedText('vertex/text-multilingual-embedding-002', text);
        
        expect(result.usage.cost).toBeDefined();
        expect(result.usage.cost).toBeGreaterThan(0);
        
        const expectedCost = text.length * 0.000025e-3;
        expect(result.usage.cost).toBeCloseTo(expectedCost, 15);
      });

      it.skipIf(!hasVertexConfig)('should scale cost proportionally with text length', async () => {
        const shortText = 'Short';
        const mediumText = 'This is a medium length text';
        const longText = 'This is a much longer text that contains significantly more characters than the previous examples';
        
        const shortResult = await embedText('vertex/text-embedding-005', shortText);
        const mediumResult = await embedText('vertex/text-embedding-005', mediumText);
        const longResult = await embedText('vertex/text-embedding-005', longText);
        
        expect(mediumResult.usage.cost).toBeGreaterThan(shortResult.usage.cost!);
        expect(longResult.usage.cost).toBeGreaterThan(mediumResult.usage.cost!);
        
        const shortToMediumRatio = mediumResult.usage.cost! / shortResult.usage.cost!;
        const expectedRatio = mediumText.length / shortText.length;
        expect(shortToMediumRatio).toBeCloseTo(expectedRatio, 1);
      });
    });

    describe('Token Estimation', () => {
      it.skipIf(!hasVertexConfig)('should estimate tokens as approximately text.length / 4', async () => {
        const text = 'A'.repeat(100);
        const result = await embedText('vertex/text-embedding-005', text);
        
        const expectedTokens = Math.ceil(text.length / 4);
        expect(result.usage.tokens).toBe(expectedTokens);
      });

      it.skipIf(!hasVertexConfig)('should handle token estimation for various text lengths', async () => {
        const texts = [
          { text: 'Hi', expectedMin: 1 },
          { text: 'Hello world', expectedMin: 2 },
          { text: 'A'.repeat(40), expectedMin: 10 },
          { text: 'B'.repeat(400), expectedMin: 100 }
        ];
        
        for (const { text, expectedMin } of texts) {
          const result = await embedText('vertex/text-embedding-005', text);
          expect(result.usage.tokens).toBeGreaterThanOrEqual(expectedMin);
          expect(result.usage.tokens).toBe(Math.ceil(text.length / 4));
        }
      });

      it.skipIf(!hasVertexConfig)('should provide consistent token estimates across models', async () => {
        const text = 'This is a test sentence for token estimation.';
        
        const result1 = await embedText('vertex/text-embedding-005', text);
        const result2 = await embedText('vertex/text-multilingual-embedding-002', text);
        
        expect(result1.usage.tokens).toBe(result2.usage.tokens);
      });
    });

    describe('Model Dimension Verification', () => {
      it.skipIf(!hasVertexConfig)('should return correct dimensions for all supported models', async () => {
        const modelDimensions = [
          { model: 'vertex/gemini-embedding-001', dimensions: 3072 },
          { model: 'vertex/text-embedding-005', dimensions: 768 },
          { model: 'vertex/text-multilingual-embedding-002', dimensions: 768 }
        ];
        
        const text = 'Test text for dimension verification';
        
        for (const { model, dimensions } of modelDimensions) {
          const result = await embedText(model, text);
          expect(result.vector.length).toBe(dimensions);
        }
      });
    });
  });
}); 
