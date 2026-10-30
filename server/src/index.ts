import app from './app.js';
import dotenv from 'dotenv';
import { initRedis } from './lib/redis.js';
import { startCleanupCron } from './jobs/cleanup.js';

dotenv.config();

// Initialize Redis
initRedis();

// Start cleanup cron
startCleanupCron();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
