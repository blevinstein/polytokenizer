# Testing Guide

This project has two types of tests: **Unit Tests** and **Integration Tests**.

## Unit Tests

Unit tests validate the library's functionality without requiring API keys. They test:
- Provider configuration and initialization
- Local tokenization (OpenAI uses tiktoken locally)
- Error handling and validation
- Model capability checking

**Run unit tests:**
```bash
npm run test:unit
```

Unit tests will always pass and don't require any setup.

## Integration Tests

Integration tests validate actual API functionality by making real API calls. They test:
- Token counting with real API calls (Anthropic, Google)
- Embedding generation (OpenAI, Google)
- Text splitting and message trimming end-to-end

**Run integration tests:**
```bash
npm run test:integration
```

### Setting up API Keys

Integration tests automatically skip tests for providers where API keys are not available.

Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
GEMINI_API_KEY=your-google-ai-api-key-here
```

## Running All Tests

```bash
npm run test:all
```

This runs unit tests first, then integration tests.

## Test Results Without API Keys

When no API keys are provided:
- Unit tests: All pass
- Integration tests: Most skip, but some OpenAI tests pass due to local tokenization

## Test Results With API Keys

With valid API keys:
- Unit tests: All pass
- Integration tests: All pass, demonstrating full API integration

The integration tests verify that our library correctly interfaces with all three major AI providers and handles their different tokenization and embedding approaches. 