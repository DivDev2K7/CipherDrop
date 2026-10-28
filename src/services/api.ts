import type {
  ActivityLogItem,
  DashboardStatsData,
  ShareMetadata,
  ShareStatus,
  TransferSettings,
} from '../types/index.ts';

// Initial mock data simulating zero-trust ephemeral transfers
const INITIAL_SHARES: ShareMetadata[] = [
  {
    id: 'share-1',
    code: 'SEC-8942-ALPHA',
    filename: 'quarterly_audit_report_2026.enc.pdf',
    fileSize: 4823449, // ~4.6 MB
    fileType: 'application/pdf',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(), // in 23 hours
    maxDownloads: 5,
    downloadCount: 2,
    isPasswordProtected: true,
    password: 'secure2026!',
    encryptionLevel: 'military',
    status: 'active',
    demoUrl: 'https://demo.zerovault.io/share/SEC-8942-ALPHA',
  },
  {
    id: 'share-2',
    code: 'SEC-7319-BETA',
    filename: 'infrastructure_keys_backup.tar.gz',
    fileSize: 12582912, // 12 MB
    fileType: 'application/gzip',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 40).toISOString(), // in 40 mins (expiring soon)
    maxDownloads: 1,
    downloadCount: 0,
    isPasswordProtected: true,
    password: 'vault-key-99',
    encryptionLevel: 'military',
    status: 'active',
    demoUrl: 'https://demo.zerovault.io/share/SEC-7319-BETA',
  },
  {
    id: 'share-3',
    code: 'SEC-1093-GAMMA',
    filename: 'design_specs_v3_confidential.fig',
    fileSize: 25482810, // ~24.3 MB
    fileType: 'application/octet-stream',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // expired 1 hour ago
    maxDownloads: 10,
    downloadCount: 8,
    isPasswordProtected: false,
    encryptionLevel: 'standard',
    status: 'expired',
    demoUrl: 'https://demo.zerovault.io/share/SEC-1093-GAMMA',
  },
  {
    id: 'share-4',
    code: 'SEC-5521-DELTA',
    filename: 'client_nda_countersigned.docx',
    fileSize: 1845200, // 1.8 MB
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    maxDownloads: 1,
    downloadCount: 1,
    isPasswordProtected: false,
    encryptionLevel: 'standard',
    status: 'limit-reached',
    demoUrl: 'https://demo.zerovault.io/share/SEC-5521-DELTA',
  },
];

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2 mins ago',
    action: 'Download Completed',
    targetFile: 'quarterly_audit_report_2026.enc.pdf',
    ipAddress: '198.51.100.42 (Authorized)',
    status: 'success',
    details: 'Hash verification passed, memory wiped after buffer read',
  },
  {
    id: 'log-2',
    timestamp: '14 mins ago',
    action: 'Password Verification Success',
    targetFile: 'quarterly_audit_report_2026.enc.pdf',
    ipAddress: '198.51.100.42 (Authorized)',
    status: 'info',
    details: 'Argon2id key derivation completed client-side',
  },
  {
    id: 'log-3',
    timestamp: '38 mins ago',
    action: 'Share Expired & Shredded',
    targetFile: 'design_specs_v3_confidential.fig',
    ipAddress: 'Internal Automated Shredder',
    status: 'warning',
    details: 'Time-to-live expired. Metadata and chunks marked for overwrite.',
  },
  {
    id: 'log-4',
    timestamp: '1 hour ago',
    action: 'Download Limit Reached',
    targetFile: 'client_nda_countersigned.docx',
    ipAddress: '203.0.113.19',
    status: 'warning',
    details: 'Burn-after-reading triggered. Share deactivated.',
  },
  {
    id: 'log-5',
    timestamp: '2 hours ago',
    action: 'Transfer Initialized',
    targetFile: 'infrastructure_keys_backup.tar.gz',
    ipAddress: '192.0.2.88 (Secure Local Client)',
    status: 'success',
    details: 'Client-side AES-GCM-256 payload generated',
  },
];

// Reactive in-memory store
class TransferService {
  private shares: ShareMetadata[] = [...INITIAL_SHARES];
  private logs: ActivityLogItem[] = [...INITIAL_LOGS];
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Simulated latency
  private delay(ms = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate random demo share code
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rand = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SEC-${rand(4)}-${rand(4)}`;
  }

  public async getAllShares(): Promise<ShareMetadata[]> {
    await this.delay(200);
    return [...this.shares];
  }

  public async getShareByCode(code: string): Promise<ShareMetadata | null> {
    await this.delay(300);
    const found = this.shares.find(
      (s) => s.code.toLowerCase() === code.trim().toLowerCase()
    );
    return found ? { ...found } : null;
  }

  public async createTransfer(
    fileInfo: { name: string; size: number; type: string },
    settings: TransferSettings
  ): Promise<ShareMetadata> {
    await this.delay(800);

    const code = this.generateCode();
    const expiryDate = new Date(Date.now() + settings.expiryHours * 60 * 60 * 1000);

    const newShare: ShareMetadata = {
      id: `share-${Date.now()}`,
      code,
      filename: fileInfo.name,
      fileSize: fileInfo.size,
      fileType: fileInfo.type || 'application/octet-stream',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      maxDownloads: settings.maxDownloads,
      downloadCount: 0,
      isPasswordProtected: settings.requirePassword,
      password: settings.requirePassword ? settings.password : undefined,
      encryptionLevel: settings.encryptionLevel,
      status: 'active',
      demoUrl: `https://demo.zerovault.io/share/${code}`,
    };

    this.shares.unshift(newShare);

    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      action: 'Share Created (Demo)',
      targetFile: fileInfo.name,
      ipAddress: '127.0.0.1 (Local Simulation)',
      status: 'success',
      details: `Expires in ${settings.expiryHours}h. Max downloads: ${settings.maxDownloads}. Protected: ${settings.requirePassword ? 'Yes' : 'No'}`,
    };

    this.logs.unshift(newLog);
    this.notify();
    return newShare;
  }

  public async verifyAndDownload(
    code: string,
    passwordAttempt?: string
  ): Promise<{
    success: boolean;
    error?: string;
    share?: ShareMetadata;
    mockBlobUrl?: string;
  }> {
    await this.delay(700);

    const shareIndex = this.shares.findIndex(
      (s) => s.code.toLowerCase() === code.trim().toLowerCase()
    );

    if (shareIndex === -1) {
      return { success: false, error: 'Share link not found or invalid token.' };
    }

    const share = this.shares[shareIndex];

    // Check expiration
    if (new Date(share.expiresAt).getTime() < Date.now() || share.status === 'expired') {
      return { success: false, error: 'This secure transfer has expired and the payload has been shredded.' };
    }

    // Check download count limit
    if (share.status === 'limit-reached' || share.downloadCount >= share.maxDownloads) {
      return { success: false, error: 'Maximum download limit reached for this ephemeral link.' };
    }

    // Check password if required
    if (share.isPasswordProtected) {
      if (!passwordAttempt) {
        return { success: false, error: 'Password required to unlock this transfer.' };
      }
      if (passwordAttempt !== share.password) {
        return { success: false, error: 'Incorrect decryption password. Access denied.' };
      }
    }

    // Success: increment download count
    const updatedDownloads = share.downloadCount + 1;
    let newStatus: ShareStatus = share.status;
    if (updatedDownloads >= share.maxDownloads) {
      newStatus = 'limit-reached';
    }

    this.shares[shareIndex] = {
      ...share,
      downloadCount: updatedDownloads,
      status: newStatus,
    };

    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      action: 'File Downloaded (Demo)',
      targetFile: share.filename,
      ipAddress: 'Recipient Client (Demo)',
      status: 'success',
      details: `Download ${updatedDownloads}/${share.maxDownloads} processed successfully.`,
    });

    this.notify();

    // Create a harmless demo text blob
    const demoPayload = `--- ZERO-TRUST DEMO DECRYPTED PAYLOAD ---
File: ${share.filename}
Original Size: ${(share.fileSize / 1024).toFixed(1)} KB
Share Code: ${share.code}
Decrypted Timestamp: ${new Date().toISOString()}
Integrity: VERIFIED (Client-side simulation)
----------------------------------------`;
    const blob = new Blob([demoPayload], { type: 'text/plain' });
    const mockBlobUrl = URL.createObjectURL(blob);

    return {
      success: true,
      share: this.shares[shareIndex],
      mockBlobUrl,
    };
  }

  public async revokeShare(id: string): Promise<boolean> {
    await this.delay(300);
    const index = this.shares.findIndex((s) => s.id === id);
    if (index !== -1) {
      const revoked = this.shares[index];
      this.shares[index] = { ...revoked, status: 'revoked' };
      this.logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        action: 'Manual Revocation',
        targetFile: revoked.filename,
        ipAddress: 'Dashboard Admin',
        status: 'warning',
        details: 'Revoked manually by owner prior to expiration.',
      });
      this.notify();
      return true;
    }
    return false;
  }

  public async getDashboardStats(): Promise<DashboardStatsData> {
    await this.delay(200);
    const now = Date.now();
    const active = this.shares.filter(
      (s) => s.status === 'active' && new Date(s.expiresAt).getTime() > now
    );
    const totalDownloads = this.shares.reduce((acc, s) => acc + s.downloadCount, 0);
    const expiringSoon = active.filter(
      (s) => new Date(s.expiresAt).getTime() - now < 1000 * 60 * 60 * 2 // < 2 hours
    ).length;
    const passwordProtected = active.filter((s) => s.isPasswordProtected).length;

    return {
      activeShares: active.length,
      totalDownloads,
      expiringSoon,
      passwordProtected,
    };
  }

  public async getActivityLogs(): Promise<ActivityLogItem[]> {
    await this.delay(200);
    return [...this.logs];
  }
}

export const transferApi = new TransferService();
