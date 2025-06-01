import { GoogleAuth } from 'google-auth-library';
import type { EmbeddingResult, EmbeddingProvider, ProviderError } from '../types/index.js';

const EMBEDDING_MODELS = [
  'text-embedding-005',         // Default embedding model, 768 dimensions, 2048 tokens
  'text-embedding-004',         // 768 dimensions
  'text-multilingual-embedding-002', // 768 dimensions, multilingual
];

const EMBEDDING_COSTS = {
  'text-embedding-005': 0.00002e-3, // $0.00002 per 1K characters
  'text-embedding-004': 0.00002e-3, // $0.00002 per 1K characters  
  'text-multilingual-embedding-002': 0.00002e-3, // $0.00002 per 1K characters
} as const;

interface VertexAIPredictRequest {
  instances: Array<{
    content: string;
    task_type?: string;
  }>;
}

interface VertexAIPredictResponse {
  predictions: Array<{
    embeddings: {
      values: number[];
    };
  }>;
}

export class VertexAIProvider implements EmbeddingProvider {
  private auth: GoogleAuth;
  private projectId: string;
  private location: string;

  constructor(projectId: string, location: string = 'us-central1', credentials: any) {
    this.projectId = projectId;
    this.location = location;
    
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Vertex AI credentials must be provided as a service account object');
    }

    this.auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  get supportedModels(): string[] {
    return EMBEDDING_MODELS;
  }

  async embed(text: string, model: string): Promise<EmbeddingResult> {
    // Remove 'vertex/' prefix if present
    const modelName = model.replace('vertex/', '');
    
    if (!this.supportedModels.includes(modelName)) {
      throw new Error(`Model ${model} is not supported by Vertex AI provider`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      const client = await this.auth.getAccessToken();
      if (!client) {
        throw new Error('Failed to get access token');
      }

      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${modelName}:predict`;

      const requestBody: VertexAIPredictRequest = {
        instances: [
          {
            content: text,
            task_type: 'RETRIEVAL_DOCUMENT'
          }
        ]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: VertexAIPredictResponse = await response.json();

      if (!data.predictions || data.predictions.length === 0) {
        throw new Error('No embeddings returned from Vertex AI API');
      }

      const embedding = data.predictions[0];
      if (!embedding.embeddings || !embedding.embeddings.values) {
        throw new Error('Invalid embedding format returned from Vertex AI API');
      }

      // Calculate usage and cost
      const tokens = Math.ceil(text.length / 4); // Rough estimate: 4 chars per token
      const cost = text.length * (EMBEDDING_COSTS[modelName as keyof typeof EMBEDDING_COSTS] || 0);

      return {
        vector: embedding.embeddings.values,
        model: `vertex/${modelName}`,
        usage: {
          tokens,
          cost
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Vertex AI embedding failed: ${errorMessage}`) as ProviderError;
    }
  }
} 