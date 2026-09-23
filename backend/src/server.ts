import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Businz Enterprise HRMS Production Backend`);
  console.log(`📡 Listening on: http://localhost:${env.PORT}`);
  console.log(`🏥 Health Check: http://localhost:${env.PORT}/health`);
  console.log(`📊 API Base URL: http://localhost:${env.PORT}/api/v1`);
  console.log(`🌍 Environment:  ${env.NODE_ENV}`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
