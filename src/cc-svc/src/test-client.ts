/**
 * Simple test client for the cc-svc streaming endpoint
 * Usage: npm run test
 */

const PORT = process.env.PORT || '3052';
const BASE_URL = `http://localhost:${PORT}`;

interface TestRequest {
  prompt: string;
  allowedTools?: string[];
  chatId?: string;
  resumeSessionId?: string;
  includePartialMessages?: boolean;
}

/**
 * Test the streaming endpoint
 */
async function testStream(request: TestRequest) {
  console.log('🧪 Testing streaming endpoint...');
  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('');

  try {
    const response = await fetch(`${BASE_URL}/agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Parse Server-Sent Events
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;

      if (done) {
        console.log('✅ Stream completed');
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const event = line.substring(6).trim();
          console.log(`📡 Event: ${event}`);
        } else if (line.startsWith('data:')) {
          const data = line.substring(5).trim();
          try {
            const parsed = JSON.parse(data);
            console.log('📦 Data:', JSON.stringify(parsed, null, 2));
          } catch {
            console.log('📦 Data:', data);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Test the non-streaming endpoint
 */
async function testProcess(request: TestRequest) {
  console.log('🧪 Testing process endpoint...');
  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('');

  try {
    const response = await fetch(`${BASE_URL}/agent/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Test health endpoint
 */
async function testHealth() {
  console.log('🧪 Testing health endpoint...');

  try {
    const response = await fetch(`${BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const health = await response.json();
    console.log('✅ Health:', JSON.stringify(health, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Is the server running? Start it with: npm run dev');
    process.exit(1);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 CC-SVC Test Client');
  console.log('='.repeat(50));
  console.log('');

  // Test health first
  await testHealth();

  // Test request
  const testRequest: TestRequest = {
    prompt: 'What is 2+2? Just give me the answer.',
    allowedTools: [],
    includePartialMessages: true,
  };

  // Choose test mode
  const mode = process.argv[2] || 'stream';

  if (mode === 'stream') {
    await testStream(testRequest);
  } else if (mode === 'process') {
    await testProcess(testRequest);
  } else {
    console.error('❌ Invalid mode. Use: npm run test [stream|process]');
    process.exit(1);
  }
}

main();
