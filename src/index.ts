/// <reference types="node" />

import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GoogleProvider } from './providers/google.js';
import type { EmbeddingResult, LibraryConfig, Message, TruncateOptions, SplitTextOptions } from './types/index.js';

interface ProviderInstances {
  openai?: OpenAIProvider;
  anthropic?: AnthropicProvider;
  google?: GoogleProvider;
}

let config: LibraryConfig = {};
let providers: ProviderInstances = {};

const EMBEDDING_MODELS: Record<string, string[]> = {
  openai: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  google: ['gemini-embedding-exp-03-07', 'text-embedding-004', 'embedding-001'],
  anthropic: [] // Anthropic doesn't have public embedding API
};

// Models that support tokenization (both chat and embedding models)
const TOKENIZATION_MODELS: Record<string, string[]> = {
  openai: [
    // Latest models (o200k_base tokenizer)
    'gpt-4.1', 'gpt-4.1-mini', 'o4-mini', 'o3', 'o1', 'o1-preview', 'o1-mini', 
    'gpt-4o', 'gpt-4o-mini',
    // Older models (cl100k_base tokenizer)
    'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo',
    // Embedding models (cl100k_base tokenizer)
    'text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'
  ],
  anthropic: [
    // Claude 4 series
    'claude-4-opus', 'claude-4-sonnet',
    // Claude 3 series (using shorter aliases)
    'claude-3.7-sonnet', 'claude-3.5-sonnet', 'claude-3.5-haiku', 
    'claude-3-opus', 'claude-3-haiku'
  ],
  google: [
    // Gemini chat models
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 
    'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b',
    // Embedding models
    'gemini-embedding-exp-03-07', 'text-embedding-004', 'embedding-001'
  ]
};

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

function getProvider(providerName: string): OpenAIProvider | AnthropicProvider | GoogleProvider {
  // Check if provider is supported before checking API keys
  if (!['openai', 'anthropic', 'google'].includes(providerName)) {
    throw new Error(`Unsupported provider: ${providerName}`);
  }

  if (!providers[providerName as keyof ProviderInstances]) {
    const providerConfig = config[providerName as keyof LibraryConfig];
    const apiKey = providerConfig?.apiKey || process.env[`${providerName.toUpperCase()}_API_KEY`];
    
    if (!apiKey) {
      throw new Error(`API key not found for provider ${providerName}. Set ${providerName.toUpperCase()}_API_KEY environment variable or call configure().`);
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
  if (!text || maxTokens <= 0) {
    return text ? [text] : [];
  }

  const tokenCount = await countTokens(model, text);
  if (tokenCount <= maxTokens) {
    return [text];
  }

  const { preserveSentences = true, preserveWords = true } = options;
  let parts = [{ text, tokens: tokenCount }];

  const splitters = [];
  if (preserveSentences) splitters.push(/\n+/g, /(?<=\w[.?!])\s+/g);
  if (preserveWords) splitters.push(/\s+/g);

  for (const splitter of splitters) {
    parts = await Promise.all(
      parts.flatMap(async (part) => {
        if (part.tokens <= maxTokens) return [part];
        
        const segments = part.text.split(splitter);
        const segmentParts = [];
        for (const segment of segments) {
          const segmentTokens = await countTokens(model, segment);
          segmentParts.push({ text: segment, tokens: segmentTokens });
        }
        return segmentParts;
      })
    ).then(results => results.flat());
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

  let totalTokens = 0;
  const messageTokens: { message: Message; tokens: number }[] = [];
  
  for (const message of messages) {
    const tokens = await countTokens(model, message.content);
    messageTokens.push({ message, tokens });
    totalTokens += tokens;
  }

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