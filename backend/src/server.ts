import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/config.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeWebSocketServer } from './websocket/server.js';
import { initializeNotificationCleanupJob } from './jobs/notificationCleanup.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import lockerRoutes from './routes/lockers.js';
import inventoryRoutes from './routes/inventory.js';
import keyRoutes from './routes/keys.js';
import billingRoutes from './routes/billing.js';
import reportsRoutes from './routes/reports.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import messagesRoutes from './routes/messages.js';
import publicRoutes from './routes/public.js';
import productsRoutes from './routes/products.js';
import announcementsRoutes from './routes/announcements.js';
import activitiesRoutes from './routes/activities.js';
import stockIntakeRoutes from './routes/stockIntake.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors(config.cors));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lockers', lockerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/stock-intake', stockIntakeRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/public', publicRoutes); // Public endpoints (no auth required)

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

    // Initialize WebSocket server
    initializeWebSocketServer(httpServer);

    // Initialize notification cleanup job
    initializeNotificationCleanupJob();

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ WebSocket server initialized`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
