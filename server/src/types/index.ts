export type ShareStatus = 'active' | 'expired' | 'limit-reached' | 'revoked';

export interface ShareMetadata {
  id: string;
  code: string;
  filename: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  isPasswordProtected: boolean;
  password?: string;
  encryptionLevel: 'standard' | 'military';
  status: ShareStatus;
  demoUrl: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  action: string;
  targetFile: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'info';
  details?: string;
}

export interface DashboardStatsData {
  activeShares: number;
  totalDownloads: number;
  expiringSoon: number;
  passwordProtected: number;
}
