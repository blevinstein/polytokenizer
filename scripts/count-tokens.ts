#!/usr/bin/env tsx

/**
 * CLI script to test countTokens
 * Usage: tsx scripts/count-tokens.ts <model> <text>
 * Example: tsx scripts/count-tokens.ts google/gemini-embedding-001 "Hello world"
 */

import { countTokens } from '../src/index.js';

const [model, text] = process.argv.slice(2);

if (!model || !text) {
  console.error('Usage: tsx scripts/count-tokens.ts <model> <text>');
  console.error('');
  console.error('Examples:');
  console.error('  tsx scripts/count-tokens.ts google/gemini-embedding-001 "Hello world"');
  console.error('  tsx scripts/count-tokens.ts google/gemini-2.5-flash "Test message"');
  console.error('  tsx scripts/count-tokens.ts openai/gpt-5 "Hello world"');
  console.error('  tsx scripts/count-tokens.ts openai/text-embedding-3-small "Test"');
  console.error('  tsx scripts/count-tokens.ts anthropic/claude-sonnet-4-5 "Hello"');
  process.exit(1);
}

console.log('Counting tokens...');
console.log('Model:', model);
console.log('Text:', text);
console.log('Text length:', text.length, 'characters');
console.log('');

try {
  const tokens = await countTokens(model, text);
  console.log('✅ Success!');
  console.log('Token count:', tokens);
  console.log('Ratio:', (tokens / text.length).toFixed(2), 'tokens per character');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  if (error.code) console.error('Error code:', error.code);
  if (error.statusCode) console.error('Status code:', error.statusCode);
  if (error.retryable !== undefined) console.error('Retryable:', error.retryable);
  process.exit(1);
}
