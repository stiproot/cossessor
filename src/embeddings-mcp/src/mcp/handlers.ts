import { embedCodebase, queryCodebase } from '../services/embeddings';
import { logger } from '../utils/logger';

export async function handleEmbedCodebase(input: { file_system_path: string }) {
  logger.info(`MCP Tool: embed_codebase called with path: ${input.file_system_path}`);

  try {
    const result = await embedCodebase(input.file_system_path);
    logger.info(`Embedding completed successfully for ${input.file_system_path}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Successfully embedded codebase at ${input.file_system_path}`,
          result,
        }, null, 2),
      }],
    };
  } catch (error: any) {
    logger.error(`Embedding failed: ${error.message}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export async function handleSearchCodebase(input: {
  query: string;
  file_system_path: string;
  max_results?: number;
}) {
  logger.info(`MCP Tool: search_codebase called with query: "${input.query}"`);

  try {
    const result = await queryCodebase(input.query, input.file_system_path);

    // Format results for Claude
    const documents = result.output?.documents || [];
    const formattedResults = documents.slice(0, input.max_results || 5).map((doc: any, i: number) => ({
      rank: i + 1,
      source: doc.source || 'unknown',
      content: doc.page_content || '',
    }));

    logger.info(`Search returned ${formattedResults.length} results`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          query: input.query,
          results_count: formattedResults.length,
          results: formattedResults,
        }, null, 2),
      }],
    };
  } catch (error: any) {
    logger.error(`Search failed: ${error.message}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
        }, null, 2),
      }],
      isError: true,
    };
  }
}
