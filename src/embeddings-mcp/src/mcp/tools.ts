export const mcpTools = {
  embed_codebase: {
    name: 'embed_codebase',
    description: 'Embed a codebase into the vector database for semantic search. This processes all code files in the specified path and creates embeddings.',
    inputSchema: {
      type: 'object',
      properties: {
        file_system_path: {
          type: 'string',
          description: 'Absolute path to the codebase directory to embed',
        },
      },
      required: ['file_system_path'],
    },
  },

  search_codebase: {
    name: 'search_codebase',
    description: 'Search an embedded codebase using vector similarity. Returns the most relevant code snippets based on the query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query to search for in the codebase',
        },
        file_system_path: {
          type: 'string',
          description: 'Absolute path to the codebase that was previously embedded',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5,
        },
      },
      required: ['query', 'file_system_path'],
    },
  },
};
