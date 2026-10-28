import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Zap,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { AnimatedButton } from './AnimatedButton.tsx';
import { fadeInUp, staggerContainer } from '../../utils/animations.ts';
import type { ActiveTab } from '../../types/index.ts';

interface HeroSectionProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleScrollToTransfer = () => {
    const el = document.getElementById('upload-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('upload');
    }
  };

  return (
    <section className="relative w-full min-h-[92vh] sm:min-h-[88vh] flex items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black text-white">
      {/* Background Video Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
        {!videoError && (
          <video
            ref={videoRef}
            src="/videos/hero-cinematic.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`w-full h-full object-cover object-center transform scale-[1.02] transition-opacity duration-1000 ease-out ${
              videoLoaded ? 'opacity-85' : 'opacity-0'
            }`}
          />
        )}

        {/* Fallback Graphic if video cannot play or while loading */}
        {(!videoLoaded || videoError) && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#070709] via-[#0d0d12] to-[#040406]">
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-slate-700/15 blur-[160px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />
          </div>
        )}

        {/* Cinematic Vignette & Gradient Overlays - Tuned to keep eagle & transforming file visible */}
        {/* Top bar shadow for navbar integration */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent" />

        {/* Bottom seamless transition to page content */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/85 to-transparent" />

        {/* Radial center scrim: subtly dims behind text while leaving the transforming eagle sharp */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(8,10,14,0.35)_0%,_rgba(5,6,9,0.72)_75%,_rgba(0,0,0,0.92)_100%)]" />

        {/* Ultra-subtle graphite film grain line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.015] to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center flex flex-col items-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center max-w-4xl"
        >
          {/* Eyebrow Tag */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs font-mono text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.15)] backdrop-blur-md mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="tracking-widest uppercase text-[11px] font-semibold text-slate-200">
              Ephemeral Cryptographic Protocol
            </span>
            <span className="text-white/20">&bull;</span>
            <span className="text-cyan-400 text-[10px] tracking-wider">AES-256-GCM</span>
          </motion.div>

          {/* Main Hero Heading */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
          >
            Your Files. Your Rules.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-400 drop-shadow-[0_0_35px_rgba(34,211,238,0.4)]">
              Zero Trust.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed font-normal drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]"
          >
            Transfer sensitive files through a temporary, privacy-first sharing experience
            designed around controlled access and secure delivery.
          </motion.p>

          {/* Primary & Secondary Call To Actions */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto"
          >
            <AnimatedButton
              size="lg"
              variant="primary"
              onClick={handleScrollToTransfer}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_45px_rgba(34,211,238,0.6)] px-7 py-4 text-sm sm:text-base font-semibold"
            >
              Transfer a File
            </AnimatedButton>

            <AnimatedButton
              size="lg"
              variant="outline"
              onClick={() => onNavigate('dashboard')}
              leftIcon={<Shield className="h-4 w-4 text-cyan-400" />}
              className="border-white/15 bg-black/50 hover:bg-black/80 hover:border-cyan-400/50 backdrop-blur-md px-7 py-4 text-sm sm:text-base font-medium text-slate-200"
            >
              Explore Security
            </AnimatedButton>
          </motion.div>

          {/* Minimalist Graphite Pillar Bar */}
          <motion.div
            variants={fadeInUp}
            className="mt-14 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 w-full max-w-3xl"
          >
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-400 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">Zero Retention</div>
                <div className="text-[11px] text-slate-400 font-mono">In-Memory Shredding</div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-400 backdrop-blur-md">
                <KeyRound className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">Client Encrypted</div>
                <div className="text-[11px] text-slate-400 font-mono">AES-GCM-256 Engine</div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-400 backdrop-blur-md">
                <Zap className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">Automated Expiry</div>
                <div className="text-[11px] text-slate-400 font-mono">Strict TTL & Quota</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator prompt */}
        <motion.button
          onClick={handleScrollToTransfer}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 1.5,
          }}
          className="mt-12 flex flex-col items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          aria-label="Scroll to transfer workspace"
        >
          <span className="tracking-wider uppercase">Scroll to Workspace</span>
          <ChevronDown className="h-4 w-4 text-cyan-400" />
        </motion.button>
      </div>

      {/* Floating security status pill */}
      <div className="hidden lg:flex absolute bottom-6 right-8 z-20 items-center gap-2 rounded-xl border border-white/10 bg-black/75 px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-xl">
        <Lock className="h-3 w-3 text-cyan-400" />
        <span>Hardware-Accelerated Vault</span>
      </div>
    </section>
  );
};
