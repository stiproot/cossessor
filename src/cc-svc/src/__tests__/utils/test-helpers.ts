import type { AgentStreamRequest, StreamEvent } from '../../types/index.js';

/**
 * Parse SSE stream into array of events
 * Handles SSE format with both event: and data: lines
 */
export async function parseSSEStream(response: Response): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE messages (separated by \n\n)
    const messages = buffer.split('\n\n');
    buffer = messages.pop() || '';

    for (const message of messages) {
      if (!message.trim()) continue;

      // Parse SSE message with event: and data: lines
      const lines = message.split('\n');
      let eventType = '';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          data = line.slice(6);
        }
      }

      // Parse the data JSON and add event type
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // Use event type from SSE if available, otherwise from data
          if (eventType && !parsed.type) {
            parsed.type = eventType;
          }
          events.push(parsed);
        } catch (e) {
          console.warn('Failed to parse SSE data:', data);
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const lines = buffer.split('\n');
    let data = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        data = line.slice(6);
      }
    }

    if (data) {
      try {
        const parsed = JSON.parse(data);
        events.push(parsed);
      } catch (e) {
        console.warn('Failed to parse final SSE buffer:', data);
      }
    }
  }

  return events;
}

/**
 * Wait for specific event type in stream
 */
export function waitForEvent(
  events: StreamEvent[],
  eventType: string
): StreamEvent | undefined {
  return events.find(e => e.type === eventType);
}

/**
 * Create test request
 */
export function createTestRequest(
  userRequest: string,
  options?: Partial<AgentStreamRequest>
): AgentStreamRequest {
  return {
    chatId: `test-${Date.now()}`,
    userRequest,
    ...options
  };
}

/**
 * Wait for service to be ready
 */
export async function waitForService(
  url: string,
  timeout: number = 30000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch (e) {
      // Service not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

/**
 * Extract findings from review result
 */
export function extractFindings(events: StreamEvent[]): any {
  const resultEvent = waitForEvent(events, 'result');
  if (!resultEvent?.result) throw new Error('No result event found');
  return JSON.parse(resultEvent.result);
}

/**
 * Extract all message content from stream events
 */
export function extractMessages(events: StreamEvent[]): string[] {
  return events
    .filter(e => e.type === 'message' && e.content)
    .flatMap(e => {
      if (Array.isArray(e.content)) {
        return e.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text);
      }
      return [];
    });
}

/**
 * Check if stream contains tool use
 */
export function hasToolUse(events: StreamEvent[], toolName?: string): boolean {
  return events.some(e => {
    if (e.type !== 'message' || !Array.isArray(e.content)) return false;
    return e.content.some((c: any) => {
      if (c.type !== 'tool_use') return false;
      if (toolName) return c.name === toolName;
      return true;
    });
  });
}
