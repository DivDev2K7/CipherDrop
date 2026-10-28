import React from 'react';
import { motion } from 'motion/react';
import { fadeInUp, cardHover } from '../../utils/animations.ts';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
  accent?: 'cyan' | 'violet';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  tag,
  accent = 'cyan',
}) => {
  const isCyan = accent === 'cyan';

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover.hover}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-navy-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30"
    >
      {/* Top accent glow line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] opacity-70 transition-opacity duration-300 group-hover:opacity-100 ${
          isCyan
            ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
            : 'bg-gradient-to-r from-transparent via-violet-400 to-transparent'
        }`}
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border p-2.5 transition-colors duration-300 ${
              isCyan
                ? 'border-cyan-500/30 bg-cyan-950/30 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                : 'border-violet-500/30 bg-violet-950/30 text-violet-400 group-hover:border-violet-400 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]'
            }`}
          >
            {icon}
          </div>

          {tag && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium tracking-wide border ${
                isCyan
                  ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                  : 'border-violet-500/20 bg-violet-500/10 text-violet-300'
              }`}
            >
              {tag}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-100 tracking-tight mb-2 group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-1 text-xs font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
        <span>ENCRYPTED LAYER</span>
        <span className="text-[10px]">&bull;</span>
        <span className="uppercase">VERIFIED ZERO-KNOWLEDGE</span>
      </div>
    </motion.div>
  );
};
