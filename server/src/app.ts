import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as healthRouter } from './routes/health.js';
import { router as sharesRouter } from './routes/shares.js';
import { router as dashboardRouter } from './routes/dashboard.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/shares', sharesRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// 404 handler for API routes
app.use('/api/v1/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
