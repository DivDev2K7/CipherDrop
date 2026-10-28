import React from 'react';
import {
  Shield,
  UploadCloud,
  LayoutDashboard,
  Clock,
  Lock,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import type { ActiveTab } from '../../types/index.ts';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeSharesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  activeSharesCount,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Audit Dashboard', icon: LayoutDashboard },
    { id: 'upload' as ActiveTab, label: 'Secure Transfer', icon: UploadCloud },
    { id: 'download' as ActiveTab, label: 'Download Portal', icon: Radio },
  ];

  return (
    <aside
      className={`relative hidden lg:flex flex-col border-r border-slate-800 bg-navy-950/80 backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand / Toggle Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-navy-900 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold font-mono tracking-tight text-white">
                ZERO<span className="text-cyan-400">VAULT</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider">
                AUDIT ENGINE
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-navy-900 text-cyan-400">
            <Shield className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-navy-900/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                  : 'text-slate-400 hover:bg-navy-900 hover:text-slate-200 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.id === 'dashboard' && activeSharesCount > 0 && (
                <span className="ml-auto rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30">
                  {activeSharesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Health Box */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="rounded-xl border border-slate-800/80 bg-navy-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Node Health</span>
              <span className="text-emerald-400 font-mono font-semibold">100% ONLINE</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Lock className="h-3 w-3 text-cyan-400" />
              <span>Argon2id + AES-GCM</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Clock className="h-3 w-3 text-violet-400" />
              <span>TTL Auto-Shredder Active</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
