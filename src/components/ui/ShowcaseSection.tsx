import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Binary,
  Layers,
  Sparkles,
  Cpu,
  Lock,
  ArrowUpRight,
  Fingerprint,
} from 'lucide-react';
import { fadeInUp, staggerContainer, cardHover } from '../../utils/animations.ts';

export const ShowcaseSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden border-t border-white/[0.06] bg-graphite-950/70">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Figma-grade typography & badges */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="uppercase tracking-widest text-[11px] font-semibold">
              FIGMA SPEC &bull; 3D VISUAL INTELLIGENCE
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Designed for Zero Trust.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-violet-400">
              Engineered with Precision.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Explore the cryptographic architecture rendered in high-fidelity 3D and cinematic telemetry streams.
          </p>
        </div>

        {/* Bento Grid Showcase Layout */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-12 gap-5"
        >
          {/* Tile 1: Large CGI Product Film (Spans 8 cols on desktop) */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="md:col-span-8 group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-900/80 via-navy-950/90 to-graphite-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between min-h-[360px]"
          >
            {/* Visual background using user's cgi-product-film.gif */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
              <img
                src="/videos/cgi-product-film.gif"
                alt="CGI Product Film 3D File Visualization"
                className="w-full h-full object-cover object-center opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-transparent to-navy-950/40" />
            </div>

            {/* Top pill row */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-black/60 px-3 py-1 text-xs font-mono text-cyan-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                CGI 3D PAYLOAD FILM
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                STREAM 01 <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
              </span>
            </div>

            {/* Bottom info */}
            <div className="relative z-10 mt-24">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Zero-Knowledge Fragment Slicing</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Secure Payload Dematerialization
              </h3>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Files are rendered into encrypted byte streams on the fly. The source file is never preserved in its original form on any intermediary server or storage array.
              </p>
            </div>
          </motion.div>

          {/* Tile 2: Tall Cyber Sentinel Video (Spans 4 cols on desktop) */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-900/80 via-navy-950/90 to-graphite-950 p-6 sm:p-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between min-h-[360px]"
          >
            {/* Background using user's cyber-generation.gif */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
              <img
                src="/videos/cyber-generation.gif"
                alt="Cybersecurity Visual Generation"
                className="w-full h-full object-cover object-center opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-black/60 px-3 py-1 text-xs font-mono text-violet-300 backdrop-blur-md">
                <ShieldAlert className="h-3 w-3 text-violet-400" />
                ACTIVE SENTINEL
              </span>
              <span className="text-[11px] font-mono text-violet-300">STREAM 02</span>
            </div>

            <div className="relative z-10 mt-16">
              <div className="text-xs font-mono text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                <span>Autonomous Threat Shield</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Real-Time Intrusion Disruption
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Automated honeypot detection and brute-force lockouts invalidate download tokens after threshold authentication failures.
              </p>
            </div>
          </motion.div>

          {/* Tile 3: 256-bit Metric Tile (Spans 4 cols) */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="md:col-span-4 rounded-3xl border border-white/10 bg-gradient-to-br from-navy-950/90 to-graphite-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400">
                <Lock className="h-4 w-4" />
                <span>Cipher Strength</span>
              </div>
              <span className="rounded-md border border-cyan-500/20 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                QUANTUM-HARDENED
              </span>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight flex items-baseline gap-2">
                256<span className="text-xl sm:text-2xl text-cyan-400 font-semibold">-bit</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-2">
                AES-GCM Authenticated Encryption
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Galois/Counter Mode guarantees both confidentiality and ciphertext authenticity with hardware AES-NI acceleration.
              </p>
            </div>
          </motion.div>

          {/* Tile 4: Zero Persistence Metric Tile (Spans 4 cols) */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="md:col-span-4 rounded-3xl border border-white/10 bg-gradient-to-br from-navy-950/90 to-graphite-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-violet-400">
                <Binary className="h-4 w-4" />
                <span>Disk Persistence</span>
              </div>
              <span className="rounded-md border border-violet-500/20 bg-violet-950/40 px-2 py-0.5 text-[10px] font-mono text-violet-300">
                EPHEMERAL RAM
              </span>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight flex items-baseline gap-2">
                0<span className="text-xl sm:text-2xl text-violet-400 font-semibold">Bytes</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-2">
                Volatile Memory Only
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Unencrypted fragments are purged using cryptographic pseudo-random overwrite sequences upon recipient delivery.
              </p>
            </div>
          </motion.div>

          {/* Tile 5: Client Derivation Metric Tile (Spans 4 cols) */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="md:col-span-4 rounded-3xl border border-white/10 bg-gradient-to-br from-navy-950/90 to-graphite-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400">
                <Fingerprint className="h-4 w-4" />
                <span>Key Derivation</span>
              </div>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                CLIENT-SIDE
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                Argon2id
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-2">
                Memory-Hard Proof-of-Work
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Immune to GPU and ASIC brute-force rainbow attacks through parameterized memory cost requirements.
              </p>
            </div>
          </motion.div>

          {/* Tile 6: Figma-Style Quote / Architectural Philosophy Banner (Spans 12 cols) */}
          <motion.div
            variants={fadeInUp}
            whileHover={cardHover.hover}
            className="md:col-span-12 rounded-3xl border border-white/10 bg-gradient-to-r from-navy-950 via-[#0d1627] to-graphite-950 p-6 sm:p-8 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
                ARCHITECTURE PHILOSOPHY
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                &ldquo;Built for zero trust. Verified by mathematics. Delivered with elegance.&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                CipherDrop replaces centralized trust assumptions with verifiable client-side cryptographic guarantees.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3 shrink-0">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">CipherDrop Core</span>
                <span className="text-[10px] font-mono text-cyan-400">v2.4 Ephemeral Spec</span>
              </div>
              <div className="h-10 w-10 rounded-2xl border border-cyan-400/40 bg-cyan-950/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
