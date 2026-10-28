import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Search,
  Clock,
  Download,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Activity,
  Layers,
  FileText,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { SecurityScene } from '../3d/SecurityScene.tsx';
import { Sidebar } from './Sidebar.tsx';
import { transferApi } from '../../services/api.ts';
import { fadeInUp, staggerContainer, cardHover } from '../../utils/animations.ts';
import type {
  ActiveTab,
  ActivityLogItem,
  DashboardStatsData,
  ShareMetadata,
  ShareStatus,
} from '../../types/index.ts';

interface SecurityDashboardProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenDownload: (code: string) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  activeTab,
  onTabChange,
  onOpenDownload,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [shares, setShares] = useState<ShareMetadata[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState<DashboardStatsData>({
    activeShares: 0,
    totalDownloads: 0,
    expiringSoon: 0,
    passwordProtected: 0,
  });

  // Table filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShareStatus>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());
  const [shieldViewMode, setShieldViewMode] = useState<'stream' | '3d'>('stream');

  // Load and subscribe to data changes
  const refreshData = async () => {
    const [fetchedShares, fetchedStats, fetchedLogs] = await Promise.all([
      transferApi.getAllShares(),
      transferApi.getDashboardStats(),
      transferApi.getActivityLogs(),
    ]);
    setShares(fetchedShares);
    setStats(fetchedStats);
    setLogs(fetchedLogs);
    setNowTimestamp(Date.now());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = transferApi.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRevoke = async (id: string) => {
    if (confirm('Revoke this transfer? It will be marked as revoked and prevented from further downloads.')) {
      await transferApi.revokeShare(id);
      refreshData();
    }
  };

  // Filtered shares
  const filteredShares = useMemo(() => {
    return shares.filter((share) => {
      const matchesSearch =
        share.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return share.status === statusFilter;
    });
  }, [shares, searchQuery, statusFilter]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-black/40">
      {/* Background Security Shield Visual */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/videos/security-shield.gif"
          alt="Security Shield Floating in Digital Space"
          className="w-full h-full object-cover object-center opacity-70 mix-blend-screen transform scale-100 transition-opacity duration-700"
        />
        {/* Subtle edge vignette so the center floating shield is bright and sharp */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(5,13,26,0.5)_70%,_#050d1a_100%)] pointer-events-none" />
      </div>

      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeSharesCount={stats.activeShares}
      />

      {/* Main Dashboard Canvas */}
      <main className="relative z-10 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-medium tracking-wider text-cyan-400 uppercase">
                Zero-Trust Telemetry & Audit
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Security Governance Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Real-time in-memory ephemeral links, automatic shredder telemetry, and recipient access logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-violet-500/30 bg-violet-950/20 px-3 py-1 text-xs font-mono text-violet-300">
              MOCK ANALYTICS (SAAS READY)
            </span>
          </div>
        </div>

        {/* Top 4 KPI Metrics Row */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1 */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="rounded-2xl border border-cyan-500/20 bg-navy-900/60 p-5 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-mono font-medium uppercase tracking-wider">Active Shares</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              {stats.activeShares}
            </div>
            <div className="mt-2 text-[11px] text-cyan-300 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Live in ephemeral memory
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="rounded-2xl border border-violet-500/20 bg-navy-900/60 p-5 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-mono font-medium uppercase tracking-wider">Total Downloads</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Download className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              {stats.totalDownloads}
            </div>
            <div className="mt-2 text-[11px] text-violet-300">
              Verified recipient handshakes
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="rounded-2xl border border-amber-500/20 bg-navy-900/60 p-5 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-mono font-medium uppercase tracking-wider">Expiring Soon</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-amber-300">
              {stats.expiringSoon}
            </div>
            <div className="mt-2 text-[11px] text-amber-200/80">
              &lt; 2 hours to automatic shredding
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="rounded-2xl border border-cyan-500/20 bg-navy-900/60 p-5 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-mono font-medium uppercase tracking-wider">Password Protected</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              {stats.passwordProtected}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Argon2id client derivation required
            </div>
          </motion.div>
        </motion.div>

        {/* Mid Row: 3D Security Core Telemetry Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Shield Compact Visualization Card */}
          <div className="lg:col-span-5 rounded-2xl border border-cyan-500/20 bg-navy-900/60 p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
                  Zero-Trust Shield Core
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-navy-950 p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setShieldViewMode('stream')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    shieldViewMode === 'stream'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Shield Stream
                </button>
                <button
                  type="button"
                  onClick={() => setShieldViewMode('3d')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    shieldViewMode === '3d'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3D Orbitals
                </button>
              </div>
            </div>

            {/* Embedded Display (Stream or 3D) */}
            <div className="relative my-2 h-48 w-full flex items-center justify-center overflow-hidden rounded-xl border border-cyan-500/25 bg-black/60 shadow-inner">
              {shieldViewMode === 'stream' ? (
                <>
                  <img
                    src="/videos/security-shield.gif"
                    alt="Digital Floating Security Shield Telemetry"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2.5 flex items-center gap-2 text-[10px] font-mono text-cyan-300 bg-black/75 px-2.5 py-1 rounded-md border border-cyan-500/30 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>DIGITAL SHIELD TELEMETRY ACTIVE</span>
                  </div>
                </>
              ) : (
                <SecurityScene compact className="h-full w-full" />
              )}
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Memory Encryption</span>
                <span className="text-cyan-300 font-bold">AES-256 GCM</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Disk Persistence</span>
                <span className="text-emerald-400 font-bold">0 BYTES (EPHEMERAL)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Key Derivation</span>
                <span className="text-violet-300">Argon2id (Client-side)</span>
              </div>
            </div>
          </div>

          {/* Activity Log Feed */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-navy-900/60 p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200 uppercase">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Recent Audit Activity Feed</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Tamper-evident logs</span>
            </div>

            <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-navy-950/60 p-2.5 text-xs transition-colors hover:border-cyan-500/30"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      log.status === 'success'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        : log.status === 'warning'
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 truncate">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                    </div>
                    <div className="truncate text-slate-400 text-[11px]">
                      Target: <span className="font-mono text-cyan-300">{log.targetFile}</span> &bull; {log.ipAddress}
                    </div>
                    {log.details && (
                      <div className="text-[10px] text-slate-500 mt-0.5">{log.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Automatic audit log retention: 24 hours</span>
              <span className="text-cyan-400 font-mono">ENCRYPTED TELEMETRY</span>
            </div>
          </div>
        </div>

        {/* Shared Files Table Section */}
        <div className="rounded-2xl border border-slate-800 bg-navy-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
          {/* Controls bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Active Ephemeral Shares
              </h2>
              <p className="text-xs text-slate-400">
                Manage, audit, or immediately revoke live transfer tokens.
              </p>
            </div>

            {/* Search & Filter pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-navy-950/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center rounded-xl border border-slate-800 bg-navy-950/80 p-1">
                {(['all', 'active', 'expired', 'limit-reached'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono capitalize transition-colors cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'limit-reached' ? 'Limit Reached' : filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-navy-950/40 text-slate-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">File Name & Token</th>
                  <th className="py-3 px-4">Size & Cipher</th>
                  <th className="py-3 px-4">Expires In</th>
                  <th className="py-3 px-4">Downloads</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredShares.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-6 w-6 text-slate-600" />
                        <span>No files matching current search or status filter.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShares.map((share) => {
                    const isExp =
                      share.status === 'expired' ||
                      new Date(share.expiresAt).getTime() < nowTimestamp;
                    const isLimit =
                      share.status === 'limit-reached' ||
                      share.downloadCount >= share.maxDownloads;
                    const isRev = share.status === 'revoked';

                    return (
                      <tr
                        key={share.id}
                        className="transition-colors hover:bg-navy-800/30 font-sans"
                      >
                        {/* Filename & Token */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 text-cyan-400 border border-cyan-500/20 shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-200 max-w-[220px]">
                                {share.filename}
                              </div>
                              <div className="font-mono text-[10px] text-cyan-400 flex items-center gap-1.5">
                                <span>{share.code}</span>
                                {share.isPasswordProtected && (
                                  <span title="Password protected">
                                    <Lock className="h-3 w-3 text-amber-400" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Size & Cipher */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <div>{formatFileSize(share.fileSize)}</div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            {share.encryptionLevel}
                          </div>
                        </td>

                        {/* Expiry */}
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={
                              isExp
                                ? 'text-slate-500 line-through'
                                : 'text-slate-300'
                            }
                          >
                            {new Date(share.expiresAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {new Date(share.expiresAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Downloads */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <span className="font-bold text-cyan-300">
                            {share.downloadCount}
                          </span>{' '}
                          / {share.maxDownloads === 999 ? '∞' : share.maxDownloads}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {isRev ? (
                            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                              REVOKED
                            </span>
                          ) : isExp ? (
                            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                              EXPIRED
                            </span>
                          ) : isLimit ? (
                            <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                              LIMIT REACHED
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                              ACTIVE
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Copy demo link */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(share.demoUrl, share.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-navy-800 transition-colors cursor-pointer"
                              title="Copy Demo Share Link"
                            >
                              {copiedId === share.id ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>

                            {/* View in download portal */}
                            <button
                              type="button"
                              onClick={() => onOpenDownload(share.code)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-navy-800 transition-colors cursor-pointer"
                              title="Test Recipient Download"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>

                            {/* Revoke share */}
                            {!isExp && !isLimit && !isRev && (
                              <button
                                type="button"
                                onClick={() => handleRevoke(share.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Revoke Transfer Immediately"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
