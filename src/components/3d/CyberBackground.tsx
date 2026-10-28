import React, { useRef, useMemo, useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('WebGL Error caught in CyberBackground:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 150;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const cyan = new THREE.Color('#22d3ee');
    const violet = new THREE.Color('#8b5cf6');

    for (let i = 0; i < count; i++) {
      const v1 = ((Math.sin(i * 17.13) * 43758.5453) % 1);
      const v2 = ((Math.sin(i * 39.51) * 43758.5453) % 1);
      const v3 = ((Math.sin(i * 83.77) * 43758.5453) % 1);

      pos[i * 3] = v1 * 25;
      pos[i * 3 + 1] = v2 * 20;
      pos[i * 3 + 2] = v3 * 15 - 5;

      const mixed = cyan.clone().lerp(violet, Math.abs(v1));
      cols[i * 3] = mixed.r;
      cols[i * 3 + 1] = mixed.g;
      cols[i * 3 + 2] = mixed.b;
    }

    return [pos, cols];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const CyberBackground: React.FC = () => {
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Dark cybersecurity ambient radial glows */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[140px]" />
      <div className="absolute bottom-1/4 right-10 h-[600px] w-[600px] rounded-full bg-violet-600/7 blur-[160px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-navy-800/20 blur-[180px]" />

      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 bg-animated-grid opacity-35" />

      {/* Lightweight 3D particle constellation with fallback */}
      {webglSupported && (
        <WebGLErrorBoundary fallback={null}>
          <Canvas
            className="absolute inset-0"
            camera={{ position: [0, 0, 10], fov: 60 }}
            gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
            dpr={[1, 1.5]}
          >
            <ParticleField />
          </Canvas>
        </WebGLErrorBoundary>
      )}

      {/* Subtle scan-line overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.015] to-transparent pointer-events-none" />
    </div>
  );
};
