# CipherDrop — Zero-Trust Temporary File Transfer System

> **CipherDrop** is a zero-trust, temporary digital file transfer system designed for sharing sensitive assets securely without leaving a permanent digital footprint. Inspired by platforms like Firefox Send and SendSafely, it enforces strict access limits including time-based expiration, strict download caps, and optional passkey protection.

---

## ✨ Features

- **Cinematic Video Hero**: Full-width cinematic eagle-to-secure-file transformation background with responsive dark gradient overlays.
- **3D Cybersecurity Visuals**: Reusable 3D security shield core with multi-speed orbital rings, particle cloud, and responsive pointer physics powered by **React Three Fiber** and **Drei**.
- **Ephemeral File-Upload Workspace**:
  - Drag-and-drop file upload with format and size validation.
  - 3D encrypted data cube visualizer that spins with upload activity.
  - Multi-tier Time-To-Live (TTL): 1 Hour, 24 Hours, 7 Days.
  - Download quota limits: 1 (Burn after read), 5, 10, Unlimited.
  - Client-side password protection with Argon2id parameter simulation.
  - Multi-stage encrypted upload simulation.
- **Polished Share-Link Experience**:
  - Read-only share link with instant copy-to-clipboard feedback.
  - QR Code generation for seamless peer and mobile handshakes.
  - Real-time countdown timer to automatic shredding.
  - Download count and password protection indicators.
- **Recipient Download Portal**:
  - Interactive state tester to simulate **Active**, **Password-Protected**, **Expired**, **Limit-Reached**, and **Invalid** transfer links.
  - Password decryption challenge with error handling.
  - In-memory decryption buffer simulation with harmless sample file download.
- **Security Governance Dashboard**:
  - Overview KPI metrics: Active Shares, Total Downloads, Expiring Soon, Password Protected.
  - Live animated digital security shield background & telemetry HUD.
  - Interactive shared files table with search, status filters, copy actions, and instant token revocation.
  - Tamper-evident cryptographic audit log feed.
- **Backend Readiness**:
  - Decoupled API service layer (`src/services/api.ts`) ready for integration with Node.js, Express, TypeScript, Prisma, and SQLite.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (v4)
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Animations**: Motion for React (`motion/react`)
- **Icons**: Lucide React
- **QR Codes**: `qrcode.react`
- **Linting**: Oxlint

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/DivDev2K7/CipherDrop.git
cd CipherDrop

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
# Typecheck and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔒 Security Architecture (Zero-Trust Simulation)

- **In-Memory Ephemeral Storage**: Files and buffers are held client-side in memory and destroyed when the expiry or download limit is triggered.
- **Client-Side Derivation**: Plaintext decryption keys never touch a persistent server disk.
- **Automated Burn-After-Reading**: Cryptographic headers are wiped permanently upon reaching download thresholds.

---

## 📄 License

MIT License &copy; 2026 Vibin Shriyas
