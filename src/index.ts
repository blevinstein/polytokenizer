/// <reference types="node" />

import async from 'async';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GoogleProvider } from './providers/google.js';
import { VertexAIProvider } from './providers/vertex.js';
import { EMBEDDING_MODELS, TOKENIZATION_PROVIDERS, EMBEDDING_PROVIDERS, EMBEDDING_LIMITS, EMBEDDING_DIMENSIONS, CONTEXT_LIMITS } from './constants/models.js';
import type { EmbeddingResult, LibraryConfig, Message, TruncateOptions, SplitTextOptions, TokenizerProvider, EmbeddingProvider } from './types/index.js';

type ProviderInstance = OpenAIProvider | AnthropicProvider | GoogleProvider | VertexAIProvider;

interface ProviderInstances {
  openai?: ProviderInstance;
  anthropic?: ProviderInstance;
  google?: ProviderInstance;
  vertex?: ProviderInstance;
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

function createProvider(providerName: string): OpenAIProvider | AnthropicProvider | GoogleProvider | VertexAIProvider {
  if (providerName === 'vertex') {
    const vertexConfig = config.vertex;
    if (!vertexConfig?.projectId) {
      throw new Error(`Vertex AI configuration missing. Set projectId in configure() call.`);
    }
    return new VertexAIProvider(
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
        return new OpenAIProvider(apiKey, providerConfig?.baseURL);
      case 'anthropic':
        return new AnthropicProvider(apiKey, providerConfig?.baseURL);
      case 'google':
        return new GoogleProvider(apiKey);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
}

function getTokenizerProvider(providerName: string): TokenizerProvider {
  // Check if provider is supported before checking API keys
  if (!TOKENIZATION_PROVIDERS.includes(providerName as any)) {
    throw new Error(`Provider ${providerName} does not support tokenization`);
  }

  if (!providers[providerName as keyof ProviderInstances]) {
    providers[providerName as keyof ProviderInstances] = createProvider(providerName);
  }

  const provider = providers[providerName as keyof ProviderInstances];
  if (!provider) {
    throw new Error(`Failed to create provider: ${providerName}`);
  }

  return provider as TokenizerProvider;
}

function getEmbeddingProvider(providerName: string): EmbeddingProvider {
  // Check if provider is supported before checking API keys
  if (!EMBEDDING_PROVIDERS.includes(providerName as any)) {
    throw new Error(`Provider ${providerName} does not support embeddings`);
  }

  if (!providers[providerName as keyof ProviderInstances]) {
    providers[providerName as keyof ProviderInstances] = createProvider(providerName);
  }

  const provider = providers[providerName as keyof ProviderInstances];
  if (!provider) {
    throw new Error(`Failed to create provider: ${providerName}`);
  }

  return provider as EmbeddingProvider;
}

export function configure(newConfig: LibraryConfig): void {
  config = { ...config, ...newConfig };
  providers = {};
}

export async function embedText(model: string, text: string, dimensions?: number): Promise<EmbeddingResult> {
  const { provider, modelName } = parseModel(model); // This throws format error if invalid

  if (!EMBEDDING_MODELS.includes(model as any)) {
    throw new Error(`Model ${model} does not support embedding functionality`);
  }

  const providerInstance = getEmbeddingProvider(provider);

  return providerInstance.embed(text, modelName, dimensions);
}

export async function countTokens(model: string, text: string): Promise<number> {
  const { provider, modelName } = parseModel(model); // This throws format error if invalid

  if (!TOKENIZATION_PROVIDERS.includes(provider as any)) {
    throw new Error(`Provider ${provider} does not support tokenization functionality`);
  }

  const providerInstance = getTokenizerProvider(provider);

  return providerInstance.countTokens(modelName, text);
}

export async function tryCountTokens(model: string, text: string): Promise<number> {
  try {
    return await countTokens(model, text);
  } catch (error) {
    const errorInfo = error instanceof Error ? error.message : String(error);
    const textPreview = text.length > 100 ? `${text.substring(0, 100)}...` : text;
    console.error(`Failed to countTokens for model '${model}':`, {
      error: errorInfo,
      textLength: text.length,
      textPreview,
    });
    return estimateTokens(text);
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function splitTextMaxTokens(text: string, model: string, maxTokens: number, options: SplitTextOptions = {}): Promise<string[]> {
  const { preserveSentences = true, preserveWords = true } = options;

  if (!text || maxTokens <= 0) {
    return text ? [text] : [];
  }

  if (estimateTokens(text) <= maxTokens / 2) {
    return [text];
  }

  const tokenCount = await tryCountTokens(model, text);
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
        async (segment: string) => ({ text: segment, tokens: await tryCountTokens(model, segment) }));
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

  if (!maxTokens) throw new Error('Must specify maxTokens');

  if (messages.length === 0) return [];

  // TODO: Determine token overhead based on model
  const extraTokensPerMessage = 4;
  const extraTokensTotal = 2;

  const messageTokens = await async.map(messages, async (message: Message) => {
    const contentTokens = await tryCountTokens(model, message.content);
    const totalTokens = contentTokens + extraTokensPerMessage;
    return { message, tokens: totalTokens };
  });

  // Calculate total tokens including conversation overhead
  const contentTokens = messageTokens.reduce((sum, m) => sum + m.tokens, 0);
  const totalTokens = contentTokens + extraTokensTotal;

  if (totalTokens <= maxTokens) {
    return messages;
  }

  const systemMessages = messageTokens.filter(m => m.message.role === 'system');
  const nonSystemMessages = messageTokens.filter(m => m.message.role !== 'system');

  let systemTokens = 0;
  if (preserveSystem) {
    systemTokens = systemMessages.reduce((sum, m) => sum + m.tokens, 0);
  }

  // Account for total overhead when calculating available tokens
  const availableTokens = maxTokens - systemTokens - extraTokensTotal;
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

export { EMBEDDING_LIMITS, EMBEDDING_DIMENSIONS, CONTEXT_LIMITS }; 
