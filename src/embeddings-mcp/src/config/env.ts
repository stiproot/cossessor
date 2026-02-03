import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('8912'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  EMBEDDINGS_API_HOST: z.string().default('localhost'),
  EMBEDDINGS_API_PORT: z.string().default('5000'),
  EMBEDDINGS_API_TIMEOUT: z.string().default('60000'),
  DEFAULT_CODEBASE_PATH: z.string().default('/workspace'),
});

export const config = {
  port: parseInt(process.env.PORT || '8912'),
  logLevel: process.env.LOG_LEVEL || 'info',
  embeddings: {
    host: process.env.EMBEDDINGS_API_HOST || 'localhost',
    port: parseInt(process.env.EMBEDDINGS_API_PORT || '5000'),
    timeout: parseInt(process.env.EMBEDDINGS_API_TIMEOUT || '60000'),
    baseUrl: `http://${process.env.EMBEDDINGS_API_HOST || 'localhost'}:${process.env.EMBEDDINGS_API_PORT || '5000'}`,
  },
  defaultCodebasePath: process.env.DEFAULT_CODEBASE_PATH || '/workspace',
};
