import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SceneFallbackProps {
  label?: string;
  compact?: boolean;
}

export const SceneFallback: React.FC<SceneFallbackProps> = ({
  label = 'Zero-Trust Shield Core',
  compact = false,
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/20 bg-navy-950/80 p-6 text-center select-none ${
        compact ? 'h-48' : 'h-80 w-full'
      }`}
      aria-label="3D visualization placeholder"
    >
      {/* Background glow and grid rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <div className="h-44 w-44 rounded-full border border-cyan-400/30 animate-pulse-cyan" />
        <div className="absolute h-56 w-56 rounded-full border border-violet-500/25 animate-orbit-slow" />
        <div className="absolute h-32 w-32 rounded-full border border-dashed border-cyan-300/40 animate-orbit-medium" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-navy-900/90 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <ShieldAlert className="h-8 w-8 text-cyan-400" />
        </div>
        <span className="mt-4 text-xs font-mono font-medium tracking-widest text-cyan-300 uppercase">
          {label}
        </span>
        <span className="mt-1 text-[11px] text-slate-400">
          Hardware acceleration active • AES-256 GCM Core
        </span>
      </div>
    </div>
  );
};
