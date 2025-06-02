/// <reference types="node" />

import async from 'async';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GoogleProvider } from './providers/google.js';
import { VertexAIProvider } from './providers/vertex.js';
import { EMBEDDING_MODELS, TOKENIZATION_MODELS } from './constants/models.js';
import type { EmbeddingResult, LibraryConfig, Message, TruncateOptions, SplitTextOptions } from './types/index.js';

interface ProviderInstances {
  openai?: OpenAIProvider;
  anthropic?: AnthropicProvider;
  google?: GoogleProvider;
  vertex?: VertexAIProvider;
}

let config: LibraryConfig = {};
let providers: ProviderInstances = {};

function parseModel(model: string): { provider: string; modelName: string } {
  const parts = model.split('/');
  if (parts.length < 2) {
    throw new Error(`Invalid model format: ${model}. Expected format: provider/model`);
  }
  return { provider: parts[0], modelName: parts[1] };
}

function validateModelCapability(provider: string, modelName: string, capability: 'embedding' | 'tokenization'): void {
  const models = capability === 'embedding' ? EMBEDDING_MODELS : TOKENIZATION_MODELS;
  const supportedModels = models[provider] || [];
  
  if (!supportedModels.includes(modelName)) {
    throw new Error(`Model ${provider}/${modelName} does not support ${capability} functionality`);
  }
}

function getProvider(providerName: string): OpenAIProvider | AnthropicProvider | GoogleProvider | VertexAIProvider {
  // Check if provider is supported before checking API keys
  if (!['openai', 'anthropic', 'google', 'vertex'].includes(providerName)) {
    throw new Error(`Unsupported provider: ${providerName}`);
  }

  if (!providers[providerName as keyof ProviderInstances]) {
    if (providerName === 'vertex') {
      const vertexConfig = config.vertex;
      if (!vertexConfig?.projectId) {
        throw new Error(`Vertex AI configuration missing. Set projectId in configure() call.`);
      }
      providers.vertex = new VertexAIProvider(
        vertexConfig.projectId,
        vertexConfig.location,
        vertexConfig.credentials
      );
    } else {
      const providerConfig = config[providerName as 'openai' | 'anthropic' | 'google'];
      
      // Map provider names to their correct environment variable names
      const envVarMap = {
        'openai': 'OPENAI_API_KEY',
        'anthropic': 'ANTHROPIC_API_KEY',
        'google': 'GEMINI_API_KEY'
      };
      
      const apiKey = providerConfig?.apiKey || process.env[envVarMap[providerName as keyof typeof envVarMap]];
      
      if (!apiKey) {
        const envVarName = envVarMap[providerName as keyof typeof envVarMap];
        throw new Error(`API key not found for provider ${providerName}. Set ${envVarName} environment variable or call configure().`);
      }

      switch (providerName) {
        case 'openai':
          providers.openai = new OpenAIProvider(apiKey, providerConfig?.baseURL);
          break;
        case 'anthropic':
          providers.anthropic = new AnthropicProvider(apiKey, providerConfig?.baseURL);
          break;
        case 'google':
          providers.google = new GoogleProvider(apiKey);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }
    }
  }

  return providers[providerName as keyof ProviderInstances]!;
}

export function configure(newConfig: LibraryConfig): void {
  config = { ...config, ...newConfig };
  providers = {};
}

export async function embedText(model: string, text: string): Promise<EmbeddingResult> {
  const { provider, modelName } = parseModel(model);
  
  // Validate that the model supports embeddings
  validateModelCapability(provider, modelName, 'embedding');
  
  const providerInstance = getProvider(provider);
  
  if (!('embed' in providerInstance)) {
    throw new Error(`Provider ${provider} does not support embeddings`);
  }
  
  return providerInstance.embed(text, modelName);
}

export async function countTokens(model: string, text: string): Promise<number> {
  const { provider, modelName } = parseModel(model);
  const providerInstance = getProvider(provider);
  
  // Validate that the model supports tokenization
  validateModelCapability(provider, modelName, 'tokenization');
  
  if (provider === 'openai' && providerInstance instanceof OpenAIProvider) {
    const tokenizer = providerInstance.getTokenizer(modelName);
    return tokenizer.count(text);
  } else if (provider === 'anthropic' && providerInstance instanceof AnthropicProvider) {
    return providerInstance.countTokens(modelName, text);
  } else if (provider === 'google' && providerInstance instanceof GoogleProvider) {
    return providerInstance.countTokens(modelName, text);
  }
  
  throw new Error(`Token counting not supported for provider: ${provider}`);
}

export async function splitTextMaxTokens(model: string, text: string, maxTokens: number, options: SplitTextOptions = {}): Promise<string[]> {
  const { preserveSentences = true, preserveWords = true } = options;

  if (!text || maxTokens <= 0) {
    return text ? [text] : [];
  }

  const tokenCount = await countTokens(model, text);
  if (tokenCount <= maxTokens) {
    return [text];
  }
  let parts = [{ text, tokens: tokenCount }];

  const splitters = [];
  if (preserveSentences) splitters.push(/\n+/g, /(?<=\w[.?!])\s+/g);
  if (preserveWords) splitters.push(/\s+/g);

  // Splitters are used in order (earlier splitters are preferred)
  for (const splitter of splitters) {
    parts = await async.flatMap(parts, async (part: { text: string; tokens: number }) => {
        // Parts which are already under max tokens are returned as-is
        if (part.tokens <= maxTokens) return [part];
        
        // Split larger part into segments and count the tokens for each segment
        return await async.map(
            part.text.split(splitter),
            async (segment: string) => ({ text: segment, tokens: await countTokens(model, segment) }));
      });
  }

  const oversizedParts = parts.filter(p => p.tokens > maxTokens);
  if (oversizedParts.length > 0) {
    throw new Error(`Failed to split text into chunks of ${maxTokens} tokens. Some segments are still too large.`);
  }

  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const part of parts) {
    if (currentTokens + part.tokens <= maxTokens) {
      currentChunk += (currentChunk ? '\n' : '') + part.text;
      currentTokens += part.tokens;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = part.text;
      currentTokens = part.tokens;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export async function trimMessages(messages: Message[], model: string, maxTokens: number, options: TruncateOptions = {}): Promise<Message[]> {
  const { strategy = 'early', preserveSystem = true } = options;
  
  if (messages.length === 0) return [];

  const messageTokens = await async.map(messages, async (message: Message) => {
    const tokens = await countTokens(model, message.content);
    return { message, tokens };
  });

  const totalTokens = messageTokens.reduce((sum, m) => sum + m.tokens, 0);

  if (totalTokens <= maxTokens) {
    return messages;
  }

  const systemMessages = messageTokens.filter(m => m.message.role === 'system');
  const nonSystemMessages = messageTokens.filter(m => m.message.role !== 'system');

  let systemTokens = 0;
  if (preserveSystem) {
    systemTokens = systemMessages.reduce((sum, m) => sum + m.tokens, 0);
  }

  const availableTokens = maxTokens - systemTokens;
  if (availableTokens <= 0) {
    return preserveSystem ? systemMessages.map(m => m.message) : [];
  }

  let selectedMessages: { message: Message; tokens: number }[] = [];
  let selectedTokens = 0;

  if (strategy === 'early') {
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i];
      if (selectedTokens + msg.tokens <= availableTokens) {
        selectedMessages.unshift(msg);
        selectedTokens += msg.tokens;
      } else {
        break;
      }
    }
  } else if (strategy === 'late') {
    for (const msg of nonSystemMessages) {
      if (selectedTokens + msg.tokens <= availableTokens) {
        selectedMessages.push(msg);
        selectedTokens += msg.tokens;
      } else {
        break;
      }
    }
  }

  const result = [
    ...(preserveSystem ? systemMessages : []),
    ...selectedMessages
  ].sort((a, b) => {
    const aIndex = messageTokens.findIndex(m => m === a);
    const bIndex = messageTokens.findIndex(m => m === b);
    return aIndex - bIndex;
  });

  return result.map(m => m.message);
} 