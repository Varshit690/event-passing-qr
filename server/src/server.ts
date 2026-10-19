import { createApp } from './app';
import { ENV } from './config/env';

const app = createApp();

const port = ENV.PORT;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 EVENTORA API Server running on port ${port} [${ENV.NODE_ENV}]`);
  console.log(`📡 Health Check: http://localhost:${port}/api/health`);
  console.log(`🌐 Primary Client URL: ${ENV.CLIENT_URL}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});
