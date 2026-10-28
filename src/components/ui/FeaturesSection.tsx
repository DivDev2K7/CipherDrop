import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Key,
  Flame,
  FileSearch,
  Server,
  Database,
  Lock,
  Cpu,
} from 'lucide-react';
import { FeatureCard } from './FeatureCard.tsx';
import { fadeInUp, staggerContainer } from '../../utils/animations.ts';

export const FeaturesSection: React.FC = () => {
  const zeroTrustPillars = [
    {
      title: 'Zero-Knowledge Ephemeral Storage',
      description:
        'Files are sliced into encrypted fragments in-memory. No unencrypted data is ever written to disks, and all buffers are explicitly zero-filled upon completion.',
      icon: <ShieldAlert className="h-6 w-6" />,
      tag: 'PILLAR 01',
      accent: 'cyan' as const,
    },
    {
      title: 'Client-Side Key Derivation',
      description:
        'Argon2id and AES-256-GCM symmetric encryption happens right in the recipient and sender browsers. Plaintext keys never traverse the network.',
      icon: <Key className="h-6 w-6" />,
      tag: 'PILLAR 02',
      accent: 'violet' as const,
    },
    {
      title: 'Automated Burn-After-Reading',
      description:
        'Set strict single-use quotas. Once the threshold is met, the cryptographic headers are instantly wiped, making future decryption mathematically impossible.',
      icon: <Flame className="h-6 w-6" />,
      tag: 'PILLAR 03',
      accent: 'cyan' as const,
    },
    {
      title: 'Tamper-Evident Access Audits',
      description:
        'Immutable cryptographic audit events track token issuance, recipient handshakes, failed authentication attempts, and final payload shredding timestamps.',
      icon: <FileSearch className="h-6 w-6" />,
      tag: 'PILLAR 04',
      accent: 'violet' as const,
    },
  ];

  const backendReadinessSpecs = [
    {
      label: 'API Service Layer',
      tech: 'TypeScript Interfaces',
      status: 'Ready',
      detail: 'Fully decoupled frontend service in src/services/api.ts with typed contracts.',
      icon: <Cpu className="h-4 w-4 text-cyan-400" />,
    },
    {
      label: 'Target Backend Engine',
      tech: 'Node.js + Express',
      status: 'Planned',
      detail: 'RESTful endpoints for /api/transfers, /api/transfers/:code, /api/verify.',
      icon: <Server className="h-4 w-4 text-violet-400" />,
    },
    {
      label: 'Database Layer',
      tech: 'Prisma ORM + SQLite',
      status: 'Planned',
      detail: 'Schema for Transfers, AuditLogs, and EphemeralKeys with cascading purge on expiry.',
      icon: <Database className="h-4 w-4 text-cyan-400" />,
    },
    {
      label: 'Security Boundary',
      tech: 'Zero-Trust Protocol',
      status: 'Enforced',
      detail: 'Server holds zero decryption keys. Only client holds ephemeral key fragments.',
      icon: <Lock className="h-4 w-4 text-violet-400" />,
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3.5 py-1 text-xs font-mono text-cyan-300 mb-4">
            <span>ZERO-TRUST ARCHITECTURE SPECIFICATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Security by design. Not by policy.
          </h2>
          <p className="mt-3 text-base text-slate-400">
            Standard cloud drives rely on access permissions. ZeroVault relies on mathematical impossibility.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {zeroTrustPillars.map((pillar, idx) => (
            <FeatureCard
              key={idx}
              title={pillar.title}
              description={pillar.description}
              icon={pillar.icon}
              tag={pillar.tag}
              accent={pillar.accent}
            />
          ))}
        </motion.div>

        {/* Backend Readiness Integration Matrix */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 rounded-3xl border border-slate-800 bg-navy-900/40 p-6 sm:p-8 backdrop-blur-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                SYSTEM ARCHITECTURE & ROADMAP
              </div>
              <h3 className="text-xl font-bold text-white">
                Backend Readiness & API Contracts
              </h3>
            </div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-300">
              Clean Decoupled Architecture
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {backendReadinessSpecs.map((spec, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-800/80 bg-navy-950/60 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 border border-slate-800">
                      {spec.icon}
                    </div>
                    <span className="rounded px-2 py-0.5 text-[10px] font-mono border border-slate-700 bg-slate-800/50 text-slate-300">
                      {spec.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-cyan-300">{spec.tech}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{spec.label}</div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{spec.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
