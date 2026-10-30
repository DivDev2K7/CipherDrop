import app from './app.js';
import dotenv from 'dotenv';
import { initRedis } from './lib/redis.js';

dotenv.config();

// Initialize Redis
initRedis();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
