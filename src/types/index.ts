export interface TransferFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'encrypting' | 'uploading' | 'ready' | 'expired';
  progress: number;
  shareCode?: string;
  expiresAt?: Date;
  downloadCount?: number;
  maxDownloads?: number;
}

export interface TransferSettings {
  expiryHours: number;
  maxDownloads: number;
  requirePassword: boolean;
  password?: string;
  encryptionLevel: 'standard' | 'military';
  burnAfterRead: boolean;
}

export type FeatureId = 'e2e' | 'zerotrust' | 'ephemeral' | 'audit';

export interface Feature {
  id: FeatureId;
  title: string;
  description: string;
  icon: string;
  color: 'cyan' | 'violet';
}

export interface Stat {
  label: string;
  value: string;
  suffix?: string;
}

export type TransferStep = 'upload' | 'configure' | 'share' | 'receive';

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

export type ActiveTab = 'upload' | 'dashboard' | 'download' | 'features';
