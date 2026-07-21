import app from './app';
import { prisma } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Start Express HTTP server first
  app.listen(PORT, () => {
    console.log(`🚀 Custom Backend Server running at http://localhost:${PORT}`);
  });

  // Attempt database connection in background
  try {
    await prisma.$connect();
    console.log('⚡ Connected to Neon PostgreSQL Database via Prisma ORM');
  } catch (error: any) {
    console.warn('⚠️ PostgreSQL connection deferred / warning:', error.message || error);
  }
};

startServer();
