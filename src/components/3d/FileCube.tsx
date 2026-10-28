import React, { useRef, useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { ShieldCheck } from 'lucide-react';

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
    console.warn('WebGL Rendering Error in FileCube:', error, errorInfo);
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

interface FileCubeMeshProps {
  isUploading?: boolean;
}

const FileCubeMesh: React.FC<FileCubeMeshProps> = ({ isUploading = false }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const rotSpeed = isUploading ? 3.5 : 0.8;

    if (outerRef.current) {
      outerRef.current.rotation.y += delta * rotSpeed * 0.4;
      outerRef.current.rotation.x += delta * rotSpeed * 0.2;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * rotSpeed * 0.6;
      innerRef.current.rotation.z += delta * rotSpeed * 0.3;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * rotSpeed;
    }

    if (outerRef.current) {
      outerRef.current.position.x = THREE.MathUtils.damp(
        outerRef.current.position.x,
        state.pointer.x * 0.3,
        4,
        delta
      );
      outerRef.current.position.y = THREE.MathUtils.damp(
        outerRef.current.position.y,
        state.pointer.y * 0.3,
        4,
        delta
      );
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.8}>
      {/* Outer Glass Shield Box */}
      <mesh ref={outerRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshPhysicalMaterial
          color="#0a1628"
          roughness={0.1}
          metalness={0.9}
          transmission={0.7}
          transparent
          opacity={0.75}
          emissive="#22d3ee"
          emissiveIntensity={isUploading ? 0.6 : 0.2}
        />
      </mesh>

      {/* Wireframe border glow */}
      <mesh ref={innerRef}>
        <boxGeometry args={[1.52, 1.52, 1.52]} />
        <meshBasicMaterial
          color={isUploading ? '#67e8f9' : '#22d3ee'}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Internal Encrypted Octahedron Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#8b5cf6"
          emissiveIntensity={isUploading ? 2 : 1}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Corner Data Nodes */}
      <group>
        {[
          [-0.8, -0.8, -0.8],
          [0.8, -0.8, -0.8],
          [-0.8, 0.8, -0.8],
          [0.8, 0.8, -0.8],
          [-0.8, -0.8, 0.8],
          [0.8, -0.8, 0.8],
          [-0.8, 0.8, 0.8],
          [0.8, 0.8, 0.8],
        ].map((pos, idx) => (
          <mesh key={idx} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
        ))}
      </group>
    </Float>
  );
};

interface FileCubeProps {
  className?: string;
  isUploading?: boolean;
}

export const FileCube: React.FC<FileCubeProps> = ({
  className = '',
  isUploading = false,
}) => {
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());

  const fallback = (
    <div className={`flex items-center justify-center rounded-2xl border border-cyan-500/20 bg-navy-950/60 p-4 ${className}`}>
      <div className="flex flex-col items-center gap-2 text-cyan-400">
        <ShieldCheck className="h-10 w-10 animate-pulse-cyan" />
        <span className="text-xs font-mono">Encrypted Data Object</span>
      </div>
    </div>
  );

  if (!webglSupported) {
    return fallback;
  }

  return (
    <div className={`relative h-44 w-44 overflow-hidden ${className}`}>
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 3, 3]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-2, -2, 2]} intensity={2.5} color="#22d3ee" />
          <pointLight position={[2, 2, -2]} intensity={2} color="#8b5cf6" />
          <FileCubeMesh isUploading={isUploading} />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
