# AI Model Provider Sources

This file documents URLs and sources for AI model capabilities, pricing, context windows, embedding vector dimensions, and other technical specifications. Use this file to update model constants when providers change their offerings.

## Project Goals

**Primary Goal**: Provide a unified interface for AI model tokenization and embedding across multiple providers, with preference for:

### Tokenization Priority:
1. **Local/Free solutions** (e.g., tiktoken, SentencePiece) - no API costs
2. **Free/cheap API-based** tokenization for popular model families  
3. **Comprehensive coverage** of widely-used LLM families (OpenAI, Anthropic, Google, Meta, etc.)

### Embedding Priority:
1. **Local models** (open source, run locally) - no API costs, privacy
2. **Free/cheap API models** with good performance
3. **High-quality proprietary models** for specialized use cases
4. **Diverse dimensions** to support different use cases (512, 768, 1024, 1536, 3072+)

## Summary of Provider Capabilities

### Tokenization Support

| Provider | Implementation Status | Method | Pricing | Priority | Notes |
|----------|----------------------|---------|---------|----------|-------|
| OpenAI | ✅ Implemented | Local (tiktoken) | Free | 🟢 High | No API calls needed |
| Anthropic | ✅ Implemented | API (`/v1/messages/count_tokens`) | Included in usage | 🟡 Medium | Accurate for Claude 3+ |
| Google (Gemini) | ✅ Implemented | API (Gemini endpoints) | Included in usage | 🟡 Medium | Direct API |
| Vertex AI | ❌ Embeddings Only | API (Vertex endpoints) | Included in usage | 🟡 Medium | Enterprise Google Cloud |
| Meta (Llama) | ❌ Not Implemented | Local (SentencePiece) | Free | 🟢 High | Popular open models, local |
| Qwen | ❌ Not Implemented | Local (tiktoken-compatible) | Free | 🟢 High | Popular, local, multilingual |
| DeepSeek | ❌ Not Implemented | API + local | Very cheap | 🟢 High | $0.14/MTok, strong performance |
| xAI (Grok) | ❌ Not Implemented | API only | Expensive | 🔴 Low | $3-5/MTok input, limited use |
| AWS Bedrock | ❌ Not Implemented | API (Bedrock endpoints) | Varies by model | 🟡 Medium | Multi-provider access |
| Cohere | ❌ Not Implemented | Local tokenizer or API | API calls charged | 🟡 Medium | Command models |
| Mistral | ❌ Not Implemented | API | API calls charged | 🟡 Medium | Mixtral models |
| Gemma | ❌ Not Implemented | Local (SentencePiece) | Free | 🟡 Medium | Open source, smaller models |

### Embedding Support

| Provider | Implementation Status | Model | Max Input | Vector Dimensions | Pricing | Priority | Notes |
|----------|----------------------|-------|-----------|-------------------|---------|----------|-------|
| Vertex AI | ✅ Implemented | text-embedding-005 | 2048 tokens | 768 | $0.00002/1K chars | 🟢 High | **Most cost-effective**, enterprise features |
| OpenAI | ✅ Implemented | text-embedding-3-small | ~8k tokens | 1536 | $0.02/MTok | 🟢 High | Good performance/price |
| Google (Gemini) | ✅ Implemented | gemini-embedding-exp-03-07 | 8k tokens | 3072 | Included in usage | 🟢 High | **SOTA performance**, experimental |
| OpenAI | ✅ Implemented | text-embedding-3-large | ~8k tokens | 3072 | $0.13/MTok | 🟡 Medium | High quality, higher cost |
| Google (Gemini) | ✅ Implemented | text-embedding-004 | ~2k tokens | 768 | Included in usage | 🟡 Medium | Free with API usage |
| Snowflake | ❌ Not Implemented | arctic-embed-l | ~8k tokens | 1024 | Free (Apache 2.0) | 🟢 High | SOTA performance, free |
| Jina AI | ❌ Not Implemented | jina-embeddings-v3 | 8192 tokens | 1024 | API pricing | 🟢 High | Good performance, reasonable cost |
| Cohere | ❌ Not Implemented | embed-v4.0 | 128k tokens | 1536 | $0.12/MTok | 🟡 Medium | Large context, multimodal |
| AWS Bedrock | ❌ Not Implemented | Amazon Titan Embeddings | Varies | Varies | AWS pricing | 🟡 Medium | Enterprise, multi-provider |
| Voyage AI | ❌ Not Implemented | Various models | Varies | Varies | API pricing | 🟡 Medium | Specialized for retrieval |
| xAI (Grok) | ❌ No embedding API | N/A | N/A | N/A | N/A | 🔴 Low | No embedding capabilities |
| Anthropic | ❌ No embedding API | N/A | N/A | N/A | No public API | 🔴 Low | No embedding API |
| Meta (Llama) | ❌ No official embeddings | Community fine-tunes | Varies | Varies | Varies | 🟡 Medium | Community solutions exist |
| Mistral | ❌ No embedding API | N/A | N/A | N/A | No embedding API | 🔴 Low | No embedding capabilities |

**Priority Legend:**
- 🟢 **High**: Free/cheap, popular, or high-performance models we should prioritize
- 🟡 **Medium**: Useful but not critical, implement after high-priority items  
- 🔴 **Low**: Expensive, limited capabilities, or niche use cases

## Provider API Endpoints

### Token Counting APIs
- **OpenAI**: Local tiktoken library (no API needed) ✅ **Implemented**
- **Anthropic**: `/v1/messages/count_tokens` ✅ **Implemented**
- **Google Gemini**: Gemini API token counting ✅ **Implemented**
- **Vertex AI**: Token counting not implemented (embeddings only)
- **xAI (Grok)**: Proprietary API endpoints (expensive, $3-5/MTok)
- **DeepSeek**: API + local tiktoken-compatible ($0.14/MTok)
- **Qwen**: Local tiktoken-compatible tokenizer (free)
- **Meta (Llama)**: Local SentencePiece tokenizer (free)
- **Cohere**: Local tokenizer or API
- **AWS Bedrock**: Bedrock endpoints (varies by model)

### Embedding APIs
- **OpenAI**: `/v1/embeddings` ✅ **Implemented**
- **Google Gemini**: `/v1/models/*/embedContent` ✅ **Implemented**
- **Vertex AI**: `/v1/projects/*/locations/*/publishers/google/models/*:predict`
- **Snowflake**: Local inference (arctic-embed models, free)
- **Jina AI**: `/v1/embeddings`
- **Cohere**: `/v1/embed`
- **Voyage**: `/v1/embeddings`
- **AWS Bedrock**: Bedrock embedding endpoints
- **xAI (Grok)**: ❌ No embedding API
- **Anthropic**: ❌ No embedding API  
- **Meta (Llama)**: Community fine-tuned models (local inference)
- **Mistral**: ❌ No embedding API

## Provider Details

### OpenAI

**Implementation Status**: ✅ **Fully Implemented** (`src/providers/openai.ts`)

**Primary Sources:**
- Models Overview: https://platform.openai.com/docs/models/
- Pricing: https://openai.com/api/pricing/
- Tiktoken Repository: https://github.com/openai/tiktoken
- Tiktoken Cookbook: https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken

**Current Models (as of January 2026):**

**GPT-5 Series (Current - Recommended):**
- `gpt-5.2`: 400k context, flagship model for coding and agentic tasks, **o200k_base** tokenizer
- `gpt-5.1`: 400k context, previous GPT-5 version, **o200k_base** tokenizer
- `gpt-5`: 400k context, $1.25/MTok input, $10.00/MTok output, **o200k_base** tokenizer (released August 2025)
- `gpt-5-mini`: 400k context, $0.25/MTok input, $2.00/MTok output, **o200k_base** tokenizer
- `gpt-5-nano`: 400k context, $0.05/MTok input, $0.40/MTok output, **o200k_base** tokenizer

**O-Series Reasoning Models:**
- `o3`: 200k context, $60.00/MTok input, $240.00/MTok output, **o200k_base** tokenizer
- `o1`: 200k context, $15.00/MTok input, $60.00/MTok output, **o200k_base** tokenizer
- `o1-mini`: 128k context, $3.00/MTok input, $12.00/MTok output, **o200k_base** tokenizer

**Embedding Models:**
- `text-embedding-3-small`: 1536 dimensions, $0.02/MTok, **cl100k_base** tokenizer
- `text-embedding-3-large`: 3072 dimensions, $0.13/MTok, **cl100k_base** tokenizer
- `text-embedding-ada-002`: 1536 dimensions, $0.10/MTok, **cl100k_base** tokenizer (legacy, still supported)

**Tokenizer Mapping:**
| Tokenizer | Models |
|-----------|--------|
| **o200k_base** | gpt-5 series, o3, o1 series |
| **cl100k_base** | all embedding models |

**Tokenization Implementation**: Local tiktoken library (no API calls needed)

### Anthropic

**Implementation Status**: ✅ **Fully Implemented** (`src/providers/anthropic.ts`)

**Primary Sources:**
- Models Overview: https://docs.anthropic.com/en/docs/about-claude/models
- Pricing: https://docs.anthropic.com/en/docs/about-claude/pricing
- Token Counting API: https://docs.anthropic.com/en/api/counting-tokens

**Current Models (as of January 2026):**

**Claude 4.5 Series (Current):**
- `claude-opus-4-5`: 200k context, $15/MTok input, $75/MTok output
- `claude-sonnet-4-5`: 200k context, $3/MTok input, $15/MTok output
- `claude-haiku-4-5`: 200k context, $0.80/MTok input, $4/MTok output

**Claude 4 Series (Legacy):**
- `claude-opus-4-1`: 200k context, $15/MTok input, $75/MTok output
- `claude-sonnet-4-0`: 200k context, $3/MTok input, $15/MTok output
- `claude-opus-4-0`: 200k context, $15/MTok input, $75/MTok output

**Claude 3 Series (Legacy):**
- `claude-3-7-sonnet-latest`: 200k context, $3/MTok input, $15/MTok output
- `claude-3-5-haiku-latest`: 200k context, $0.80/MTok input, $4/MTok output

**Tokenization Implementation**: API-based via `/v1/messages/count_tokens` endpoint
**Embedding Support**: ❌ No public embedding API

### Google (Gemini Direct API)

**Implementation Status**: ✅ **Fully Implemented** (`src/providers/google.ts`)
**Note**: This is the direct Gemini API, distinct from Vertex AI which offers additional models

**Primary Sources:**
- Gemini API Models: https://ai.google.dev/gemini-api/docs/models
- Gemini API Embeddings: https://ai.google.dev/gemini-api/docs/embeddings
- Gemini API Reference: https://ai.google.dev/api/rest
- Experimental Gemini Embedding: https://developers.googleblog.com/en/gemini-embedding-text-model-now-available-gemini-api/

**Current Models (as of January 2026):**

**Gemini 2.5 Series (Current):**
- `gemini-2.5-pro`: 2M context, $1.25/MTok input, $5.00/MTok output
- `gemini-2.5-flash`: 1M context, $0.075/MTok input, $0.30/MTok output
- `gemini-2.5-flash-lite`: 1M context, cost-efficient option for high-volume workloads

**Embedding Models (Direct API):**
- `gemini-embedding-001`: 3072 dimensions (default), configurable (768/1536/3072), MRL-trained

**Notes on Vertex AI vs Direct API:**
- **Vertex AI** offers additional specialized embedding models (`text-embedding-005`, `text-multilingual-embedding-002`)
- **Vertex AI** naming for experimental model: `text-embedding-large-exp-03-07`
- **Direct API** has simpler authentication but fewer embedding options
- **Vertex AI** provides enterprise features (VPC, audit logs, data residency)

**Tokenization Implementation**: API-based via Gemini API endpoints
**Special Features**: Multimodal capabilities (text + images)

### Vertex AI (Google Cloud)

**Implementation Status**: ✅ **Fully Implemented** (`src/providers/vertex.ts`)

**Primary Sources:**
- Vertex AI Embeddings: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api
- Vertex AI Pricing: https://cloud.google.com/vertex-ai/generative-ai/pricing
- Vertex AI Models: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models

**Current Models (as of May 2025):**

**Embedding Models (Vertex AI):**
- `text-embedding-005`: 768 dimensions, 2048 tokens, English/code specialized, $0.00002/1K characters
- `text-embedding-004`: 768 dimensions, 2048 tokens, general purpose, $0.00002/1K characters (also available via Google Gemini API)
- `text-multilingual-embedding-002`: 768 dimensions, 2048 tokens, multilingual, $0.00002/1K characters

**Key Differences from Direct Gemini API:**
- **Additional Models**: `text-embedding-005` and `text-multilingual-embedding-002` not available elsewhere
- **Rate Limits**: 250 input texts for non-Gemini models vs single input for Gemini models
- **Authentication**: Google Cloud IAM with service account credentials
- **Enterprise Features**: VPC, audit logs, data residency controls
- **Billing**: Google Cloud billing vs direct API billing
- **Token Limits**: 20,000 tokens per request, 2048 per individual input

**Implementation Features:**
- **Authentication Method**: Direct JSON credentials (environment variables) - consistent with other providers
- **Infrastructure Automation**: Complete Terraform setup for one-command deployment
- **Security**: Minimal IAM permissions (roles/aiplatform.user), service account best practices
- **Cost Efficiency**: Most cost-effective embedding option at $0.00002/1K characters
- **Production Ready**: Enterprise features, audit logging, VPC support

**Setup Options:**
1. **Automated (Recommended)**: `./infrastructure/terraform/setup.sh setup --project PROJECT_ID`
2. **Manual**: Service account creation, API enablement, credential generation

**Cost Comparison:**
- **Vertex AI**: ~$0.05 per 1M tokens (most cost-effective)
- **OpenAI text-embedding-3-small**: $20.00 per 1M tokens (400x more expensive)
- **Google Gemini experimental**: Free tier (experimental, may change)

**Implementation Notes:**
- **Authentication**: Uses Google Auth library with service account credentials
- **Embeddings Only**: Current implementation supports embeddings only (no tokenization)
- **Token Estimation**: Uses character-based estimation (~4 chars per token)
- **Cost Calculation**: Based on character count at $0.00002 per 1K characters
- **Error Handling**: Comprehensive error handling for authentication, invalid models, empty text
- **Performance**: ~200-500ms latency, supports concurrent requests

**Tokenization Implementation**: Not implemented (embeddings only)
**Embedding Support**: ✅ Multiple specialized embedding models with enterprise features

### Gemma (Open Source)

**Implementation Status**: ❌ **Not Currently Implemented**

**Primary Sources:**
- Gemma Models: https://huggingface.co/google/gemma-2b
- Gemma 2 Models: https://huggingface.co/google/gemma-2-9b
- Architecture Guide: https://developers.googleblog.com/en/gemma-explained-overview-gemma-model-family-architectures/
- HuggingFace Documentation: https://huggingface.co/docs/transformers/en/model_doc/gemma

**Available Models:**

**Gemma 1 Series:**
- `gemma-2b`: 8k context, base model
- `gemma-7b`: 8k context, base model
- `gemma-2b-it`: 8k context, instruction-tuned
- `gemma-7b-it`: 8k context, instruction-tuned

**Gemma 2 Series:**
- `gemma-2-2b`: 8k context, improved architecture
- `gemma-2-9b`: 8k context, 8T tokens training
- `gemma-2-27b`: 8k context, 13T tokens training

**Tokenization**: **SentencePiece-based**, 256k vocabulary
**Embedding Support**: ❌ No official embedding models
**Relationship to Gemini**: Shares tokenization approach but uses SentencePiece instead of Gemini's tokenizer
**Notes**: Open source, Apache 2.0 license, no API costs

### Snowflake (Arctic Embed)

**Primary Sources:**
- Arctic Embed Models: https://huggingface.co/Snowflake/snowflake-arctic-embed-l
- Technical Report: https://arxiv.org/abs/2407.18887

**Embedding Models:**
- `snowflake-arctic-embed-l`: 1024 dimensions, 335M parameters
- `snowflake-arctic-embed-m`: 768 dimensions, 110M parameters  
- `snowflake-arctic-embed-m-v1.5`: 768 dimensions, compressible to 256
- `snowflake-arctic-embed-s`: 384 dimensions, 33M parameters
- `snowflake-arctic-embed-xs`: 384 dimensions, 22M parameters

**Notes:**
- State-of-the-art performance on MTEB benchmark
- Apache 2.0 license (free commercial use)
- Optimized for retrieval accuracy

### Jina AI

**Primary Sources:**
- Jina Embeddings v3: https://huggingface.co/jinaai/jina-embeddings-v3

**Embedding Models:**
- `jina-embeddings-v3`: 1024 dimensions, 570M parameters, 8192 context

### Voyage AI

**Primary Sources:**
- Documentation: https://docs.voyageai.com/
- Models specialized for embeddings and semantic search

### OpenRouter

**Implementation Status**: ❌ **Not Suitable for Implementation**

**Primary Sources:**
- Documentation: https://openrouter.ai/docs
- Models: https://openrouter.ai/models

**Capabilities Assessment:**
- **Embedding Support**: ❌ No embedding APIs offered
- **Tokenization Support**: ❌ No token counting APIs offered  
- **Service Type**: Model routing/proxy service for chat completions only

**Notes**: OpenRouter is a model routing service that provides access to various LLMs (OpenAI, Anthropic, Google, etc.) through a unified API, but **does not offer the embedding or tokenization capabilities** that our polytokenizer library requires. Users needing these capabilities should use the direct provider APIs instead.

### AWS Bedrock

**Implementation Status**: ❌ **Not Currently Implemented**

**Primary Sources:**
- AWS Bedrock Documentation: https://docs.aws.amazon.com/bedrock/
- Supported Models: https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html
- Bedrock API Reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/

**Available Model Providers (as of May 2025):**

**Embedding Models Available:**
- **Amazon Titan Embeddings**: Amazon's proprietary embedding models
- **Cohere Embed**: Cohere's embedding models via Bedrock
- **Anthropic Claude**: Text generation only (no embeddings)
- **Meta Llama**: Text generation only (no embeddings)

**Key Features:**
- **Authentication**: AWS IAM credentials
- **Enterprise Features**: VPC endpoints, CloudTrail logging, AWS security
- **Multi-Provider Access**: Single API for multiple foundation model providers
- **Tokenization Support**: Varies by model provider
- **Billing**: AWS billing and pricing structure

**Advantages:**
- Unified access to multiple providers through AWS
- Enterprise security and compliance features
- Integration with AWS ecosystem (Lambda, SageMaker, etc.)
- Consistent API across different model providers

**Considerations for Implementation:**
- **Model Availability**: Not all provider models available (subset of each provider's offerings)
- **API Differences**: Bedrock API format vs direct provider APIs
- **Pricing**: AWS markup over direct provider pricing
- **Feature Lag**: New models may appear in Bedrock after direct provider APIs

**Tokenization Implementation**: API-based via AWS Bedrock endpoints
**Embedding Support**: ✅ Via Amazon Titan and Cohere models

### Cohere

**Implementation Status**: ❌ **Not Implemented**

**Primary Sources:**
- Models Overview: https://docs.cohere.com/v2/docs/models
- Pricing: https://cohere.com/pricing

**Current Models (as of May 2025):**

**Command Series:**
- `command-a-03-2025`: 256k context, 8k max output, $2.50/MTok input, $10.00/MTok output (latest)

### Meta Llama

**Implementation Status**: ❌ **Not Implemented** (open-weight but not API-based)

**Primary Sources:**
- Llama Repository: https://github.com/meta-llama/llama  
- HuggingFace Models: https://huggingface.co/meta-llama
- Llama 2 Paper: https://arxiv.org/abs/2307.09288

**Tokenizer Information:**
- **Tokenizer Type**: SentencePiece
- **Vocabulary Size**: ~32,000 tokens (varies by model)
- **Special Features**: BPE-based, trained on multilingual data
- **Usage**: Via transformers library, tiktoken does not support Llama tokenizers

**Current Models (as of May 2025):**
- `llama-4`: Mixture-of-Experts, up to 2T parameters
- `llama-3.3-70b`: 128k context, improved from Llama 3.1
- `llama-3.1-405b`: 128k context, largest dense model

**Notes**: Requires local deployment, no direct API. Meta provides weights under custom license.

### DeepSeek

**Implementation Status**: ❌ **Not Implemented** (API available but not integrated)

**Primary Sources:**
- DeepSeek API: https://platform.deepseek.com/
- DeepSeek V3 Paper: https://arxiv.org/abs/2412.19437
- GitHub: https://github.com/deepseek-ai

**Tokenizer Information:**
- **Tokenizer Type**: Custom tiktoken-compatible tokenizer
- **Vocabulary Size**: ~100,000 tokens
- **Special Features**: Optimized for code and reasoning tasks
- **Usage**: Available via DeepSeek API and HuggingFace transformers

**Current Models (as of May 2025):**
- `deepseek-v3`: 671B MoE, 37B active, $0.14/MTok input, $0.28/MTok output
- `deepseek-r1`: Reasoning model with chain-of-thought capabilities
- `deepseek-coder-v2`: Specialized for code generation

**Notes**: Competitive pricing, strong performance on coding benchmarks.

### Alibaba Qwen

**Implementation Status**: ❌ **Not Implemented** (API available but not integrated)

**Primary Sources:**
- Qwen Documentation: https://qwen.readthedocs.io/
- HuggingFace Models: https://huggingface.co/Qwen
- Qwen 2.5 Paper: https://arxiv.org/abs/2409.12186

**Tokenizer Information:**
- **Tokenizer Type**: Custom tiktoken-based tokenizer (qwen.tiktoken)
- **Vocabulary Size**: ~151,849 tokens including special tokens  
- **Special Features**: Multilingual support, Chinese-optimized
- **Pattern**: Uses regex pattern for tokenization similar to GPT models
- **Implementation**: Available as `QWenTokenizer` class in transformers

**Current Models (as of May 2025):**
- `qwen-3-235b`: Latest flagship model, MoE architecture
- `qwen-2.5-max`: 72B parameters, strong reasoning
- `qwen-2.5-coder`: Specialized for code generation
- `qwen-2.5-vl`: Vision-language model

**Notes**: Strong multilingual capabilities, competitive with international models.

### xAI (Grok)

**Implementation Status**: ❌ **Not Implemented** (expensive API, limited value proposition)

**Primary Sources:**
- Grok 3 API Documentation: https://docs.x.ai/api
- Grok Models: https://docsbot.ai/models/grok-3
- xAI Blog: https://x.ai/blog/grok-3

**Current Models (as of May 2025):**

**Grok 3 Series:**
- `grok-3-beta`: 1M context, 128k max output, $3.00/MTok input, $15.00/MTok output
- `grok-3-fast-beta`: 1M context, 128k max output, $5.00/MTok input, $25.00/MTok output
- `grok-3-mini-beta`: 1M context, 128k max output, $0.30/MTok input, $0.50/MTok output
- `grok-3-mini-fast-beta`: 1M context, 128k max output, $0.60/MTok input, $4.00/MTok output

**Grok 2 Series (Previous):**
- `grok-2-vision`: 32k context, $2.00/MTok input, $10.00/MTok output, vision capabilities
- `grok-2-mini`: 32k context, ~$0.50/MTok input, ~$2.50/MTok output

**Key Features:**
- **Real-time X (Twitter) Integration**: Access to live tweets and social media data
- **Vision Capabilities**: Image understanding and analysis
- **Think Mode**: Advanced reasoning with chain-of-thought capabilities
- **Large Context**: 1M token context window for Grok 3
- **Trained on Colossus**: 100,000+ NVIDIA H100 GPUs for training

**Performance Benchmarks:**
- **MMLU-Pro**: 79.9% (base model)
- **GPQA Diamond**: 84.6% (with Think mode)
- **AIME 2025**: 93.3% (with Think mode)
- **LiveCodeBench**: 79.4% (with Think mode)
- **MMMU**: 78% (with Think mode)

**Tokenizer Information:**
- **Tokenizer Type**: Proprietary (likely similar to other transformer models)
- **API Only**: No local tokenization available
- **Context Window**: Up to 1M tokens for Grok 3

**Limitations:**
- **No Embedding API**: Does not offer text embedding capabilities
- **Expensive Pricing**: 2-5x more expensive than competitors (GPT-4o: $2.50 input vs Grok 3: $3-5)
- **API Only**: No local deployment or open weights
- **Limited Ecosystem**: Newer provider with less tooling support
- **Social Media Focus**: Optimized for X integration, may not be ideal for general use

**Use Cases:**
- Social media monitoring and analysis
- Real-time sentiment analysis from X/Twitter
- Meme and cultural content understanding
- Applications requiring live social media context

**Comparison with Alternatives:**
- **vs GPT-4.1**: Grok 3 more expensive ($3 vs $2 input), similar performance
- **vs Claude 3.7**: Grok 3 much more expensive, X integration advantage
- **vs Gemini 2.5 Pro**: Grok 3 2.4x more expensive than Gemini Pro
- **vs DeepSeek V3**: Grok 3 21x more expensive than DeepSeek ($3 vs $0.14)

**Implementation Priority**: 🔴 **Low** - High cost, no embedding API, limited unique value for most use cases

**Tokenization Implementation**: API-based only (expensive)
**Embedding Support**: ❌ No embedding capabilities
