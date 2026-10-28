import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  FileCheck,
  CheckCircle,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { AnimatedButton } from '../ui/AnimatedButton.tsx';
import { transferApi } from '../../services/api.ts';
import { scaleFade } from '../../utils/animations.ts';
import type { ShareMetadata } from '../../types/index.ts';

interface DownloadPageProps {
  initialCode?: string;
  onNavigateToUpload: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({
  initialCode = 'SEC-8942-ALPHA',
  onNavigateToUpload,
}) => {
  const [shareCode, setShareCode] = useState<string>(initialCode);
  const [currentShare, setCurrentShare] = useState<ShareMetadata | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Decryption & Download state
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptStage, setDecryptStage] = useState<string>('');
  const [decryptProgress, setDecryptProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [lastDownloadedUrl, setLastDownloadedUrl] = useState<string | null>(null);

  // Demo sample shares for quick testing
  const demoSamples = [
    { code: 'SEC-8942-ALPHA', label: 'Password Protected (audit_report)' },
    { code: 'SEC-7319-BETA', label: '1-Download Limit (backup)' },
    { code: 'SEC-1093-GAMMA', label: 'Expired Link (design_specs)' },
    { code: 'SEC-5521-DELTA', label: 'Limit-Reached Link (nda)' },
    { code: 'SEC-INVALID-999', label: 'Invalid / Tampered Link' },
  ];

  // Fetch share by code
  const loadShare = async (code: string) => {
    setIsLoadingShare(true);
    setErrorMessage(null);
    setDownloadSuccess(false);
    setPasswordInput('');
    setLastDownloadedUrl(null);

    try {
      const share = await transferApi.getShareByCode(code);
      setCurrentShare(share);
      setCurrentTime(Date.now());
    } catch {
      setCurrentShare(null);
      setErrorMessage('Could not load transfer metadata.');
    } finally {
      setIsLoadingShare(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setShareCode(initialCode);
      loadShare(initialCode);
    }
  }, [initialCode]);

  const handleSelectSample = (code: string) => {
    setShareCode(code);
    loadShare(code);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsDecrypting(true);
    setDecryptProgress(0);

    // Multistep decryption simulation
    const stages = [
      { progress: 20, label: 'Connecting to ephemeral peer buffer...' },
      { progress: 50, label: 'Validating SHA-256 integrity checksum...' },
      { progress: 80, label: 'Running client-side AES-GCM-256 decryption...' },
      { progress: 100, label: 'Payload decrypted into local memory.' },
    ];

    for (let i = 0; i < stages.length; i++) {
      setDecryptStage(stages[i].label);
      setDecryptProgress(stages[i].progress);
      await new Promise((res) => setTimeout(res, 350));
    }

    const result = await transferApi.verifyAndDownload(shareCode, passwordInput);

    setIsDecrypting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to decrypt file.');
      return;
    }

    if (result.share) {
      setCurrentShare(result.share);
      setCurrentTime(Date.now());
    }

    if (result.mockBlobUrl) {
      setLastDownloadedUrl(result.mockBlobUrl);
      setDownloadSuccess(true);

      // Trigger standard browser download for demo file
      const anchor = document.createElement('a');
      anchor.href = result.mockBlobUrl;
      anchor.download = `decrypted_${result.share?.filename || 'secure_file.txt'}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Determine state of current link using currentTime
  const isExpired = currentShare
    ? currentShare.status === 'expired' || new Date(currentShare.expiresAt).getTime() < currentTime
    : false;
  const isLimitReached = currentShare
    ? currentShare.status === 'limit-reached' || currentShare.downloadCount >= currentShare.maxDownloads
    : false;
  const isInvalid = !isLoadingShare && !currentShare;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Test Controls Bar */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-navy-950/70 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-mono font-medium text-cyan-400 flex items-center gap-1.5 uppercase">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Interactive State Tester</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Switch between mock states or enter a custom share code
          </span>
        </div>

        {/* Demo buttons */}
        <div className="flex flex-wrap gap-2">
          {demoSamples.map((sample) => (
            <button
              key={sample.code}
              type="button"
              onClick={() => handleSelectSample(sample.code)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-mono transition-all cursor-pointer border ${
                shareCode === sample.code
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'border-slate-800 bg-navy-900/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Custom Code Input */}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Paste share token code (e.g., SEC-8942-ALPHA)"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-navy-900/90 pl-9 pr-3 py-1.5 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <AnimatedButton
            size="sm"
            variant="outline"
            onClick={() => loadShare(shareCode)}
          >
            Load
          </AnimatedButton>
        </div>
      </div>

      {/* Main Download Card */}
      <div className="rounded-3xl border border-cyan-500/20 bg-navy-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        {isLoadingShare ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4" />
            <span className="text-xs font-mono text-cyan-300">
              Querying Ephemeral Cipher Directory...
            </span>
          </div>
        ) : isInvalid ? (
          /* Invalid / Tampered State */
          <motion.div
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)] mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Invalid or Tampered Share Link</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              This token (<span className="font-mono text-rose-300">{shareCode}</span>) does not exist,
              has already self-destructed, or contains an invalid verification hash.
            </p>
            <AnimatedButton
              variant="outline"
              onClick={onNavigateToUpload}
            >
              Create New Transfer
            </AnimatedButton>
          </motion.div>
        ) : isExpired ? (
          /* Expired State */
          <motion.div
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Transfer Link Has Expired</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              The time-to-live period for <span className="font-semibold text-slate-200">{currentShare?.filename}</span> has lapsed. In compliance with Zero-Trust protocols, the in-memory keys and payload fragments have been shredded.
            </p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs font-mono text-amber-300 mb-6">
              EXPIRED AT: {new Date(currentShare!.expiresAt).toLocaleString()}
            </div>
            <AnimatedButton
              variant="outline"
              onClick={onNavigateToUpload}
            >
              Upload New File
            </AnimatedButton>
          </motion.div>
        ) : isLimitReached ? (
          /* Download Limit Reached State */
          <motion.div
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)] mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Download Limit Reached</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              This transfer had a maximum quota of{' '}
              <span className="font-bold text-slate-200">{currentShare?.maxDownloads} download(s)</span>.
              The limit has been reached and the payload was automatically purged (Burn-After-Read).
            </p>
            <AnimatedButton
              variant="outline"
              onClick={onNavigateToUpload}
            >
              Start New Transfer
            </AnimatedButton>
          </motion.div>
        ) : (
          /* Normal / Active Download State */
          <motion.div
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Confidential File Ready</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    TOKEN: <span className="text-cyan-300 font-semibold">{currentShare?.code}</span>
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-300">
                ACTIVE
              </span>
            </div>

            {/* Cryptographic Sentinel Telemetry Visual Banner */}
            <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-cyan-500/25 bg-black/60 shadow-lg">
              <img
                src="/videos/cyber-generation.gif"
                alt="Cryptographic verification in progress"
                className="w-full h-full object-cover object-center opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-3 flex items-center gap-2 text-[10px] font-mono text-cyan-300 bg-black/75 px-2.5 py-1 rounded-md border border-cyan-500/30 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>CIPHER SENTINEL VERIFICATION ONLINE</span>
              </div>
            </div>

            {/* File info card */}
            <div className="rounded-2xl border border-slate-800 bg-navy-950/70 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 border border-cyan-500/20 text-cyan-400">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-slate-100">
                    {currentShare?.filename}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {formatFileSize(currentShare?.fileSize || 0)} &bull; {currentShare?.fileType}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                <div className="text-slate-400">
                  Downloads Remaining:{' '}
                  <span className="font-bold text-cyan-300">
                    {(currentShare?.maxDownloads || 1) - (currentShare?.downloadCount || 0)}
                  </span>
                </div>
                <div className="text-right text-slate-400">
                  Encryption:{' '}
                  <span className="text-violet-300 uppercase">
                    {currentShare?.encryptionLevel} AES-GCM
                  </span>
                </div>
              </div>
            </div>

            {/* Decryption Form */}
            <form onSubmit={handleDownload} className="space-y-4">
              {currentShare?.isPasswordProtected && (
                <div className="space-y-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-medium text-amber-300 flex items-center gap-1.5 uppercase">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Decryption Password Required</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      (Demo hint: <code className="text-cyan-300">{currentShare.password || 'secure2026!'}</code>)
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter decryption password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-navy-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Decrypting Progress */}
              {isDecrypting && (
                <div className="space-y-2 rounded-2xl border border-cyan-500/30 bg-navy-950 p-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                      {decryptStage}
                    </span>
                    <span className="text-cyan-400 font-bold">{decryptProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-900">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${decryptProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {downloadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Decryption Successful & File Delivered!</span>
                  </div>
                  <p className="text-xs text-emerald-300/80">
                    The simulated plaintext file has been assembled and saved to your device. In-memory decryption buffers were wiped immediately.
                  </p>
                  {lastDownloadedUrl && (
                    <a
                      href={lastDownloadedUrl}
                      download={`decrypted_${currentShare?.filename || 'file.txt'}`}
                      className="inline-flex items-center gap-1 text-xs font-mono text-cyan-300 hover:underline pt-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Re-trigger demo file download
                    </a>
                  )}
                </motion.div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <AnimatedButton
                  type="submit"
                  size="lg"
                  variant="primary"
                  className="w-full"
                  isLoading={isDecrypting}
                  leftIcon={<Download className="h-5 w-5" />}
                >
                  {isDecrypting ? 'Decrypting In-Memory...' : 'Decrypt & Download Payload'}
                </AnimatedButton>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};
