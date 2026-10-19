import { createApp } from './app';
import { ENV } from './config/env';

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 EVENTORA API Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
  console.log(`📡 Health Check: http://localhost:${ENV.PORT}/api/health`);
  console.log(`🌐 CORS Allowed Origin: ${ENV.CLIENT_URL}`);
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
