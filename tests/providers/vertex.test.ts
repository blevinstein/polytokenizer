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
    describe('Supported Models', () => {
      it('should have supported models', () => {
        expect(provider.supportedModels).toBeDefined();
        expect(Array.isArray(provider.supportedModels)).toBe(true);
        expect(provider.supportedModels).toContain('text-embedding-005');
        expect(provider.supportedModels).toContain('text-embedding-004');
        expect(provider.supportedModels).toContain('text-multilingual-embedding-002');
      });
    });

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
        expect(testProvider.supportedModels).toBeDefined();
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
        await expect(provider.embed('test text', 'vertex/text-embedding-005'))
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

      it.skipIf(!hasVertexConfig)('should generate embeddings for text-embedding-004', async () => {
        const result = await embedText('vertex/text-embedding-004', 'Hello world');
        
        expect(result.vector).toBeDefined();
        expect(Array.isArray(result.vector)).toBe(true);
        expect(result.vector.length).toBe(768); // text-embedding-004 dimension
        expect(result.model).toBe('vertex/text-embedding-004');
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
  });
}); 