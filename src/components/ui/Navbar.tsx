import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  UploadCloud,
  LayoutDashboard,
  Download,
  Layers,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import type { ActiveTab } from '../../types/index.ts';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'upload' as ActiveTab, label: 'Secure Transfer', icon: UploadCloud },
    { id: 'dashboard' as ActiveTab, label: 'Security Dashboard', icon: LayoutDashboard },
    { id: 'download' as ActiveTab, label: 'Download Portal', icon: Download },
    { id: 'features' as ActiveTab, label: 'Zero-Trust Protocol', icon: Layers },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/10 bg-navy-950/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('upload')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-navy-900 shadow-[0_0_20px_rgba(34,211,238,0.25)] group-hover:border-cyan-400 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all">
            <Shield className="h-5 w-5 text-cyan-400" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                ZERO<span className="text-cyan-400">VAULT</span>
              </span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-wider text-cyan-300 border border-cyan-500/25">
                v2.4 ZERO-TRUST
              </span>
            </div>
            <span className="text-[10px] text-slate-400 tracking-wider font-mono">
              EPHEMERAL CIPHER STREAM
            </span>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-navy-900/60 p-1 backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-lg bg-cyan-500/15 border border-cyan-400/30"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Icon className={`relative z-10 h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Badge */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-950/20 px-3 py-1 text-xs font-mono text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <Lock className="h-3 w-3 text-violet-400" />
            <span>Frontend Simulation Mode</span>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-700/60 p-2 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-b border-cyan-500/15 bg-navy-950/95 px-4 pt-2 pb-5 backdrop-blur-2xl"
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'
                        : 'text-slate-400 hover:bg-navy-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Status: Online</span>
              <span className="text-cyan-400">AES-256 GCM</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
