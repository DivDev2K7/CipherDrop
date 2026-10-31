# 🛡️ CipherDrop

> **Zero-Trust Ephemeral File Transfer System**  
> Share sensitive files securely with automated self-destruction, strict download quotas, cryptographic passkey protection, and real-time security governance telemetry.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📖 Overview

**CipherDrop** is an ephemeral, zero-trust digital file transfer platform designed to share sensitive assets without leaving a permanent digital footprint. Inspired by security-focused transfer tools like Firefox Send and SendSafely, CipherDrop enforces multi-layered access constraints:

- ⏳ **Time-To-Live (TTL) Expiration**: Automated file shredding after a configurable window (1 Hour, 24 Hours, or 7 Days).
- 💥 **Strict Download Quotas**: Enforce maximum download counts, including **Burn After Reading** (single download self-destruct).
- 🔑 **Cryptographic Passkey Verification**: Optional recipient password challenge secured by Argon2id/bcrypt key derivation and constant-time string verification to prevent timing side-channel attacks.
- 🌐 **3D Cyberpunk Visualization**: Interactive 3D WebGL shield core, orbital telemetry rings, and interactive encryption cubes powered by Three.js and React Three Fiber.
- 📊 **Security Governance Dashboard**: Real-time telemetry monitoring active shares, download volumes, tamper-evident audit logs, and one-click instant revocation.
- 🧹 **Automated Background Garbage Collector**: Node-cron worker that continuously shreds expired files and wipes associated database records.
- ☁️ **Hybrid Storage Engine**: Modular storage layer supporting local encrypted disk storage as well as production-ready AWS S3 and CloudFront integration.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 19 + Vite + Three.js)"]
        UI["Upload / Download UI"]
        GL["3D Cyber Shield Visualizer"]
        Dash["Security Telemetry Dashboard"]
    end

    subgraph Gateway ["Nginx / API Gateway"]
        Proxy["Reverse Proxy (Port 80/443)"]
    end

    subgraph Backend ["Backend API (Node.js + Express + TypeScript)"]
        Routes["REST Endpoints (/api/v1)"]
        Cron["Automated Cleanup Cron Worker"]
        CryptoLib["Crypto Engine (Constant-Time Compare, Argon2id)"]
    end

    subgraph Storage ["Data & Storage Layer"]
        PG[("PostgreSQL Database (Prisma ORM)")]
        Redis[("Redis Cache / Fallback")]
        Disk[("Local Uploads / AWS S3 Bucket")]
    end

    UI --> Proxy
    Dash --> Proxy
    Proxy --> Routes
    Routes --> CryptoLib
    Routes --> PG
    Routes --> Redis
    Routes --> Disk
    Cron --> Disk
    Cron --> PG
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei)
- **Animations**: [Motion](https://motion.dev/)
- **Icons & QR**: [Lucide React](https://lucide.dev/), [qrcode.react](https://github.com/zpao/qrcode.react)
- **Linting**: [Oxlint](https://oxc.rs/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Server Framework**: [Express](https://expressjs.com/) with TypeScript
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Authentication & Security**: [Helmet](https://helmetjs.github.io/), CORS, `bcrypt`, `crypto.timingSafeEqual`
- **File Handling**: [Multer](https://github.com/expressjs/multer)
- **Scheduled Jobs**: [node-cron](https://github.com/node-cron/node-cron)
- **Cloud Integration**: AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Testing**: [Vitest](https://vitest.dev/)

### DevOps & Infrastructure
- **Containerization**: Multi-stage [Docker](https://www.docker.com/) & Docker Compose
- **Web Server**: [Nginx](https://nginx.org/)
- **Tunneling**: [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- **Cloud Infrastructure**: AWS CDK (TypeScript)

---

## 📂 Project Structure

```
CipherDrop/
├── public/                     # Static assets and video backgrounds
│   ├── favicon.svg
│   ├── icons.svg
│   └── videos/                 # Cinematic hero & security clips
├── src/                        # React Frontend Source
│   ├── assets/                 # Brand images and vectors
│   ├── components/             # Reusable UI & Feature components
│   │   ├── 3d/                 # Three.js 3D Cyber scenes & fallback
│   │   ├── dashboard/          # Governance dashboard & audit telemetry
│   │   ├── download/           # Recipient decryption & download portal
│   │   ├── ui/                 # Buttons, cards, navbar, hero, footer
│   │   └── upload/             # File upload workspace & share dialog
│   ├── services/               # Frontend API client
│   ├── types/                  # Shared TypeScript interfaces
│   ├── utils/                  # Animation configs and helper routines
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Client entrypoint
├── server/                     # Backend API & Infrastructure
│   ├── infrastructure/         # AWS CDK CloudFormation deployment stack
│   ├── prisma/                 # Database schema & migrations
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/                    # Backend Source
│   │   ├── jobs/               # Background cron workers (cleanup)
│   │   ├── lib/                # Crypto, Prisma client, Redis, Storage, S3
│   │   ├── routes/             # REST endpoints (shares, download, dashboard)
│   │   ├── types/              # Server-side TypeScript interfaces
│   │   ├── app.ts              # Express application configuration
│   │   └── index.ts            # Server entrypoint & port listener
│   ├── tests/                  # Backend unit & integration test suites
│   ├── Dockerfile              # Backend production container
│   ├── Dockerfile.frontend     # Frontend Nginx production container
│   ├── docker-compose.yml      # Full-stack orchestrator
│   ├── nginx.conf              # Reverse proxy configuration
│   └── dev-up.sh               # One-click Docker bootstrap script
├── .env.example                # Frontend environment template
├── .gitignore                  # Git exclusions
├── package.json                # Frontend package configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite build setup
```

---

## ⚡ Quick Start

### Option 1: Run with Docker Compose (Recommended)

The easiest way to start the entire stack (PostgreSQL, Redis, Backend, Frontend, and Cloudflare Tunnel) is using Docker:

```bash
# Clone the repository
git clone https://github.com/DivDev2K7/CipherDrop.git
cd CipherDrop

# Launch the full stack
cd server
chmod +x dev-up.sh && ./dev-up.sh
# Alternatively: docker compose up -d --build
```

The services will be available at:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

To view container logs or stop the stack:
```bash
docker compose logs -f
docker compose down
```

---

### Option 2: Run Manually (Local Development)

#### 1. Prerequisites
- **Node.js** v20+
- **PostgreSQL** instance running locally or in Docker

#### 2. Configure Backend
```bash
cd server

# Copy environment template
cp .env.example .env

# Install backend dependencies
npm install

# Run database migrations
npm run db:migrate

# Start backend in development mode
npm run dev
```

#### 3. Configure Frontend
Open a new terminal window at the project root:
```bash
# Copy environment template
cp .env.example .env

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

### Frontend (`.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE` | Base URL for API requests | `/api/v1` |

### Backend (`server/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP port | `3001` |
| `HOST` | Bind host address | `0.0.0.0` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/cipherdrop` |
| `REDIS_URL` | Redis URL for caching (optional) | `""` |
| `UPLOAD_DIR` | Local disk upload storage directory | `./uploads` |
| `BASE_URL` | Public base URL used for share link generation | `http://localhost:5173` |
| `AWS_REGION` | AWS Region for S3 storage (optional) | `""` |
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID (optional) | `""` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key (optional) | `""` |
| `S3_BUCKET` | AWS S3 Bucket Name (optional) | `""` |
| `CLOUDFRONT_DOMAIN` | CloudFront distribution domain (optional) | `""` |

---

## 📡 REST API Reference

All API routes are prefixed with `/api/v1`:

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/shares` | Generate share metadata & access token | JSON `{ filename, fileSize, fileType, expiryHours, maxDownloads, password? }` |
| `POST` | `/shares/:code/upload` | Upload physical file payload | Multipart `FormData` (`file`) |
| `GET` | `/download/:code` | Retrieve file metadata & verify passkey | Query / Header `x-password` |
| `POST` | `/download/:code` | Validate password & stream file download | JSON `{ password? }` |
| `GET` | `/dashboard/stats` | Retrieve real-time telemetry metrics | *None* |
| `GET` | `/dashboard/shares` | List active, expired, and revoked shares | Query `?status=&search=` |
| `DELETE` | `/shares/:code` | Instantly revoke and shred a transfer | *None* |
| `GET` | `/health` | API health check status | *None* |

---

## 🧪 Running Tests & Quality Checks

```bash
# Run backend test suite (unit + integration)
cd server
npm test

# Run frontend build verification
cd ..
npm run build

# Run fast code linting via Oxlint
npm run lint
```

---

## 🔒 Security Architecture

1. **Zero-Trust Access Control**: Transfers are keyed to random, high-entropy unique share codes (`SEC-XXXX-XXXX`). Files cannot be indexed or enumerated.
2. **Timing Oracle Resistance**: Password verification uses cryptographic constant-time comparison buffers (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.
3. **Automated Destruction**: When a file reaches its maximum download quota or expiration timestamp, the background worker automatically deletes the physical asset from disk/S3 and flags the database record as `expired` or `limit-reached`.
4. **Instant Revocation**: Senders can immediately revoke an active transfer from the governance dashboard, triggering an immediate purge.
5. **Tamper-Evident Audit Trail**: Every creation, download attempt, password failure, and revocation event is logged with timestamp, status, and IP address.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
