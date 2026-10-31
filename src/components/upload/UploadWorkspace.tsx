import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileCheck,
  X,
  Lock,
  Clock,
  Shield,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { FileCube } from '../3d/FileCube.tsx';
import { AnimatedButton } from '../ui/AnimatedButton.tsx';
import { ShareLinkResult } from './ShareLinkResult.tsx';
import { transferApi } from '../../services/api.ts';
import { scaleFade } from '../../utils/animations.ts';
import type { ShareMetadata, TransferSettings } from '../../types/index.ts';

// Configurable frontend file constraints
const FILE_CONSTRAINTS = {
  maxSizeBytes: 100 * 1024 * 1024, // 100 MB
  maxSizeLabel: '100 MB',
  disallowedExtensions: ['.exe', '.bat', '.sh', '.cmd', '.msi', '.vbs'],
};

interface UploadWorkspaceProps {
  onOpenDownload: (code: string) => void;
}

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({ onOpenDownload }) => {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [settings, setSettings] = useState<TransferSettings>({
    expiryHours: 24,
    maxDownloads: 5,
    requirePassword: false,
    password: '',
    encryptionLevel: 'military',
    burnAfterRead: false,
  });

  // Upload simulation state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusStage, setUploadStatusStage] = useState<string>('');
  const [completedShare, setCompletedShare] = useState<ShareMetadata | null>(null);
  const [visualMode, setVisualMode] = useState<'cgi' | '3d'>('cgi');

  // Validate a chosen file
  const validateFile = (file: File): string | null => {
    if (file.size > FILE_CONSTRAINTS.maxSizeBytes) {
      return `File exceeds maximum allowed size of ${FILE_CONSTRAINTS.maxSizeLabel}.`;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (FILE_CONSTRAINTS.disallowedExtensions.includes(ext)) {
      return `Executable file extensions (${ext}) are prohibited for security reasons.`;
    }
    return null;
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setValidationError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('Please select or drag a file to transfer.');
      return;
    }

    if (settings.requirePassword && (!settings.password || settings.password.trim().length < 4)) {
      setValidationError('Password must be at least 4 characters long.');
      return;
    }

    setValidationError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulated multi-stage cryptographic pipeline
    const stages = [
      { progress: 15, label: 'Generating client-side entropy & ephemeral AES-256 keys...' },
      { progress: 40, label: 'Deriving Argon2id cryptographic parameters in memory...' },
      { progress: 75, label: 'Encrypting payload chunks & calculating SHA-256 checksum...' },
      { progress: 95, label: 'Simulating zero-trust ephemeral token generation...' },
      { progress: 100, label: 'Encryption verified. Link generated.' },
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setUploadProgress(stage.progress);
      setUploadStatusStage(stage.label);
      await new Promise((resolve) => setTimeout(resolve, 380));
    }

    try {
      // 1. Create share metadata
      const result = await transferApi.createTransfer(
        {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
        },
        settings
      );

      // 2. Upload the actual file
      await transferApi.uploadFile(result.id, selectedFile);

      setCompletedShare(result);
    } catch (err) {
      setValidationError('Failed to generate secure link. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCompletedShare(null);
    setUploadProgress(0);
    setUploadStatusStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AnimatePresence mode="wait">
        {completedShare ? (
          <ShareLinkResult
            key="share-result"
            share={completedShare}
            onCreateAnother={handleReset}
            onOpenDownload={onOpenDownload}
          />
        ) : (
          <motion.div
            key="upload-form"
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-3xl border border-cyan-500/20 bg-navy-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-cyan-400 mb-1">
                  <Shield className="h-3.5 w-3.5" />
                  <span>CLIENT-SIDE CIPHER SUITE</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Ephemeral File Transfer Workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Select a file, configure expiration and limits, and generate an in-memory secure demo token.
                </p>
              </div>

              {/* 3D Visual Preview (Toggleable: CGI Film vs 3D Cube) */}
              <div className="hidden sm:flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-cyan-500/20 bg-navy-950/70 shadow-lg shrink-0">
                <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-navy-900/80 p-0.5 text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => setVisualMode('cgi')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      visualMode === 'cgi'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    CGI Stream
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualMode('3d')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      visualMode === '3d'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3D Cube
                  </button>
                </div>
                <div className="relative h-20 w-32 overflow-hidden rounded-xl border border-cyan-500/20 bg-black/60 flex items-center justify-center">
                  {visualMode === 'cgi' ? (
                    <>
                      <img
                        src="/videos/cgi-product-film.gif"
                        alt="CGI Payload Film"
                        className="w-full h-full object-cover object-center opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[8px] font-mono text-cyan-300 bg-black/80 px-1.5 py-0.5 rounded">
                        <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                        <span>CGI STREAM</span>
                      </div>
                    </>
                  ) : (
                    <FileCube isUploading={isUploading} className="h-20 w-20" />
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Drag & Drop Zone */}
              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_40px_rgba(34,211,238,0.2)]'
                      : 'border-slate-700/80 bg-navy-950/60 hover:border-cyan-400/60 hover:bg-navy-950/90'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-navy-900 text-cyan-400 shadow-lg group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all">
                    <UploadCloud className="h-8 w-8" />
                  </div>

                  <div className="mt-4">
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Drop your confidential file here, or{' '}
                      <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-4">
                        browse files
                      </span>
                    </span>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      Max file size: {FILE_CONSTRAINTS.maxSizeLabel} &bull; End-to-end encrypted
                    </p>
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div className="flex items-center justify-between rounded-2xl border border-cyan-400/40 bg-navy-950/80 p-4 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'Binary data'}
                      </div>
                    </div>
                  </div>

                  {!isUploading && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Validation Error alert */}
              {validationError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Progress Bar (Visible during simulation) */}
              {isUploading && (
                <div className="space-y-2 rounded-2xl border border-cyan-500/30 bg-navy-950/90 p-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                      {uploadStatusStage}
                    </span>
                    <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-navy-900 border border-cyan-500/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Configuration Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Expiration Settings */}
                <div className="rounded-2xl border border-slate-800 bg-navy-950/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase">
                    <Clock className="h-4 w-4" />
                    <span>Time-To-Live (TTL)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { hours: 1, label: '1 Hour' },
                      { hours: 24, label: '24 Hours' },
                      { hours: 168, label: '7 Days' },
                    ].map((opt) => (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => setSettings({ ...settings, expiryHours: opt.hours })}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border transition-all cursor-pointer ${
                          settings.expiryHours === opt.hours
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                            : 'border-slate-800 bg-navy-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Link expires automatically and in-memory payload is destroyed.
                  </p>
                </div>

                {/* Download Limit Settings */}
                <div className="rounded-2xl border border-slate-800 bg-navy-950/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-violet-400 uppercase">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Download Limit</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { count: 1, label: '1 (Burn)' },
                      { count: 5, label: '5' },
                      { count: 10, label: '10' },
                      { count: 999, label: 'Unlimited' },
                    ].map((opt) => (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => setSettings({ ...settings, maxDownloads: opt.count })}
                        className={`rounded-xl px-2 py-2 text-xs font-medium border transition-all cursor-pointer text-center ${
                          settings.maxDownloads === opt.count
                            ? 'border-violet-400 bg-violet-500/20 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                            : 'border-slate-800 bg-navy-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {settings.maxDownloads === 1
                      ? 'Self-destructs immediately after first successful download.'
                      : 'Deactivates automatically after download quota is reached.'}
                  </p>
                </div>
              </div>

              {/* Password Protection & Cipher Level */}
              <div className="rounded-2xl border border-slate-800 bg-navy-950/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono font-medium text-slate-200 uppercase">
                      Additional Password Protection
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        requirePassword: !settings.requirePassword,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.requirePassword ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.requirePassword ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settings.requirePassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2"
                  >
                    <input
                      type="password"
                      placeholder="Enter a secure decryption password..."
                      value={settings.password}
                      onChange={(e) =>
                        setSettings({ ...settings, password: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-navy-900/90 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Required by recipient before the file can be decrypted in-memory.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Disclaimer Notice */}
              <div className="flex items-start gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-slate-400">
                <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Frontend Demonstration Mode: Submitting will simulate client-side encryption and generate a test share token. No real server backend or permanent disk storage is claimed.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <AnimatedButton
                  type="submit"
                  size="lg"
                  variant="primary"
                  className="w-full"
                  isLoading={isUploading}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Encrypting & Generating Link...' : 'Create Secure Demo Link'}
                </AnimatedButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
