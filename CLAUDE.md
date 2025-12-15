# Testing

Use `dotenv run yarn test` to test locally with required environment keys.

# Updating Supported Models

When updating the supported models list in README.md, ALWAYS refer to the official documentation sources below for the most current information. Model availability, specifications, context sizes, and pricing change frequently.

## Official Documentation Sources

### OpenAI
- **Models**: https://platform.openai.com/docs/models
- **Changelog**: https://platform.openai.com/docs/changelog
- Update model IDs, context window sizes, tokenizers, and pricing

### Anthropic (Claude)
- **Models Overview**: https://docs.anthropic.com/en/docs/about-claude/models/overview
- Update model IDs, context window sizes (note: Anthropic models only support tokenization, not embeddings)

### Google Gemini
- **Gemini API Models**: https://ai.google.dev/gemini-api/docs/models
- **Changelog**: https://ai.google.dev/gemini-api/docs/changelog
- Update model IDs, context window sizes, and embedding dimensions

### Vertex AI
- **Embeddings Overview**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/embeddings
- **Text Embeddings API**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings-api
- Update embedding model IDs, dimensions, context sizes, and pricing (note: Vertex AI only supports embeddings, not tokenization)

## Files to Update

When adding or updating models, you must update:
1. **README.md** - Update the "Supported Models" section with current model IDs, specs, and context sizes
2. **src/constants/models.ts** - Update model constants, tokenizer mappings, and context limits
3. **src/types/index.ts** - Update TypeScript types if new model patterns are introduced
4. **Provider implementation files** - Update provider-specific code if needed:
   - `src/providers/openai.ts` for OpenAI models
   - `src/providers/google.ts` for Google Gemini models
   - `src/providers/vertex.ts` for Vertex AI models
   - Note: Anthropic models use the Anthropic SDK tokenizer directly
5. **Tests** - Update or add tests for new models in the `tests/` directory
