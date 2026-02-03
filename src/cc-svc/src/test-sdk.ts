/**
 * Debug script to test Claude SDK directly
 */
import 'dotenv/config';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { resolve } from 'path';

const localClaudeCodePath = resolve(process.cwd(), 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');

console.log('=== SDK Test Debug ===');
console.log('Local claude-code path:', localClaudeCodePath);
console.log('ANTHROPIC_BASE_URL:', process.env.ANTHROPIC_BASE_URL);
console.log(
  'ANTHROPIC_AUTH_TOKEN:',
  process.env.ANTHROPIC_AUTH_TOKEN ? 'SET (len=' + process.env.ANTHROPIC_AUTH_TOKEN.length + ')' : 'NOT SET'
);

// The SDK expects ANTHROPIC_API_KEY
if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  console.log('Copied ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY');
}

console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET');
console.log('');

async function main() {
  try {
    console.log('Starting query...');
    const result = query({
      prompt: 'What is 2+2? Reply with just the number.',
      options: {
        pathToClaudeCodeExecutable: localClaudeCodePath,
        permissionMode: 'bypassPermissions',
        includePartialMessages: true,
      },
    });

    for await (const msg of result) {
      console.log(`[${msg.type}]`, JSON.stringify(msg).slice(0, 200));
    }
    console.log('Query completed successfully!');
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
