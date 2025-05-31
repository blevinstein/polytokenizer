# PolyTokenizer

A lightweight, multi-provider Node.js library for text tokenization, embedding, and context management across different AI service providers (OpenAI, Anthropic, Google Gemini).

## Features

- Easily get embeddings for different models and providers.
- Easily count tokens for different models and providers.
- Simple token-aware methods for context management.

## Installation

```bash
npm install polytokenizer
```

## Quick Start

```javascript
import { embedText, countTokens, splitTextMaxTokens, trimMessages } from 'polytokenizer';

// Configure API keys (see Configuration section)
process.env.OPENAI_API_KEY = 'your-openai-key';
process.env.ANTHROPIC_API_KEY = 'your-anthropic-key';
process.env.GEMINI_API_KEY = 'your-gemini-key';

// Generate embeddings
const embedding = await embedText('openai/text-embedding-3-small', 'Hello world');
console.log(embedding.vector); // [0.1, -0.2, 0.3, ...]

// Count tokens
const tokens = await countTokens('anthropic/claude-3-5-sonnet-latest', 'This is a test message');
console.log(tokens); // 6

// Split text to fit model context
const chunks = await splitTextMaxTokens('openai/gpt-4o', longText, 1000);
console.log(chunks); // ['chunk1...', 'chunk2...']
```

## Configuration

Set environment variables for the providers you plan to use:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIza..."
```

Or configure programmatically:

```javascript
import { configure } from 'polytokenizer';

configure({
  openai: { apiKey: 'sk-...' },
  anthropic: { apiKey: 'sk-ant-...' },
  google: { apiKey: 'AIza...' }
});
```

## API Reference

### Text Embedding

#### `embedText(model, text, options?)`

Generate embeddings for text using the specified model.

```javascript
const result = await embedText('openai/text-embedding-3-small', 'Hello world');
// Returns: { vector: number[], model: string, usage: {...} }

const result = await embedText('google/gemini-embedding-exp-03-07', 'Hello world');
// Returns: { vector: number[], model: string, usage: {...} }
```

**Parameters:**
- `model` (string): Model identifier in format `provider/model` (see Supported Models)
- `text` (string): Text to embed
- `options` (object, optional): Provider-specific options

### Token Counting

#### `countTokens(model, text)`

Count tokens in text for the specified model.

```javascript
const count = await countTokens('openai/gpt-4o', 'Hello world');
const count = await countTokens('anthropic/claude-3-5-sonnet-latest', 'Hello world');
const count = await countTokens('google/gemini-1.5-pro', 'Hello world');
```

**Parameters:**
- `model` (string): Model identifier in format `provider/model`
- `text` (string): Text to count tokens for

**Returns:** `Promise<number>` - Token count

### Text Splitting

#### `splitTextMaxTokens(model, text, maxTokens)`

Split text into chunks that fit within the specified token limit.

```javascript
const chunks = await splitTextMaxTokens('openai/gpt-4o', longText, 1000);
// Returns: string[] - Array of text chunks
```

**Parameters:**
- `model` (string): Model identifier (for accurate token counting)
- `text` (string): Text to split
- `maxTokens` (number): Maximum tokens per chunk

**Features:**
- Preserves sentence boundaries when possible
- Falls back to word boundaries if sentences are too long
- Smart handling of paragraphs and line breaks

### Context Management

#### `trimMessages(messages, model, maxTokens, options?)`

Intelligently trim conversation messages to fit within token limits.

```javascript
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there!' },
  // ... more messages
];

const trimmed = await trimMessages(messages, 'openai/gpt-4o', 4000, {
  strategy: 'early' // 'early' | 'late'
});
```

**Strategies:**
- `early`: Remove oldest non-system messages first
- `late`: Remove newer messages

## Supported Models

### OpenAI Models

**Latest Generation (o200k_base tokenizer):**
- `openai/gpt-4.1`, `openai/gpt-4.1-mini` - GPT-4.1 family (1M context)
- `openai/o4-mini` - O4 reasoning model (200K context)
- `openai/o3` - O3 reasoning model (200K context)
- `openai/o1`, `openai/o1-preview`, `openai/o1-mini` - O1 reasoning family (128K-200K context)
- `openai/gpt-4o`, `openai/gpt-4o-mini` - GPT-4o family (128K context)

**Previous Generation (cl100k_base tokenizer):**
- `openai/gpt-4`, `openai/gpt-4-turbo` - GPT-4 family (8K-128K context)
- `openai/gpt-3.5-turbo` - GPT-3.5 family (16K context)

**Embedding Models:**
- `openai/text-embedding-3-small` - 1536 dimensions (8K context)
- `openai/text-embedding-3-large` - 3072 dimensions (8K context)
- `openai/text-embedding-ada-002` - 1536 dimensions (8K context)

### Anthropic Models

**Claude 4 Series (using official aliases):**
- `anthropic/claude-opus-4-0` - Claude 4 Opus (200K context)
- `anthropic/claude-sonnet-4-0` - Claude 4 Sonnet (200K context)

**Claude 3 Series (using official aliases):**
- `anthropic/claude-3-7-sonnet-latest` - Claude 3.7 Sonnet (200K context)
- `anthropic/claude-3-5-sonnet-latest` - Claude 3.5 Sonnet (200K context)
- `anthropic/claude-3-5-haiku-latest` - Claude 3.5 Haiku (200K context)
- `anthropic/claude-3-opus-latest` - Claude 3 Opus (200K context)

*Note: Anthropic models support tokenization only (no embedding capabilities)*

### Google Models

**Latest Generation:**
- `google/gemini-2.5-pro` - Gemini 2.5 Pro (2M context)
- `google/gemini-2.5-flash` - Gemini 2.5 Flash (1M context)
- `google/gemini-2.0-flash` - Gemini 2.0 Flash (1M context)

**Gemini 1.5 Series:**
- `google/gemini-1.5-pro` - Gemini 1.5 Pro (2M context)
- `google/gemini-1.5-flash` - Gemini 1.5 Flash (1M context)
- `google/gemini-1.5-flash-8b` - Gemini 1.5 Flash 8B (1M context)

**Previous Generation:**
- `google/gemini-pro` - Gemini Pro (32K context)

**Embedding Models:**
- `google/gemini-embedding-exp-03-07` - Experimental 3072 dimensions (8K context)
- `google/text-embedding-004` - 768 dimensions (2K context)
- `google/embedding-001` - 768 dimensions (2K context)

## Model Families and Tokenizers

- **OpenAI Latest (o200k_base)**: GPT-4.1, O-series, GPT-4o
- **OpenAI Legacy (cl100k_base)**: GPT-4, GPT-3.5, embedding models
- **Anthropic**: Uses official API aliases with automatic model resolution
- **Google Gemini**: Direct API tokenization for all models
