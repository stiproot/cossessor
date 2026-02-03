import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

const embeddingsClient = axios.create({
  baseURL: config.embeddings.baseUrl,
  timeout: config.embeddings.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function embedCodebase(fileSystemPath: string) {
  logger.debug(`Calling embeddings-api POST /embed with path: ${fileSystemPath}`);

  try {
    const response = await embeddingsClient.post('/embed', {
      file_system_path: fileSystemPath,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Embeddings API error: ${message}`);
    }
    throw error;
  }
}

export async function queryCodebase(query: string, fileSystemPath: string) {
  logger.debug(`Calling embeddings-api POST /qry with query: "${query}"`);

  try {
    const response = await embeddingsClient.post('/qry', {
      qry: query,
      file_system_path: fileSystemPath,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Query API error: ${message}`);
    }
    throw error;
  }
}
