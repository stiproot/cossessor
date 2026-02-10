/**
 * Simplified request payload for the agent streaming endpoint
 * Only accepts the essential fields for a conversation
 */
export interface AgentStreamRequest {
  /**
   * Client-side chat identifier for tracking conversations
   * This is NOT the Claude session_id - it's for client-side state management
   */
  chatId: string;

  /**
   * The user's request/prompt
   */
  userRequest: string;

  /**
   * Absolute path to the codebase directory for analysis
   * This codebase must be pre-embedded using the embeddings service
   * Example: "/Users/john/projects/my-app"
   */
  codebase_path: string;

  /**
   * Optional: Claude Code session_id from a previous conversation
   * Use this to resume a previous Claude session with full context
   * Get this value from the 'session_id' field in the init message of a previous response
   */
  resumeSessionId?: string;

  /**
   * Optional: Metadata/context arguments to pass to MCP servers
   * These will be injected as HTTP headers to MCP servers that support contextArgs
   * Common fields: userId, operatorId, sessionId, etc.
   */
  metadata?: Record<string, unknown>;
}
