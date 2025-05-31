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
process.env.GOOGLE_API_KEY = 'your-google-key';

// Generate embeddings
const embedding = await embedText('openai/text-embedding-3-small', 'Hello world');
console.log(embedding.vector); // [0.1, -0.2, 0.3, ...]

// Count tokens
const tokens = await countTokens('anthropic/claude-3-7-sonnet-20250219', 'This is a test message');
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
export GOOGLE_API_KEY="AIza..."
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

**Supported Models:**
- OpenAI: `openai/text-embedding-3-small`, `openai/text-embedding-3-large`, `openai/text-embedding-ada-002`
- Google: `google/gemini-embedding-exp-03-07`, `google/text-embedding-004`, `google/embedding-001`

### Token Counting

#### `countTokens(model, text)`

Count tokens in text for the specified model.

```javascript
const count = await countTokens('openai/gpt-4o', 'Hello world');
const count = await countTokens('anthropic/claude-3-7-sonnet-20250219', 'Hello world');
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

**Chat Models:**
- `openai/gpt-4o`, `openai/gpt-4o-mini`
- `openai/gpt-4`, `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo`
- `openai/o1-preview`, `openai/o1-mini`

**Embedding Models:**
- `openai/text-embedding-3-small`
- `openai/text-embedding-3-large` 
- `openai/text-embedding-ada-002`

### Anthropic Models

**Chat Models (Token counting only):**
- `anthropic/claude-3-7-sonnet-20250219`
- `anthropic/claude-3-5-sonnet-20241022`
- `anthropic/claude-3-5-haiku-20241022`
- `anthropic/claude-3-opus-20240229`
- `anthropic/claude-3-sonnet-20240229`
- `anthropic/claude-3-haiku-20240307`

### Google Models

**Chat Models:**
- `google/gemini-1.5-pro`
- `google/gemini-1.5-flash`
- `google/gemini-pro`

**Embedding Models:**
- `google/gemini-embedding-exp-03-07`
- `google/text-embedding-004`
- `google/embedding-001`

## Error Handling

The library provides consistent error handling across providers:

```javascript
try {
  const result = await embedText('invalid/model', 'text');
} catch (error) {
  if (error.code === 'INVALID_MODEL') {
    console.log('Model not supported');
  } else if (error.code === 'API_KEY_MISSING') {
    console.log('API key not configured');
  } else if (error.code === 'RATE_LIMIT') {
    console.log('Rate limit exceeded');
  }
}
```
