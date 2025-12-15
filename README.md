# PolyTokenizer

A lightweight, multi-provider Node.js library for text tokenization, embedding, and context management across different AI service providers (OpenAI, Anthropic, Google Gemini, Vertex AI).

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

// Try different providers
const vertexEmbedding = await embedText('vertex/text-embedding-005', 'Hello world');
const googleEmbedding = await embedText('google/gemini-embedding-001', 'Hello world');

// Use configurable dimensions with gemini-embedding-001 (MRL-trained)
const embedding768 = await embedText('google/gemini-embedding-001', 'Hello world', 768);
const embedding1536 = await embedText('google/gemini-embedding-001', 'Hello world', 1536);
const embedding3072 = await embedText('google/gemini-embedding-001', 'Hello world', 3072); // default

// Count tokens
const tokens = await countTokens('anthropic/claude-3-5-sonnet-latest', 'This is a test message');
console.log(tokens); // 6

// Split text to fit model context
const chunks = await splitTextMaxTokens('openai/gpt-4o', longText, 1000);
console.log(chunks); // ['chunk1...', 'chunk2...']
```

## Configuration

To use the library, you'll need to configure API keys for the providers you want to use.

### Setting API Keys

The easiest way is to set environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic  
export ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini
export GEMINI_API_KEY="AIza..."

# Vertex AI
export VERTEX_PROJECT_ID="your-gcp-project"
export VERTEX_LOCATION="us-central1"
export VERTEX_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com",...}'
```

### Programmatic Configuration

```javascript
import { configure } from 'polytokenizer';

configure({
  openai: { 
    apiKey: 'sk-...',
    baseURL: 'https://api.openai.com/v1' // optional
  },
  anthropic: { 
    apiKey: 'sk-ant-...',
    baseURL: 'https://api.anthropic.com' // optional
  },
  google: { 
    apiKey: 'AIza...' 
  },
  vertex: {
    projectId: 'your-gcp-project',
    location: 'us-central1', // optional, defaults to us-central1
    credentials: {
      type: 'service_account',
      project_id: 'your-project',
      private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
      client_email: '...@...iam.gserviceaccount.com',
      // ... other service account fields
    }
  }
});
```

## Vertex AI Setup

### Automated Setup (Recommended)

The easiest way to set up Vertex AI is using our Terraform automation:

```bash
# Navigate to infrastructure directory
cd infrastructure/terraform

# One-command setup (replace with your project ID)
./setup.sh setup --project your-gcp-project-id

# For different region
./setup.sh setup --project your-gcp-project --region europe-west1

# Get credentials for your application
export VERTEX_PROJECT_ID="$(terraform output -raw project_id)"
export VERTEX_LOCATION="$(terraform output -raw region)"
export VERTEX_CREDENTIALS="$(terraform output -raw service_account_key_json)"
```

This will automatically:
- ✅ Create a GCP service account with proper permissions
- ✅ Enable required APIs (Vertex AI, IAM, Compute)
- ✅ Generate and output JSON credentials
- ✅ Set up all infrastructure with security best practices

See [`infrastructure/terraform/README.md`](infrastructure/terraform/README.md) for detailed setup instructions.

### Manual Vertex AI Setup

If you prefer manual setup:

1. **Enable APIs** in your GCP project:
   ```bash
   gcloud services enable aiplatform.googleapis.com iam.googleapis.com
   ```

2. **Create service account**:
   ```bash
   gcloud iam service-accounts create vertex-ai-embeddings \
     --display-name="Vertex AI Embeddings"
   ```

3. **Grant permissions**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:vertex-ai-embeddings@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

4. **Create and download key**:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=vertex-ai-embeddings@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

## Usage Examples

## API Reference

### Text Embedding

#### `embedText(model, text, options?)`

Generate embeddings for text using the specified model.

```javascript
// OpenAI embeddings
const result = await embedText('openai/text-embedding-3-small', 'Hello world');
// Returns: { vector: number[], model: string, usage: {...} }

// Vertex AI embeddings (very cost-effective)
const result = await embedText('vertex/text-embedding-005', 'Hello world');
// Returns: { vector: number[], model: string, usage: { tokens: 2, cost: 0.00004 } }

// Google Gemini embeddings with configurable dimensions
const result = await embedText('google/gemini-embedding-001', 'Hello world');
// Returns: { vector: number[] (3072 dimensions by default), model: string, usage: { tokens: -1 } }

const result768 = await embedText('google/gemini-embedding-001', 'Hello world', 768);
// Returns: { vector: number[] (768 dimensions), model: string, usage: { tokens: -1 } }
```

**Parameters:**
- `model` (string): Model identifier in format `provider/model` (see Supported Models)
- `text` (string): Text to embed (up to model's context limit)
- `dimensions` (number, optional): Output dimensionality

**Returns:** `Promise<EmbeddingResult>` with:
- `vector`: Array of numbers representing the text embedding
- `model`: The model used for embedding
- `usage`: Token count and cost information

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

#### `splitTextMaxTokens(text, model, maxTokens, options?)`

Split text into chunks that fit within the specified token limit.

```javascript
const chunks = await splitTextMaxTokens(longText, 'openai/gpt-4o', 1000, {
  preserveSentences: true,  // default: true
  preserveWords: true       // default: true
});
// Returns: string[] - Array of text chunks
```

**Parameters:**
- `text` (string): Text to split
- `model` (string): Model identifier (for accurate token counting)
- `maxTokens` (number): Maximum tokens per chunk
- `options` (object, optional): Splitting preferences

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
  strategy: 'early',           // 'early' | 'late'
  preserveSystem: true,        // default: true
  extraTokensPerMessage: 4,    // optional: tokens added per message (default: 4)
  extraTokensTotal: 2          // optional: tokens added for conversation overhead (default: 2)
});
```

**Parameters:**
- `messages` (array): Array of message objects with `role` and `content`
- `model` (string): Model identifier for accurate token counting
- `maxTokens` (number): Maximum total tokens allowed
- `options` (object, optional): Trimming options

**Options:**
- `strategy`: Trimming strategy
  - `'early'`: Remove oldest non-system messages first (default)
  - `'late'`: Remove newer messages first
- `preserveSystem`: Keep system messages (default: `true`)
- `extraTokensPerMessage`: Additional tokens per message for chat formatting overhead (default: 4 for OpenAI models, 0 for others)
- `extraTokensTotal`: Additional tokens for entire conversation overhead (default: 2 for OpenAI models, 0 for others)

**Chat Format Overhead:**
OpenAI models add extra tokens for chat formatting:
- **4 tokens per message** for role boundaries and structure
- **2 tokens total** for priming the assistant response
- These defaults are automatically applied for OpenAI models but can be overridden

**Returns:** `Promise<Message[]>` - Trimmed messages that fit within token limit

## Supported Models

> **Note:** Model availability and specifications change frequently. Refer to the official documentation links below for the most current information.

### OpenAI Models

**Official Documentation:** [OpenAI Models](https://platform.openai.com/docs/models) | [Changelog](https://platform.openai.com/docs/changelog)

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
- `openai/text-embedding-3-small` - 1536 dimensions (8K context) - $0.02/MTok
- `openai/text-embedding-3-large` - 3072 dimensions (8K context) - $0.13/MTok
- `openai/text-embedding-ada-002` - 1536 dimensions (8K context) - $0.10/MTok

### Anthropic Models

**Official Documentation:** [Anthropic Models Overview](https://docs.anthropic.com/en/docs/about-claude/models/overview)

**Claude 4.5 Series (Current):**
- `anthropic/claude-opus-4-5` - Claude 4.5 Opus (200K context)
- `anthropic/claude-sonnet-4-5` - Claude 4.5 Sonnet (200K context)
- `anthropic/claude-haiku-4-5` - Claude 4.5 Haiku (200K context)

**Claude 4 Series (Legacy):**
- `anthropic/claude-opus-4-1` - Claude 4.1 Opus (200K context)
- `anthropic/claude-opus-4-0` - Claude 4 Opus (200K context)
- `anthropic/claude-sonnet-4-0` - Claude 4 Sonnet (200K context)

**Claude 3 Series (Legacy):**
- `anthropic/claude-3-7-sonnet-latest` - Claude 3.7 Sonnet (200K context)
- `anthropic/claude-3-5-haiku-latest` - Claude 3.5 Haiku (200K context)

*Note: Anthropic models support tokenization only (no embedding capabilities)*

### Google Models

**Official Documentation:** [Gemini API Models](https://ai.google.dev/gemini-api/docs/models) | [Changelog](https://ai.google.dev/gemini-api/docs/changelog)

**Gemini 2.5 Series:**
- `google/gemini-2.5-pro` - Gemini 2.5 Pro (2M context)
- `google/gemini-2.5-flash` - Gemini 2.5 Flash (1M context)

**Gemini 2.0 Series:**
- `google/gemini-2.0-flash` - Gemini 2.0 Flash (1M context)

**Gemini 1.5 Series:**
- `google/gemini-1.5-pro` - Gemini 1.5 Pro (2M context)
- `google/gemini-1.5-flash` - Gemini 1.5 Flash (1M context)
- `google/gemini-1.5-flash-8b` - Gemini 1.5 Flash 8B (1M context)

**Embedding Models:**
- `google/gemini-embedding-001` - 3072 dimensions (default), configurable (768/1536/3072) - MRL-trained model with flexible dimensionality

### Vertex AI Models

**Official Documentation:** [Vertex AI Embeddings](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/embeddings) | [Text Embeddings API](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api)

**Embedding Models:**
- `vertex/gemini-embedding-001` - 3072 dimensions (default), configurable (768/1536/3072) - $0.00015/1K tokens - MRL-trained model
- `vertex/text-embedding-005` - 768 dimensions (2K context) - $0.000025/1K chars - Latest specialized model, English/code optimized
- `vertex/text-multilingual-embedding-002` - 768 dimensions (2K context) - $0.000025/1K chars - Multilingual support
- `vertex/multilingual-e5-small` - 384 dimensions (512 tokens) - $0.000025/1K chars - Small multilingual model
- `vertex/multilingual-e5-large` - 1024 dimensions (512 tokens) - $0.000025/1K chars - Large multilingual model

*Note: Vertex AI models support embeddings only (no tokenization capabilities). Vertex AI provides the most cost-effective embedding options.*
