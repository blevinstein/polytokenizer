#!/usr/bin/env tsx

/**
 * CLI script to test embedText
 * Usage: tsx scripts/embed-text.ts <model> <text> [dimensions]
 * Example: tsx scripts/embed-text.ts google/gemini-embedding-001 "Hello world" 768
 */

import { embedText } from '../src/index.js';

const [model, text, dimensionsStr] = process.argv.slice(2);
const dimensions = dimensionsStr ? parseInt(dimensionsStr, 10) : undefined;

if (!model || !text) {
  console.error('Usage: tsx scripts/embed-text.ts <model> <text> [dimensions]');
  console.error('');
  console.error('Examples:');
  console.error('  tsx scripts/embed-text.ts google/gemini-embedding-001 "Hello world"');
  console.error('  tsx scripts/embed-text.ts google/gemini-embedding-001 "Hello world" 768');
  console.error('  tsx scripts/embed-text.ts openai/text-embedding-3-small "Test"');
  console.error('  tsx scripts/embed-text.ts openai/text-embedding-3-large "Test" 1024');
  console.error('  tsx scripts/embed-text.ts vertex/text-embedding-005 "Hello"');
  process.exit(1);
}

console.log('Generating embedding...');
console.log('Model:', model);
console.log('Text:', text);
console.log('Text length:', text.length, 'characters');
if (dimensions) console.log('Dimensions:', dimensions);
console.log('');

try {
  const result = await embedText(model, text, dimensions);
  console.log('✅ Success!');
  console.log('Model:', result.model);
  console.log('Vector dimensions:', result.vector.length);
  console.log('First 5 values:', result.vector.slice(0, 5).map(v => v.toFixed(4)));
  console.log('Tokens used:', result.usage.tokens);
  if (result.usage.cost) {
    console.log('Cost:', `$${result.usage.cost.toFixed(6)}`);
  }
} catch (error: any) {
  console.error('❌ Error:', error.message);
  if (error.code) console.error('Error code:', error.code);
  if (error.statusCode) console.error('Status code:', error.statusCode);
  if (error.retryable !== undefined) console.error('Retryable:', error.retryable);
  process.exit(1);
}
