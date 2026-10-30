import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr) {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

describe('CipherDrop Backend API Integration', () => {
  it('GET /api/v1/health returns status ok', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: 'ok' });
  });

  it('POST /api/v1/shares creates share metadata and activity log', async () => {
    const res = await fetch(`${baseUrl}/api/v1/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'report.pdf',
        fileSize: 4096,
        fileType: 'application/pdf',
        expiryHours: 12,
        maxDownloads: 2,
        requirePassword: true,
        password: 'secure-vault-pass',
        encryptionLevel: 'military',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.code).toMatch(/^SEC-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(data.filename).toBe('report.pdf');
    expect(data.isPasswordProtected).toBe(true);
    expect(data.encryptionLevel).toBe('military');
    expect(data.status).toBe('active');
  });

  it('GET /api/v1/dashboard/stats returns statistics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/stats`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.activeShares).toBe('number');
    expect(typeof data.totalDownloads).toBe('number');
    expect(typeof data.expiringSoon).toBe('number');
    expect(typeof data.passwordProtected).toBe('number');
  });

  it('Enforces password and max download constraints on /api/v1/download/:code', async () => {
    // 1. Create a 1-download protected share
    const createRes = await fetch(`${baseUrl}/api/v1/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'restricted.txt',
        fileSize: 100,
        expiryHours: 24,
        maxDownloads: 1,
        requirePassword: true,
        password: 'valid-password',
      }),
    });
    const share = await createRes.json();

    // 2. Reject request without password
    const noPassRes = await fetch(`${baseUrl}/api/v1/download/${share.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(noPassRes.status).toBe(403);

    // 3. Reject wrong password
    const wrongPassRes = await fetch(`${baseUrl}/api/v1/download/${share.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });
    expect(wrongPassRes.status).toBe(403);

    // 4. Accept correct password
    const correctRes = await fetch(`${baseUrl}/api/v1/download/${share.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'valid-password' }),
    });
    expect(correctRes.status).toBe(200);
    const successData = await correctRes.json();
    expect(successData.success).toBe(true);

    // 5. Reject next download (limit reached)
    const limitRes = await fetch(`${baseUrl}/api/v1/download/${share.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'valid-password' }),
    });
    expect(limitRes.status).toBe(403);
  });
});
