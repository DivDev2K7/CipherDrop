# CipherDrop Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js/Express backend that replaces the in-memory mock `transferApi` with a real PostgreSQL + Redis service, serving both the REST API and the existing Vite frontend without file collisions between agents.

**Architecture:** Express server in `server/` with Prisma ORM for PostgreSQL, Redis for rate limiting and download counters, and local disk storage for files during dev. The existing frontend `src/services/api.ts` is replaced with a fetch-based implementation matching the same exported interface. Agy owns everything under `server/`; Claude owns `src/services/api.ts` and integration wiring. No overlapping files.

**Tech Stack:** Node.js 20+, Express, TypeScript, Prisma, PostgreSQL, Redis, bcrypt, uuid, multer, node-cron

**Spec:** User-provided spec in conversation (zero-trust ephemeral file transfer system with time-based expiry, download caps, passkey locks, automated cleanup, and AWS-ready architecture).

## Global Constraints

- Node.js ≥ 20, TypeScript strict mode
- All API routes prefixed with `/api/v1/`
- File storage: local disk at `server/uploads/` for dev; S3 pre-signed URLs reserved for future phase
- Passwords hashed with bcrypt (cost factor 12); never stored in plaintext
- Share tokens: UUIDv4, cryptographically random via `crypto.randomUUID()`
- Download counter: atomic decrement in Redis; fallback to DB if Redis unavailable
- Cleanup cron: every 5 minutes, deletes expired/exhausted files from disk and marks DB records
- Max upload size: 100 MB (enforced at Express middleware level)
- CORS: allow `http://localhost:5173` in dev only
- All timestamps: ISO 8601 UTC strings in API responses
- Frontend contract: the new `src/services/api.ts` must export `transferApi` with identical method signatures and return types as the current mock

## Review Focus

1. **Concurrent download race condition**: Two simultaneous downloads on a share with 1 remaining download should result in exactly one success and one rejection — test pins atomic decrement behavior in Task 4.
2. **Password timing oracle**: Password verification must not leak whether a share exists via response time differences — constant-time comparison tested in Task 5.
3. **File cleanup idempotency**: Running the cleanup job twice on the same expired share must not error or double-delete — tested in Task 6.
4. **Upload size boundary**: A 100 MB file succeeds; a 100 MB + 1 byte file is rejected before touching disk — tested in Task 3.
5. **SPA catch-all routing**: Navigating to `/vault/SEC-XXXX` directly (not via hash) must serve `index.html` so React Router handles it — tested in Task 8.

---

### Task 1: Project Scaffold & Database Schema

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/prisma/schema.prisma`
- Create: `server/.env.example`
- Create: `server/src/index.ts` (minimal Express server, health check only)
- Modify: `.gitignore` (add `server/uploads/`, `server/.env`)

**Interfaces:**
- Consumes: nothing (foundation task)
- Produces: Prisma client at `server/src/lib/prisma.ts`; Express app factory at `server/src/app.ts`; DB schema with `Share` and `ActivityLog` models

- [ ] **Step 1: Initialize server package**

Create `server/package.json` with dependencies: express, @prisma/client, prisma (dev), typescript (dev), tsx (dev), bcrypt, uuid, multer, node-cron, ioredis, dotenv, cors, helmet. Scripts: `dev` (tsx watch src/index.ts), `build` (tsc), `start` (node dist/index.js), `db:migrate` (prisma migrate dev), `db:seed` (tsx src/seed.ts).

- [ ] **Step 2: Write Prisma schema**

```prisma
model Share {
  id                String   @id @default(uuid())
  code              String   @unique
  filename          String
  fileSize          Int
  fileType          String
  storagePath       String?
  createdAt         DateTime @default(now())
  expiresAt         DateTime
  maxDownloads      Int
  downloadCount     Int      @default(0)
  passwordHash      String?
  encryptionLevel   String   @default("standard")
  status            String   @default("active") // active | expired | limit-reached | revoked
}

model ActivityLog {
  id         String   @id @default(uuid())
  timestamp  DateTime @default(now())
  action     String
  targetFile String
  ipAddress  String
  status     String   // success | warning | info
  details    String?
}
```

- [ ] **Step 3: Run migration**

Run: `cd server && npx prisma migrate dev --name init`
Expected: Migration applied, `prisma/generated` client created.

- [ ] **Step 4: Create minimal Express app with health check**

Create `server/src/app.ts` exporting an Express app factory. Add `GET /api/v1/health` returning `{ status: "ok" }`. Add cors, helmet, json parsing middleware. Create `server/src/index.ts` that calls the factory and listens on `PORT` env var (default 3001).

- [ ] **Step 5: Verify health endpoint**

Run: `cd server && npm run dev` then `curl http://localhost:3001/api/v1/health`
Expected: `{ "status": "ok" }`

- [ ] **Step 6: Commit**

```bash
git add server/ .gitignore
git commit -m "feat: scaffold backend with Prisma schema and Express health check

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: Share CRUD API Routes

**Files:**
- Create: `server/src/routes/shares.ts`
- Create: `server/src/lib/crypto.ts`
- Modify: `server/src/app.ts` (mount routes)

**Interfaces:**
- Consumes: Prisma client from Task 1
- Produces: `POST /api/v1/shares` (create metadata, returns ShareMetadata shape); `GET /api/v1/shares/:code` (get share metadata); `DELETE /api/v1/shares/:id` (revoke); `GET /api/v1/shares` (list all); `GET /api/v1/dashboard/stats`; `GET /api/v1/dashboard/logs`

- [ ] **Step 1: Write failing tests for share creation**

Create `server/tests/routes/shares.test.ts`. Test: POST with valid body returns 201 with ShareMetadata shape including generated `code` matching `SEC-XXXX-XXXX` pattern, correct `expiresAt` calculation, `downloadCount: 0`, `status: "active"`. Test: POST without required fields returns 400.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run tests/routes/shares.test.ts`
Expected: FAIL — routes not implemented.

- [ ] **Step 3: Implement crypto utility**

Create `server/src/lib/crypto.ts` exporting `generateShareCode(): string` using `crypto.randomUUID()` formatted as `SEC-XXXX-XXXX` (uppercase alphanumeric, no ambiguous chars I/O/0/1). Export `hashPassword(password: string): Promise<string>` using bcrypt with cost 12. Export `verifyPassword(attempt: string, hash: string): Promise<boolean>` using bcrypt.compare.

- [ ] **Step 4: Implement share routes**

Implement all six endpoints in `server/src/routes/shares.ts`. Mount at `/api/v1` in `app.ts`. Map Prisma rows to the `ShareMetadata` shape from `src/types/index.ts` (field names must match exactly: `code`, `filename`, `fileSize`, `fileType`, `createdAt`, `expiresAt`, `maxDownloads`, `downloadCount`, `isPasswordProtected`, `encryptionLevel`, `status`, `demoUrl`). Set `demoUrl` to `${BASE_URL}/vault/${code}`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/routes/shares.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/shares.ts server/src/lib/crypto.ts server/tests/
git commit -m "feat: implement share CRUD API routes with crypto utilities

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: File Upload Endpoint with Size Validation

**Files:**
- Create: `server/src/routes/upload.ts`
- Create: `server/src/lib/storage.ts`
- Modify: `server/src/app.ts` (mount upload route)

**Interfaces:**
- Consumes: Prisma client, Share model from Task 1
- Produces: `POST /api/v1/upload/:shareId` — accepts multipart file, stores to `server/uploads/<shareId>/<filename>`, updates Share.storagePath. Returns 200 on success, 413 if >100MB, 404 if share not found.

- [ ] **Step 1: Write failing test for upload size boundary**

Test: Upload a 100 MB buffer → 200. Upload a 100 MB + 1 byte buffer → 413 before file is written to disk (verify no file exists at expected path after rejection).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/routes/upload.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement storage utility**

Create `server/src/lib/storage.ts` exporting `saveFile(shareId: string, file: Express.Multer.File): string` (returns relative path) and `deleteFile(storagePath: string): void`. Use `fs.mkdirSync` with `recursive: true`. Base directory from `UPLOAD_DIR` env var, default `./uploads`.

- [ ] **Step 4: Implement upload route**

Configure multer with `limits: { fileSize: 100 * 1024 * 1024 }` and disk storage. On size violation, multer emits `LIMIT_FILE_SIZE` error — catch it and return 413. On success, update Share.storagePath via Prisma. Log activity.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/routes/upload.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/upload.ts server/src/lib/storage.ts server/tests/
git commit -m "feat: add file upload endpoint with 100MB size enforcement

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Download Endpoint with Atomic Counter

**Files:**
- Create: `server/src/routes/download.ts`
- Create: `server/src/lib/redis.ts`
- Modify: `server/src/app.ts` (mount download route)

**Interfaces:**
- Consumes: Prisma client, Redis client, storage utility from Task 3
- Produces: `POST /api/v1/download/:code` — body: `{ password?: string }`. Validates expiry, download limit (atomic), password. Returns `{ success, share?, error?, downloadUrl? }` matching the frontend's `verifyAndDownload` return shape. `downloadUrl` is a signed temporary URL or direct stream endpoint.

- [ ] **Step 1: Write failing test for concurrent download race**

Create two simultaneous POST requests to the same share with `maxDownloads: 1`. Assert exactly one returns `success: true` and the other returns `success: false` with limit-reached error. Total `downloadCount` in DB must be 1.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/routes/download.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Redis client**

Create `server/src/lib/redis.ts` exporting a singleton ioredis client. Gracefully handle connection failure (log warning, return null). Export `atomicDecrement(key: string, max: number): Promise<{ allowed: boolean; newCount: number }>` using Redis DECR + GET in a Lua script for atomicity. Fallback: Prisma transaction with `UPDATE ... WHERE downloadCount < maxDownloads RETURNING downloadCount`.

- [ ] **Step 4: Implement download route**

Validate share exists, not expired, not revoked. If password-protected, verify with `verifyPassword` from Task 2. Call `atomicDecrement`. If allowed, serve file via `res.download()` or return a temporary signed URL. Increment DB `downloadCount`. Log activity. If limit reached after this download, update status to `limit-reached`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run tests/routes/download.test.ts`
Expected: PASS (including concurrent race test)

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/download.ts server/src/lib/redis.ts server/tests/
git commit -m "feat: add download endpoint with atomic counter and race condition safety

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Password Verification with Constant-Time Comparison

**Files:**
- Modify: `server/src/lib/crypto.ts` (already has verifyPassword)
- Modify: `server/src/routes/download.ts` (use constant-time path)

**Interfaces:**
- Consumes: bcrypt from Task 2
- Produces: Password verification that does not leak share existence via timing

- [ ] **Step 1: Write timing oracle test**

Measure average response time for password verification against a share that exists vs. a share that doesn't exist. Both paths must take within 20% of each other. Use a dummy bcrypt.compare on a fixed hash when the share has no password or doesn't exist.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — non-existent share returns faster.

- [ ] **Step 3: Implement constant-time password path**

In download route: always run `bcrypt.compare` even when share doesn't exist or isn't password-protected. Compare against a pre-computed dummy hash. Only check the real result when the share actually requires a password.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/routes/download.test.ts -t "timing"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/crypto.ts server/src/routes/download.ts server/tests/
git commit -m "fix: constant-time password verification to prevent timing oracle

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Automated Cleanup Cron Job

**Files:**
- Create: `server/src/jobs/cleanup.ts`
- Modify: `server/src/index.ts` (start cron on boot)

**Interfaces:**
- Consumes: Prisma client, storage utility from Task 3
- Produces: Cron job running every 5 minutes that marks expired shares, deletes their files, logs activity

- [ ] **Step 1: Write idempotency test**

Create a share with `expiresAt` in the past. Run cleanup twice. Assert: first run marks status `expired` and deletes file. Second run finds no file to delete, no error thrown, no duplicate log entry.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Implement cleanup job**

Query shares where `expiresAt < now() AND status = 'active'` OR `downloadCount >= maxDownloads AND status = 'active'`. For each: delete file via storage utility (catch ENOENT silently), update status, create activity log. Wrap in try/catch per share so one failure doesn't block others.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/jobs/cleanup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/jobs/cleanup.ts server/src/index.ts server/tests/
git commit -m "feat: add automated cleanup cron for expired and exhausted shares

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: Replace Frontend Mock API with Fetch-Based Client

**Files:**
- Modify: `src/services/api.ts` (full rewrite)

**Interfaces:**
- Consumes: Backend API from Tasks 2-4
- Produces: Same exported `transferApi` object with identical method signatures: `getAllShares()`, `getShareByCode(code)`, `createTransfer(fileInfo, settings)`, `verifyAndDownload(code, password?)`, `revokeShare(id)`, `getDashboardStats()`, `getActivityLogs()`

- [ ] **Step 1: Write integration test against running backend**

Create `src/services/__tests__/api.integration.test.ts`. Start backend, call each method, assert return shapes match existing types. This test is optional/manual — document how to run it.

- [ ] **Step 2: Rewrite api.ts**

Replace the entire `TransferService` class with fetch calls to `http://localhost:3001/api/v1/*`. Keep the exact same exported name `transferApi` and identical method signatures. Map API responses to existing types. Handle errors by returning the same error shapes the mock used. Remove all mock data and in-memory store.

- [ ] **Step 3: Verify frontend still compiles**

Run: `npm run build`
Expected: No type errors. All three consumer components (`UploadWorkspace`, `DownloadPage`, `SecurityDashboard`) compile without changes.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: replace mock transferApi with fetch-based backend client

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Serve Static Frontend & SPA Catch-All

**Files:**
- Modify: `server/src/app.ts` (add static serving + catch-all)

**Interfaces:**
- Consumes: Vite build output at `dist/` (from `npm run build` in root)
- Produces: Express serves static files from `../dist` and falls back to `index.html` for any non-API route

- [ ] **Step 1: Write SPA catch-all test**

Request `GET /vault/SEC-TEST-CODE` (no `/api` prefix). Assert response is 200 with `Content-Type: text/html` containing `<div id="root">`. Request `GET /assets/index-abc123.js`. Assert 200 with correct MIME type. Request `GET /api/v1/nonexistent`. Assert 404 JSON, not HTML.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL

- [ ] **Step 3: Add static middleware and catch-all**

After all `/api/v1/*` routes, add `express.static(path.join(__dirname, '../../dist'))`. Then add catch-all: any GET request not starting with `/api` serves `dist/index.html`. Ensure API 404s are handled before the catch-all.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/routes/static.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/app.ts server/tests/
git commit -m "feat: serve Vite build and SPA catch-all for client-side routing

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Agent Work Division Summary

| Agent | Owns | Does NOT Touch |
|-------|------|----------------|
| **Agy** | `server/**` (all tasks 1-6, 8) | `src/**` |
| **Claude** | `src/services/api.ts` (task 7) | `server/**` |
| **Shared contract** | `src/types/index.ts` (read-only reference for API shape) | Neither agent modifies types |

**Parallel execution:** Tasks 1-6 can proceed independently of Task 7. Agy builds the full backend while Claude waits. Once Agy's Task 2 is complete (API routes exist), Claude can start Task 7 against the running server. Task 8 is Agy's final step after the frontend build exists.

</content>