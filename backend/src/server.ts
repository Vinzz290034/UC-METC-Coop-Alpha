import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import lockerRoutes from './routes/lockers.js';
import inventoryRoutes from './routes/inventory.js';
import keyRoutes from './routes/keys.js';
import billingRoutes from './routes/billing.js';
import reportsRoutes from './routes/reports.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors(config.cors));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lockers', lockerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'UC METC Coop Backend running' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please ensure PostgreSQL is running and credentials are correct.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
