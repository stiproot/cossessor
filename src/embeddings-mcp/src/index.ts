import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mcpRouter, healthRouter } from './routes';
import { config } from './config';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/health', healthRouter);
app.use('/mcp', mcpRouter);

// Start server
app.listen(config.port, () => {
  logger.info(`Embeddings MCP server running on port ${config.port}`);
  logger.info(`Embeddings API: ${config.embeddings.host}:${config.embeddings.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
