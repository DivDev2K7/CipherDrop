import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as healthRouter } from './routes/health.js';
import { router as sharesRouter } from './routes/shares.js';
import { router as dashboardRouter } from './routes/dashboard.js';
import { router as uploadRouter } from './routes/upload.js';
import { router as downloadRouter } from './routes/download.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/shares', sharesRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/download', downloadRouter);

// 404 handler for API routes
app.use('/api/v1/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve static files from Vite build
const candidates = [
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../../../dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '../dist'),
];
const distPath = candidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || path.join(__dirname, '../../dist');

app.use(express.static(distPath));

// SPA catch-all: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;
