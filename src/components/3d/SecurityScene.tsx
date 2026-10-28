import React, { useRef, useMemo, useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { SceneFallback } from './SceneFallback.tsx';

// Class error boundary to catch WebGL context crashes or unsupported browsers
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
    console.warn('WebGL Rendering Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Check if WebGL is supported in client
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

// 3D Orbital Ring
interface OrbitalRingProps {
  radius: number;
  tube: number;
  speed: number;
  color: string;
  tilt: [number, number, number];
}

const OrbitalRing: React.FC<OrbitalRingProps> = ({ radius, tube, speed, color, tilt }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * speed;
    }
  });

  return (
    <group rotation={tilt}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, tube, 16, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};

// Floating Security Nodes (Octahedrons / Tetrahedrons)
const FloatingNodes: React.FC = () => {
  const count = 12;
  const nodes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.4 + (i % 3) * 0.4;
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(i * 1.7) * 1.2,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: 0.12 + (i % 3) * 0.06,
        color: i % 2 === 0 ? '#22d3ee' : '#a78bfa',
      };
    });
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position} scale={node.scale}>
          <octahedronGeometry />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

// Swarm of digital security particles
const ParticleCloud: React.FC<{ count?: number }> = ({ count = 90 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const cyan = new THREE.Color('#22d3ee');
    const purple = new THREE.Color('#a78bfa');

    for (let i = 0; i < count; i++) {
      // Deterministic spread
      const p1 = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const p2 = (Math.sin(i * 78.233) * 43758.5453) % 1;
      const p3 = (Math.sin(i * 45.164) * 43758.5453) % 1;

      const norm1 = Math.abs(p1);
      const norm2 = Math.abs(p2);
      const norm3 = Math.abs(p3);

      const r = 1.5 + norm1 * 2.2;
      const theta = norm2 * Math.PI * 2;
      const phi = Math.acos(2 * norm3 - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mixed = cyan.clone().lerp(purple, norm1);
      cols[i * 3] = mixed.r;
      cols[i * 3 + 1] = mixed.g;
      cols[i * 3 + 2] = mixed.b;
    }

    return [pos, cols];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.15;
      pointsRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Core Glowing Shield / Orb
const CoreOrb: React.FC = () => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outerRef.current) {
      outerRef.current.rotation.y += delta * 0.35;
      outerRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group>
      {/* Outer Faceted Shield Shell */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshPhysicalMaterial
          color="#0f2040"
          emissive="#22d3ee"
          emissiveIntensity={0.25}
          roughness={0.1}
          metalness={0.9}
          transmission={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Wireframe outer cage */}
      <mesh>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial
          color="#22d3ee"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Inner Glowing Cryptographic Kernel */}
      <mesh ref={innerRef}>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#a78bfa"
          emissiveIntensity={1.2}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Center point light that illuminates the internal cage */}
      <pointLight color="#22d3ee" intensity={2} distance={5} />
      <pointLight color="#8b5cf6" intensity={1.8} distance={5} />
    </group>
  );
};

// Interactive Scene Container that rotates with mouse pointer
const InteractiveSceneGroup: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ pointer }, delta) => {
    if (groupRef.current) {
      const targetY = pointer.x * 0.45;
      const targetX = -pointer.y * 0.35;
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetY,
        4,
        delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetX,
        4,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} scale={compact ? 0.75 : 1}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <CoreOrb />
        <OrbitalRing
          radius={1.7}
          tube={0.02}
          speed={0.7}
          color="#22d3ee"
          tilt={[0.4, 0.2, 0.1]}
        />
        <OrbitalRing
          radius={2.05}
          tube={0.018}
          speed={-0.5}
          color="#a78bfa"
          tilt={[-0.5, 0.3, -0.4]}
        />
        <OrbitalRing
          radius={2.4}
          tube={0.015}
          speed={0.9}
          color="#06b6d4"
          tilt={[0.2, -0.6, 0.5]}
        />
        <FloatingNodes />
        <ParticleCloud count={compact ? 50 : 100} />
      </Float>
    </group>
  );
};

interface SecuritySceneProps {
  className?: string;
  compact?: boolean;
}

export const SecurityScene: React.FC<SecuritySceneProps> = ({
  className = '',
  compact = false,
}) => {
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());

  if (!webglSupported) {
    return <SceneFallback compact={compact} label="Security Core Simulation" />;
  }

  return (
    <div
      className={`relative w-full overflow-hidden ${
        compact ? 'h-52' : 'h-80 md:h-96'
      } ${className}`}
    >
      <WebGLErrorBoundary fallback={<SceneFallback compact={compact} />}>
        <Canvas
          camera={{ position: [0, 0, compact ? 5 : 5.4], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 5, 3]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-4, -3, 2]} intensity={2.5} color="#22d3ee" />
          <pointLight position={[3, 3, -2]} intensity={2} color="#a78bfa" />

          <InteractiveSceneGroup compact={compact} />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
