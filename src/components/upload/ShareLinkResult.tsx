import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  Clock,
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AnimatedButton } from '../ui/AnimatedButton.tsx';
import { scaleFade } from '../../utils/animations.ts';
import type { ShareMetadata } from '../../types/index.ts';

interface ShareLinkResultProps {
  share: ShareMetadata;
  onCreateAnother: () => void;
  onOpenDownload: (code: string) => void;
}

export const ShareLinkResult: React.FC<ShareLinkResultProps> = ({
  share,
  onCreateAnother,
  onOpenDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate live countdown to expiry
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const expiry = new Date(share.expiresAt).getTime();
      const diff = Math.max(0, expiry - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [share.expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(share.demoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      variants={scaleFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative w-full rounded-2xl border border-cyan-500/30 bg-navy-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_50px_rgba(0,0,0,0.5)]"
    >
      {/* Top Cyber Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Secure Ephemeral Link Ready
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              TOKEN: <span className="text-cyan-300 font-semibold">{share.code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-300">
            DEMONSTRATION LINK
          </span>
        </div>
      </div>

      {/* Main Grid: Details + QR Code */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Side: URL & Info */}
        <div className="md:col-span-8 space-y-5">
          {/* File summary pill */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-navy-950/60 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-cyan-400 border border-cyan-500/20">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-200">
                {share.filename}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {formatFileSize(share.fileSize)} &bull; {share.encryptionLevel === 'military' ? 'Military AES-256 GCM' : 'Standard AES-256'}
              </div>
            </div>
          </div>

          {/* Share URL Box */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1.5 uppercase">
              Demonstration Share URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={share.demoUrl}
                className="w-full rounded-xl border border-slate-700 bg-navy-950/90 px-4 py-2.5 text-xs sm:text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 selection:bg-cyan-500/30"
              />
              <AnimatedButton
                onClick={handleCopy}
                variant={copied ? 'secondary' : 'primary'}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                className="shrink-0"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </AnimatedButton>
            </div>
          </div>

          {/* Expiration & Download Quota Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Expiry Countdown */}
            <div className="rounded-xl border border-slate-800 bg-navy-950/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>Time Remaining</span>
              </div>
              <div className="text-base font-bold font-mono text-cyan-300">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>

            {/* Download Quota */}
            <div className="rounded-xl border border-slate-800 bg-navy-950/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Download className="h-3.5 w-3.5 text-violet-400" />
                <span>Downloads Allowed</span>
              </div>
              <div className="text-base font-bold font-mono text-violet-300">
                {share.downloadCount} / {share.maxDownloads === 999 ? 'Unlimited' : share.maxDownloads}
              </div>
            </div>

            {/* Password Protection */}
            <div className="rounded-xl border border-slate-800 bg-navy-950/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                {share.isPasswordProtected ? (
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>Decryption Key</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-200 truncate">
                {share.isPasswordProtected ? (
                  <span className="text-amber-300">Password Active</span>
                ) : (
                  <span className="text-slate-400">None Required</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: QR Code Card */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 bg-navy-950/70 text-center">
          <div className="p-3 bg-white rounded-xl shadow-lg">
            <QRCodeSVG
              value={share.demoUrl}
              size={128}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#050d1a"
            />
          </div>
          <span className="mt-3 text-xs font-mono font-medium text-slate-300">
            Scan to Open Transfer
          </span>
          <span className="text-[10px] text-slate-500">
            Direct mobile peer access
          </span>
        </div>
      </div>

      {/* Simulation Notice Disclaimer */}
      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-semibold text-amber-300">Frontend Simulation Notice:</span>{' '}
          This link was generated locally in client memory for UI demonstration. No real server
          file persistence or production encryption keys were committed.
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <AnimatedButton
          variant="outline"
          onClick={onCreateAnother}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Create Another Share
        </AnimatedButton>

        <AnimatedButton
          variant="secondary"
          onClick={() => onOpenDownload(share.code)}
          rightIcon={<ExternalLink className="h-4 w-4" />}
        >
          Test Download Experience
        </AnimatedButton>
      </div>
    </motion.div>
  );
};
