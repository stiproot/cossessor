import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { agentRoutes, healthRoutes } from './routes/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3010', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoutes);
app.use('/v1/agent', agentRoutes);

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log('🚀 CC-SVC (Claude Agent SDK Service) started');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Stream: POST http://localhost:${PORT}/v1/agent/stream`);
  console.log('');
});

// Error handling
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('Options:');
    console.error(`  1. Kill the process using port ${PORT}`);
    console.error(`  2. Use a different port: PORT=3053 npm run dev`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
