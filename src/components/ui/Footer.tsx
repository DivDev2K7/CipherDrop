import React from 'react';
import { Shield, Lock, Terminal } from 'lucide-react';
import type { ActiveTab } from '../../types/index.ts';

interface FooterProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="relative border-t border-slate-800/80 bg-navy-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-navy-900 text-cyan-400">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-base font-bold font-mono tracking-tight text-white">
                ZERO<span className="text-cyan-400">VAULT</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Zero-Trust Ephemeral File Transfer System frontend. Built with React 19,
              Three.js, React Three Fiber, Drei, Tailwind CSS, and Motion.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>v2.4 Ephemeral Protocol</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono uppercase text-white font-semibold">
              Platform Modules
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('upload')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Transfer Workspace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Security Audit Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('download')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Demo Download Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('features')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Protocol Specifications
                </button>
              </li>
            </ul>
          </div>

          {/* Cryptographic Standards */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-mono uppercase text-white font-semibold">
              Security Standard
            </div>
            <div className="rounded-xl border border-slate-800 bg-navy-900/40 p-3 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Lock className="h-3 w-3" />
                <span>AES-256-GCM Symmetrical Cipher</span>
              </div>
              <div className="text-slate-400">
                Key Derivation: Argon2id (Client-side)
              </div>
              <div className="text-slate-400">
                Destruction: DOD 5220.22-M Wipe Pattern simulation
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; 2026 ZEROVAULT Security Systems. Frontend prototype simulation.
          </div>
          <div className="text-center sm:text-right text-[11px]">
            Frontend Demonstration &bull; Backend integration via Node.js/Express & Prisma planned.
          </div>
        </div>
      </div>
    </footer>
  );
};
