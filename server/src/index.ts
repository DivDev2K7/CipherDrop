import app from './app.js';
import dotenv from 'dotenv';
import { initRedis } from './lib/redis.js';
import { initS3 } from './lib/s3.js';
import { startCleanupCron } from './jobs/cleanup.js';

dotenv.config();

// Initialize Redis
initRedis();

// Initialize S3 (if AWS credentials are configured)
initS3();

// Start cleanup cron
startCleanupCron();

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
});