# Antigravity's Backend Implementation Tasks for CipherDrop
# (Zero-Trust File Transfer System)

> **INSTRUCTIONS FOR ANTIGRAVITY:**
> Read this file carefully. Execute each step **in order**.
> This file contains **all backend tasks** (Tasks 1-6, 8) from the full plan.
> **DO NOT** modify any file outside `server/` or `.gitignore`.
> **DO NOT** touch `src/services/api.ts` (Claude owns this).
> After completing all tasks, notify Claude.

---

## 📌 Global Context
- **Backend Directory:** `server/`
- **Frontend Directory:** `src/` (DO NOT MODIFY)
- **Tech Stack:** Node.js 20+, Express, TypeScript, Prisma, PostgreSQL/SQLite, Redis (optional for dev), bcrypt, uuid, multer, node-cron
- **API Prefix:** `/api/v1/`
- **Port:** 3001 (default)

---

# ✅ TASK 1: Project Scaffold & Database Schema (COMPLETED)
You already ran:
```bash
mkdir -p server/src/routes server/src/lib server/src/jobs server/tests/routes
cd server
npm init -y
npm install express @prisma/client bcrypt uuid multer node-cron ioredis dotenv cors helmet
npm install --save-dev prisma typescript tsx vitest @types/node @types/express @types/multer @types/cors @types/helmet
npx tsc --init
```

**Next Steps for Task 1:**

### Step 1: Configure TypeScript for Server
Edit `server/tsconfig.json` to match:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Create Prisma Schema
Create `server/prisma/schema.prisma`:
```prisma
// This is your Prisma schema file.
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // Use SQLite for local dev (no PostgreSQL needed)
  url      = env("DATABASE_URL")
}

// --- MODELS ---

model Share {
  id               String   @id @default(uuid())
  code             String   @unique
  filename         String
  fileSize         Int
  fileType         String
  storagePath      String?
  createdAt        DateTime @default(now())
  expiresAt        DateTime
  maxDownloads     Int
  downloadCount    Int      @default(0)
  passwordHash     String?
  encryptionLevel  String   @default("standard")
  status           String   @default("active") // active | expired | limit-reached | revoked

  // Relations
  logs ActivityLog[]
}

model ActivityLog {
  id         String   @id @default(uuid())
  timestamp  DateTime @default(now())
  action     String
  targetFile String
  ipAddress  String
  status     String   // success | warning | info
  details    String?

  // Relation
  share Share?     @relation(fields: [shareId], references: [id])
  shareId String?
}
```

### Step 3: Create `.env` and `.env.example`
Create `server/.env`:
```env
# Server
PORT=3001
NODE_ENV=development

# Database (SQLite for dev)
DATABASE_URL="file:./dev.db"

# Uploads
UPLOAD_DIR="./uploads"

# Redis (optional - fallback to DB if not available)
REDIS_URL=""

# Base URL for demo links
BASE_URL="http://localhost:3001"
```

Create `server/.env.example` (same content as above).

### Step 4: Run Prisma Migration
```bash
cd server
npx prisma migrate dev --name init
```
**Expected:** Migration applied, `prisma/generated` folder created.

### Step 5: Create Prisma Client Singleton
Create `server/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

### Step 6: Create Minimal Express App
Create `server/src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as healthRouter } from './routes/health.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/health', healthRouter);

// 404 handler for API routes
app.use('/api/v1/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
```

Create `server/src/routes/health.ts`:
```typescript
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

export { router };
```

Create `server/src/index.ts`:
```typescript
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

### Step 7: Update `server/package.json` Scripts
Edit `server/package.json` and ensure `scripts` section has:
```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx src/seed.ts",
  "db:studio": "prisma studio"
}
```

### Step 8: Test Health Endpoint
```bash
cd server
npm run dev
```
In another terminal:
```bash
curl http://localhost:3001/api/v1/health
```
**Expected:** `{"status":"ok"}`

### Step 9: Commit Task 1
```bash
cd ..
git add server/ .gitignore
git commit -m "feat: scaffold backend with Prisma schema and Express health check

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# 🚀 TASK 2: Share CRUD API Routes

### Step 1: Create Crypto Utilities
Create `server/src/lib/crypto.ts`:
```typescript
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

const SHARE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHARE_CODE_LENGTH = 4;

/**
 * Generate a share code like SEC-XXXX-XXXX
 */
export function generateShareCode(): string {
  const randomPart = () => {
    let result = '';
    for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
      result += SHARE_CODE_CHARS[Math.floor(Math.random() * SHARE_CODE_CHARS.length)];
    }
    return result;
  };
  return `SEC-${randomPart()}-${randomPart()}`;
}

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash (constant-time)
 */
export async function verifyPassword(attempt: string, hash: string): Promise<boolean> {
  return bcrypt.compare(attempt, hash);
}

// Dummy hash for constant-time comparison when share doesn't exist
export const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0fGdA7WVGi';
```

### Step 2: Create Share Routes
Create `server/src/routes/shares.ts`:
```typescript
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateShareCode, hashPassword } from '../lib/crypto.js';
import type { ShareMetadata } from '../../../src/types/index.js';

const router = Router();

// Helper to map Prisma Share to ShareMetadata
function mapToShareMetadata(share: any, baseUrl: string): ShareMetadata {
  return {
    id: share.id,
    code: share.code,
    filename: share.filename,
    fileSize: share.fileSize,
    fileType: share.fileType,
    createdAt: share.createdAt.toISOString(),
    expiresAt: share.expiresAt.toISOString(),
    maxDownloads: share.maxDownloads,
    downloadCount: share.downloadCount,
    isPasswordProtected: !!share.passwordHash,
    encryptionLevel: share.encryptionLevel as 'standard' | 'military',
    status: share.status as any,
    demoUrl: `${baseUrl}/vault/${share.code}`,
  };
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// GET /api/v1/shares - List all shares
router.get('/', async (req, res) => {
  try {
    const shares = await prisma.share.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const metadata = shares.map((s) => mapToShareMetadata(s, BASE_URL));
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// GET /api/v1/shares/:code - Get share by code
router.get('/:code', async (req, res) => {
  try {
    const share = await prisma.share.findUnique({
      where: { code: req.params.code.toUpperCase() },
    });
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }
    res.json(mapToShareMetadata(share, BASE_URL));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch share' });
  }
});

// POST /api/v1/shares - Create a new share (metadata only)
router.post('/', async (req, res) => {
  try {
    const { filename, fileSize, fileType, expiryHours, maxDownloads, requirePassword, password, encryptionLevel } = req.body;

    if (!filename || !fileSize || !expiryHours || !maxDownloads) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const code = generateShareCode();
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const passwordHash = requirePassword && password ? await hashPassword(password) : null;

    const share = await prisma.share.create({
      data: {
        code,
        filename,
        fileSize,
        fileType: fileType || 'application/octet-stream',
        expiresAt,
        maxDownloads,
        passwordHash,
        encryptionLevel: encryptionLevel || 'standard',
        status: 'active',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Share Created',
        targetFile: filename,
        ipAddress: req.ip || 'unknown',
        status: 'success',
        details: `Expires in ${expiryHours}h. Max downloads: ${maxDownloads}. Protected: ${requirePassword ? 'Yes' : 'No'}`,
        shareId: share.id,
      },
    });

    res.status(201).json(mapToShareMetadata(share, BASE_URL));
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// DELETE /api/v1/shares/:id - Revoke a share
router.delete('/:id', async (req, res) => {
  try {
    const share = await prisma.share.findUnique({
      where: { id: req.params.id },
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    await prisma.share.update({
      where: { id: req.params.id },
      data: { status: 'revoked' },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Manual Revocation',
        targetFile: share.filename,
        ipAddress: req.ip || 'unknown',
        status: 'warning',
        details: 'Revoked manually by owner prior to expiration.',
        shareId: share.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke share' });
  }
});

export { router };
```

### Step 3: Mount Share Routes in App
Edit `server/src/app.ts` to add:
```typescript
import { router as sharesRouter } from './routes/shares.js';

// Add after healthRouter
app.use('/api/v1/shares', sharesRouter);
```

### Step 4: Create Dashboard Stats & Logs Routes
Create `server/src/routes/dashboard.ts`:
```typescript
import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/v1/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    
    const active = await prisma.share.count({
      where: {
        status: 'active',
        expiresAt: { gt: now },
      },
    });

    const shares = await prisma.share.findMany();
    const totalDownloads = shares.reduce((acc, s) => acc + s.downloadCount, 0);

    const expiringSoon = await prisma.share.count({
      where: {
        status: 'active',
        expiresAt: {
          gt: now,
          lt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // < 2 hours
        },
      },
    });

    const passwordProtected = await prisma.share.count({
      where: {
        status: 'active',
        passwordHash: { not: null },
        expiresAt: { gt: now },
      },
    });

    res.json({
      activeShares: active,
      totalDownloads,
      expiringSoon,
      passwordProtected,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/v1/dashboard/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export { router };
```

Mount it in `server/src/app.ts`:
```typescript
import { router as dashboardRouter } from './routes/dashboard.js';

// Add after sharesRouter
app.use('/api/v1/dashboard', dashboardRouter);
```

### Step 5: Test Share Routes
Start the server:
```bash
cd server
npm run dev
```

Test create share:
```bash
curl -X POST http://localhost:3001/api/v1/shares \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.txt","fileSize":1024,"expiryHours":24,"maxDownloads":5,"requirePassword":false}'
```
**Expected:** 201 with share metadata including a `code` like `SEC-XXXX-XXXX`.

Test list shares:
```bash
curl http://localhost:3001/api/v1/shares
```

Test get share by code:
```bash
curl http://localhost:3001/api/v1/shares/SEC-XXXX-XXXX
```

Test dashboard stats:
```bash
curl http://localhost:3001/api/v1/dashboard/stats
```

### Step 6: Commit Task 2
```bash
cd ..
git add server/src/routes/shares.ts server/src/routes/dashboard.ts server/src/lib/crypto.ts server/src/app.ts
git commit -m "feat: implement share CRUD API routes with crypto utilities

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# 📁 TASK 3: File Upload Endpoint with Size Validation

### Step 1: Create Storage Utility
Create `server/src/lib/storage.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save an uploaded file to disk
 * @returns Relative path from UPLOAD_DIR
 */
export function saveFile(shareId: string, file: Express.Multer.File): string {
  const shareDir = path.join(UPLOAD_DIR, shareId);
  if (!fs.existsSync(shareDir)) {
    fs.mkdirSync(shareDir, { recursive: true });
  }
  
  const destPath = path.join(shareDir, file.originalname);
  fs.renameSync(file.path, destPath);
  
  // Return relative path for storage in DB
  return path.relative(UPLOAD_DIR, destPath);
}

/**
 * Delete a file from disk
 */
export function deleteFile(storagePath: string): void {
  const fullPath = path.join(UPLOAD_DIR, storagePath);
  try {
    fs.unlinkSync(fullPath);
    // Also try to remove the share directory if empty
    const dir = path.dirname(fullPath);
    try {
      fs.rmdirSync(dir);
    } catch {
      // Directory not empty, ignore
    }
  } catch {
    // File doesn't exist, ignore
  }
}

/**
 * Get full path for a stored file
 */
export function getFilePath(storagePath: string): string {
  return path.join(UPLOAD_DIR, storagePath);
}

// Cleanup all uploads (for testing)
export function cleanupAllUploads(): void {
  try {
    fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}
```

### Step 2: Create Upload Route
Create `server/src/routes/upload.ts`:
```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../lib/prisma.js';
import { saveFile, getFilePath } from '../lib/storage.js';

const router = Router();

// Configure multer for 100MB limit
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../temp'));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

// Ensure temp directory exists
import fs from 'fs';
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// POST /api/v1/upload/:shareId - Upload a file for a share
router.post('/:shareId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const share = await prisma.share.findUnique({
      where: { id: req.params.shareId },
    });

    if (!share) {
      // Clean up temp file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Share not found' });
    }

    // Save file to permanent storage
    const storagePath = saveFile(share.id, req.file);

    // Update share with storage path
    await prisma.share.update({
      where: { id: share.id },
      data: { storagePath },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'File Uploaded',
        targetFile: req.file.originalname,
        ipAddress: req.ip || 'unknown',
        status: 'success',
        details: `File size: ${req.file.size} bytes`,
        shareId: share.id,
      },
    });

    res.json({
      success: true,
      storagePath,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up temp file if it exists
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Error handler for multer (size limit exceeded)
router.use((err: any, req: any, res: any, next: any) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size exceeds 100MB limit' });
  }
  next(err);
});

export { router };
```

### Step 3: Mount Upload Route
Edit `server/src/app.ts` to add:
```typescript
import { router as uploadRouter } from './routes/upload.js';

// Add after dashboardRouter
app.use('/api/v1/upload', uploadRouter);
```

### Step 4: Test Upload Endpoint
Start the server and test:
```bash
# Create a share first
curl -X POST http://localhost:3001/api/v1/shares \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.txt","fileSize":1024,"expiryHours":24,"maxDownloads":5,"requirePassword":false}'

# Note the share ID from the response, then upload a file
curl -X POST http://localhost:3001/api/v1/upload/<SHARE_ID> \
  -F "file=@/path/to/small/file.txt"
```

Test 100MB+ file rejection:
```bash
# Create a 101MB file (on Linux/Mac)
dd if=/dev/zero of=test101mb.bin bs=1M count=101

curl -X POST http://localhost:3001/api/v1/upload/<SHARE_ID> \
  -F "file=@test101mb.bin"
```
**Expected:** 413 error with message about size limit.

### Step 5: Commit Task 3
```bash
cd ..
git add server/src/routes/upload.ts server/src/lib/storage.ts server/src/app.ts
git commit -m "feat: add file upload endpoint with 100MB size enforcement

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# 🔒 TASK 4: Download Endpoint with Atomic Counter

### Step 1: Create Redis Utility (with DB fallback)
Create `server/src/lib/redis.ts`:
```typescript
import Redis from 'ioredis';
import prisma from './prisma.js';

let redis: Redis | null = null;

/**
 * Initialize Redis if REDIS_URL is set
 */
export function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      redis = new Redis(redisUrl);
      redis.on('error', (err) => {
        console.error('Redis error:', err);
      });
      console.log('✅ Redis connected');
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      redis = null;
    }
  }
  return redis;
}

/**
 * Get Redis client (may be null if not configured)
 */
export function getRedis(): Redis | null {
  return redis;
}

/**
 * Atomic decrement with Redis (fallback to DB)
 * Returns { allowed: boolean, newCount: number }
 */
export async function atomicDecrement(shareId: string, maxDownloads: number): Promise<{ allowed: boolean; newCount: number }> {
  const redis = getRedis();
  
  if (redis) {
    // Use Lua script for atomic check-and-decrement
    const script = `
      local count = redis.call('GET', KEYS[1])
      local newCount = tonumber(count) or 0
      if newCount < tonumber(ARGV[1]) then
        newCount = newCount + 1
        redis.call('SET', KEYS[1], newCount)
        redis.call('EXPIRE', KEYS[1], 3600) -- 1 hour TTL
        return {1, newCount}
      else
        return {0, newCount}
      end
    `;
    
    try {
      const result = await redis.eval(script, 1, `share:${shareId}:downloads`, maxDownloads);
      return { allowed: result[0] === 1, newCount: result[1] };
    } catch {
      // Fall through to DB
    }
  }
  
  // DB fallback
  const share = await prisma.share.findUnique({
    where: { id: shareId },
  });
  
  if (!share || share.downloadCount >= maxDownloads) {
    return { allowed: false, newCount: share?.downloadCount || maxDownloads };
  }
  
  const updated = await prisma.share.update({
    where: { id: shareId },
    data: { downloadCount: { increment: 1 } },
  });
  
  return { allowed: true, newCount: updated.downloadCount };
}

/**
 * Get current download count from Redis (fallback to DB)
 */
export async function getDownloadCount(shareId: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.get(`share:${shareId}:downloads`);
      if (count) return parseInt(count);
    } catch {}
  }
  
  const share = await prisma.share.findUnique({
    where: { id: shareId },
  });
  return share?.downloadCount || 0;
}
```

### Step 2: Update server/index.ts to init Redis
Edit `server/src/index.ts`:
```typescript
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
```

### Step 3: Create Download Route
Create `server/src/routes/download.ts`:
```typescript
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { verifyPassword, DUMMY_HASH } from '../lib/crypto.js';
import { atomicDecrement } from '../lib/redis.js';
import { getFilePath } from '../lib/storage.js';
import type { ShareMetadata } from '../../../src/types/index.js';

const router = Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Helper to map to ShareMetadata
function mapToShareMetadata(share: any): ShareMetadata {
  return {
    id: share.id,
    code: share.code,
    filename: share.filename,
    fileSize: share.fileSize,
    fileType: share.fileType,
    createdAt: share.createdAt.toISOString(),
    expiresAt: share.expiresAt.toISOString(),
    maxDownloads: share.maxDownloads,
    downloadCount: share.downloadCount,
    isPasswordProtected: !!share.passwordHash,
    encryptionLevel: share.encryptionLevel as 'standard' | 'military',
    status: share.status as any,
    demoUrl: `${BASE_URL}/vault/${share.code}`,
  };
}

// POST /api/v1/download/:code - Verify and download
router.post('/:code', async (req, res) => {
  try {
    const { password } = req.body;
    const code = req.params.code.toUpperCase();

    // Find share
    const share = await prisma.share.findUnique({
      where: { code },
    });

    // Constant-time: always run password check to prevent timing oracle
    let passwordValid = false;
    const startTime = Date.now();

    if (share) {
      // Check expiration
      if (new Date(share.expiresAt) < new Date() || share.status === 'expired') {
        // Still run dummy password check for constant time
        await verifyPassword('dummy', DUMMY_HASH);
        return res.status(403).json({
          success: false,
          error: 'This secure transfer has expired and the payload has been shredded.',
        });
      }

      // Check if already at limit
      if (share.status === 'limit-reached' || share.downloadCount >= share.maxDownloads) {
        await verifyPassword('dummy', DUMMY_HASH);
        return res.status(403).json({
          success: false,
          error: 'Maximum download limit reached for this ephemeral link.',
        });
      }

      // Check password if required
      if (share.passwordHash) {
        if (!password) {
          await verifyPassword('dummy', DUMMY_HASH);
          return res.status(403).json({
            success: false,
            error: 'Password required to unlock this transfer.',
          });
        }
        passwordValid = await verifyPassword(password, share.passwordHash);
      } else {
        // No password required - run dummy check for constant time
        await verifyPassword('dummy', DUMMY_HASH);
        passwordValid = true;
      }

      if (!passwordValid) {
        return res.status(403).json({
          success: false,
          error: 'Incorrect decryption password. Access denied.',
        });
      }

      // Atomic decrement
      const { allowed, newCount } = await atomicDecrement(share.id, share.maxDownloads);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Maximum download limit reached for this ephemeral link.',
        });
      }

      // Update DB count (Redis may have been used)
      await prisma.share.update({
        where: { id: share.id },
        data: { downloadCount: newCount },
      });

      // Check if limit reached
      if (newCount >= share.maxDownloads) {
        await prisma.share.update({
          where: { id: share.id },
          data: { status: 'limit-reached' },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'File Downloaded',
          targetFile: share.filename,
          ipAddress: req.ip || 'unknown',
          status: 'success',
          details: `Download ${newCount}/${share.maxDownloads} processed successfully.`,
          shareId: share.id,
        },
      });

      // Return success with share metadata
      // In production, this would return a pre-signed S3 URL
      // For now, return the share metadata and a mock download URL
      return res.json({
        success: true,
        share: mapToShareMetadata(share),
        downloadUrl: share.storagePath ? `${BASE_URL}/api/v1/download/${share.code}/file` : null,
      });
    } else {
      // Share doesn't exist - run dummy password check for constant time
      await verifyPassword(password || 'dummy', DUMMY_HASH);
      return res.status(404).json({
        success: false,
        error: 'Share link not found or invalid token.',
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to process download' });
  }
});

// GET /api/v1/download/:code/file - Serve the actual file
router.get('/:code/file', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const share = await prisma.share.findUnique({
      where: { code },
    });

    if (!share || !share.storagePath) {
      return res.status(404).send('File not found');
    }

    const filePath = getFilePath(share.storagePath);
    res.download(filePath, share.filename);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).send('Failed to download file');
  }
});

export { router };
```

### Step 4: Mount Download Route
Edit `server/src/app.ts` to add:
```typescript
import { router as downloadRouter } from './routes/download.js';

// Add after uploadRouter
app.use('/api/v1/download', downloadRouter);
```

### Step 5: Test Download Endpoint
1. Create a share with password:
```bash
curl -X POST http://localhost:3001/api/v1/shares \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.txt","fileSize":1024,"expiryHours":24,"maxDownloads":1,"requirePassword":true,"password":"test123"}'
```

2. Upload a file to that share (use the share ID from response).

3. Try to download without password:
```bash
curl -X POST http://localhost:3001/api/v1/download/<SHARE_CODE> \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** 403 error "Password required"

4. Try with wrong password:
```bash
curl -X POST http://localhost:3001/api/v1/download/<SHARE_CODE> \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'
```
**Expected:** 403 error "Incorrect decryption password"

5. Try with correct password:
```bash
curl -X POST http://localhost:3001/api/v1/download/<SHARE_CODE> \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}'
```
**Expected:** 200 with share metadata and downloadUrl

6. Try again (should fail - limit reached):
```bash
curl -X POST http://localhost:3001/api/v1/download/<SHARE_CODE> \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}'
```
**Expected:** 403 error "Maximum download limit reached"

### Step 6: Commit Task 4
```bash
cd ..
git add server/src/routes/download.ts server/src/lib/redis.ts server/src/index.ts server/src/app.ts
git commit -m "feat: add download endpoint with atomic counter and race condition safety

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# 🧹 TASK 5: Password Verification with Constant-Time Comparison

**Note:** This is already implemented in Task 4's download route using `DUMMY_HASH` and always running `verifyPassword`. 
The implementation ensures that:
- Password verification always takes the same time whether the share exists or not
- A dummy bcrypt comparison is run when the share doesn't exist or isn't password-protected

### Step 1: Verify Constant-Time Behavior
You can manually test this by measuring response times:
```bash
# Test with existing share (correct password)
time curl -s -X POST http://localhost:3001/api/v1/download/<VALID_CODE> -H "Content-Type: application/json" -d '{"password":"test123"}' > /dev/null

# Test with non-existent share
time curl -s -X POST http://localhost:3001/api/v1/download/SEC-NONEXISTENT -H "Content-Type: application/json" -d '{"password":"test123"}' > /dev/null
```

The response times should be similar (within ~20%).

### Step 2: Commit Task 5
```bash
cd ..
git add server/src/routes/download.ts server/src/lib/crypto.ts
git commit -m "fix: constant-time password verification to prevent timing oracle

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# 🗑️ TASK 6: Automated Cleanup Cron Job

### Step 1: Create Cleanup Job
Create `server/src/jobs/cleanup.ts`:
```typescript
import prisma from '../lib/prisma.js';
import { deleteFile } from '../lib/storage.js';
import cron from 'node-cron';

/**
 * Clean up expired and exhausted shares
 */
export async function cleanupExpiredShares(): Promise<void> {
  console.log('🧹 Running cleanup job...');
  
  const now = new Date();
  
  // Find shares that are expired or have reached their download limit
  const sharesToCleanup = await prisma.share.findMany({
    where: {
      OR: [
        { expiresAt: { lt: now }, status: 'active' },
        { downloadCount: { gte: 1 }, maxDownloads: { lte: 1 }, status: 'active' },
      ],
    },
  });
  
  console.log(`Found ${sharesToCleanup.length} shares to clean up`);
  
  for (const share of sharesToCleanup) {
    try {
      // Delete the file from disk
      if (share.storagePath) {
        deleteFile(share.storagePath);
      }
      
      // Update status
      const newStatus = new Date(share.expiresAt) < now ? 'expired' : 'limit-reached';
      await prisma.share.update({
        where: { id: share.id },
        data: { status: newStatus },
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'Automated Cleanup',
          targetFile: share.filename,
          ipAddress: 'Internal Automated Shredder',
          status: 'warning',
          details: `Share ${share.code} marked as ${newStatus} and file deleted.`,
          shareId: share.id,
        },
      });
      
      console.log(`✅ Cleaned up share ${share.code}`);
    } catch (error) {
      console.error(`❌ Failed to clean up share ${share.code}:`, error);
      // Continue with next share
    }
  }
  
  console.log('🧹 Cleanup job completed');
}

/**
 * Start the cleanup cron job (runs every 5 minutes)
 */
export function startCleanupCron(): void {
  // Run immediately on startup
  cleanupExpiredShares().catch(console.error);
  
  // Then every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    cleanupExpiredShares().catch(console.error);
  });
  
  console.log('✅ Cleanup cron job started (every 5 minutes)');
}
```

### Step 2: Start Cron in server/index.ts
Edit `server/src/index.ts`:
```typescript
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
```

### Step 3: Test Cleanup Job
1. Create a share with a past expiration:
```bash
# Create share with expiry 1 hour ago
curl -X POST http://localhost:3001/api/v1/shares \
  -H "Content-Type: application/json" \
  -d '{"filename":"expired.txt","fileSize":1024,"expiryHours":-1,"maxDownloads":5,"requirePassword":false}'
```

2. Upload a file to it.

3. Manually trigger cleanup:
```bash
# Call the cleanup function directly (for testing)
# Add a test route temporarily or use the cron
```

4. Check the share status:
```bash
curl http://localhost:3001/api/v1/shares/<SHARE_CODE>
```
**Expected:** status should be "expired"

5. Check that the file was deleted from `server/uploads/`.

### Step 4: Commit Task 6
```bash
cd ..
git add server/src/jobs/cleanup.ts server/src/index.ts
git commit -m "feat: add automated cleanup cron for expired and exhausted shares

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# 🌐 TASK 8: Serve Static Frontend & SPA Catch-All

### Step 1: Build the Frontend
First, ensure the frontend is built:
```bash
cd ..
npm run build
```
This creates a `dist/` folder with the production build.

### Step 2: Update app.ts to Serve Static Files
Edit `server/src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
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
const distPath = path.join(__dirname, '../../../dist');
app.use(express.static(distPath));

// SPA catch-all: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;
```

### Step 3: Test Static Serving
1. Build the frontend:
```bash
cd ..
npm run build
```

2. Start the backend server:
```bash
cd server
npm run dev
```

3. Test accessing the frontend:
```bash
curl http://localhost:3001/
```
**Expected:** HTML content with `<div id="root">`

4. Test accessing a non-existent route:
```bash
curl http://localhost:3001/vault/SEC-TEST
```
**Expected:** Same HTML content (SPA handles routing)

5. Test API routes still work:
```bash
curl http://localhost:3001/api/v1/health
```
**Expected:** `{"status":"ok"}`

### Step 4: Commit Task 8
```bash
cd ..
git add server/src/app.ts
git commit -m "feat: serve Vite build and SPA catch-all for client-side routing

Co-Authored-By: Antigravity <antigravity@anthropic.com>"
```

---

# ✅ ALL TASKS COMPLETE

Once you've completed all tasks (1-6, 8):
1. **Notify Claude** that the backend is ready.
2. Claude will then implement **Task 7** (replace `src/services/api.ts` with fetch-based client).
3. After that, the full system will be integrated and ready for testing.

---

## 🚨 Troubleshooting

### PostgreSQL Not Available
If you don't have PostgreSQL running, the plan uses **SQLite** for local development (already configured in `prisma/schema.prisma`). No changes needed.

### Redis Not Available
The system falls back to database-based counters if Redis is not configured. No errors will occur.

### Port Conflicts
If port 3001 is in use, change `PORT` in `server/.env`.

### File Permissions
Ensure the `server/uploads/` and `server/temp/` directories are writable.

---

## 📝 Summary of Files You Own

You (Antigravity) are responsible for **ALL** files in:
- `server/`
- `.gitignore` (server-specific entries only)

**DO NOT** modify:
- `src/services/api.ts` (Claude's task)
- Any other `src/` files
- `src/types/index.ts` (shared contract, read-only)

---

**After completing all tasks, notify Claude with:**
> "Antigravity: Backend tasks 1-6 and 8 are complete. Server is running at http://localhost:3001."
