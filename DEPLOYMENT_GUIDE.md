# CipherDrop AWS Deployment Guide

## Overview

This guide covers deploying the CipherDrop zero-trust file transfer system to AWS with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                 │
│  ┌──────────────────┐    ┌─────────────────────────────────┐   │
│  │   CloudFront     │    │          ECS Cluster            │   │
│  │   (Frontend)     │    │  ┌──────────────────────────┐   │   │
│  │  S3 + CDN        │    │  │   Fargate Service        │   │   │
│  │  HTTPS + SPA     │◄───┤  │   Backend API (port 3001)│   │   │
│  └──────────────────┘    │  └──────────────────────────┘   │   │
│                          │  ┌──────────────────────────┐   │   │
│  ┌──────────────────┐    │  │   Application Load       │   │   │
│  │   S3 Bucket      │    │  │   Balancer (ALB)         │   │   │
│  │   (File Storage) │◄───┤  └──────────────────────────┘   │   │
│  │  Pre-signed URLs │    └─────────────────────────────────┘   │
│  └──────────────────┘           ▲                ▲            │
│                                 │                │            │
│                    ┌────────────┴──────┐  ┌─────┴──────┐      │
│                    │      RDS          │  │ ElastiCache │      │
│                    │   PostgreSQL      │  │    Redis    │      │
│                    └───────────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS CLI** configured with admin credentials
   ```bash
   aws configure
   aws sts get-caller-identity  # Verify
   ```

2. **Node.js 20+** and **Docker** installed locally

3. **AWS CDK** installed globally
   ```bash
   npm install -g aws-cdk@2.150.0
   ```

4. (Optional) **Route 53 hosted zone** for custom domain

## Quick Start (Development)

```bash
cd server
./dev-up.sh
```

This starts:
- Frontend at `http://localhost:5173`
- Backend API at `http://localhost:3001`
- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`

## Production Deployment

### 1. Set up AWS secrets (required for S3 access)

```bash
# Store AWS credentials in Parameter Store (secure)
aws ssm put-parameter \
  --name /cipherdrop/aws/access-key-id \
  --value "YOUR_AWS_ACCESS_KEY_ID" \
  --type SecureString

aws ssm put-parameter \
  --name /cipherdrop/aws/secret-access-key \
  --value "YOUR_AWS_SECRET_ACCESS_KEY" \
  --type SecureString
```

### 2. Deploy infrastructure

```bash
cd server/infrastructure

# Option A: Deploy without custom domain (uses AWS-generated URLs)
./deploy-aws.sh production

# Option B: Deploy with custom domain
./deploy-aws.sh production cipherdrop.example.com Z123456789ABCDEF
```

### 3. Post-deployment

After deployment, CDK outputs:
- `FrontendUrl` — CloudFront distribution URL
- `BackendUrl` — ALB URL for API
- `FilesBucketName` — S3 bucket name
- `DatabaseEndpoint` — RDS endpoint
- `RedisEndpoint` — ElastiCache endpoint

**Important**: Restart the ECS service to pick up the Parameter Store secrets:
```bash
aws ecs update-service \
  --cluster cipherdrop-cluster \
  --service cipherdrop-backend \
  --force-new-deployment
```

### 4. Verify deployment

```bash
# Health check
curl https://<BackendUrl>/api/v1/health
# Expected: {"status":"ok"}

# Frontend loads
curl https://<FrontendUrl>
# Expected: HTML with <div id="root">
```

## Architecture Details

### Database: PostgreSQL (RDS)

**Why PostgreSQL?**
- ACID compliance for share metadata integrity
- Native UUID support (used for share IDs)
- JSONB for flexible activity log details
- Mature, battle-tested, cost-effective

**Configuration:**
- Instance: `db.t3.micro` (dev) / `db.t3.small` (prod)
- Multi-AZ: Yes (production)
- Encryption: At rest + in transit
- Backups: 7-day retention
- Connection pooling: Use `pgbouncer` for production scale

### File Storage: S3 + CloudFront

**S3 Bucket:**
- Encryption: SSE-S3 (AES-256)
- Versioning: Enabled
- Block public access: Yes
- Lifecycle: Abort incomplete multipart uploads after 1 day

**Pre-signed URLs:**
- Upload (PUT): 5 minutes validity
- Download (GET): 60 seconds after password verification
- Direct client-to-S3: No file passes through backend

### Caching: ElastiCache Redis

**Usage:**
- Atomic download counters (Lua script)
- Rate limiting (optional)
- Session storage (future)

**Configuration:**
- Node type: `cache.t3.micro` (dev) / `cache.t3.small` (prod)
- Encryption: At rest + in transit
- Auth token: Required for production

### Compute: ECS Fargate

**Backend service:**
- CPU: 256 vCPU
- Memory: 512 MiB
- Desired count: 1 (dev) / 2+ (prod)
- Auto-scaling: Target tracking on CPU > 70%

**Frontend:**
- Static files served via Nginx in S3 + CloudFront
- No ECS service needed (cheaper, faster)

### Networking

- VPC with 2 AZs
- Public subnets: ALB, NAT Gateway
- Private subnets: ECS tasks
- Isolated subnets: RDS, ElastiCache
- Security groups: Least privilege between tiers

## Environment Variables

| Variable | Dev | Production |
|----------|-----|------------|
| `DATABASE_URL` | `file:./dev.db` (SQLite) | `postgresql://user:pass@host:5432/cipherdrop` |
| `REDIS_URL` | `""` (fallback to DB) | `redis://host:6379` |
| `AWS_REGION` | `""` | `us-east-1` |
| `S3_BUCKET` | `""` | `cipherdrop-files-<account>-<region>` |
| `BASE_URL` | `http://localhost:3001` | `https://api.yourdomain.com` |
| `NODE_ENV` | `development` | `production` |

## Cost Estimate (us-east-1, monthly)

| Component | Dev | Production |
|-----------|-----|------------|
| ECS Fargate (1 task) | ~$10 | ~$25 |
| ALB | ~$18 | ~$18 |
| RDS db.t3.micro | ~$13 | ~$30 (t3.small, Multi-AZ) |
| ElastiCache t3.micro | ~$12 | ~$25 (t3.small) |
| S3 (10GB storage + requests) | ~$0.50 | ~$2 |
| CloudFront (1TB transfer) | ~$0 | ~$85 |
| Data transfer | ~$0 | ~$10 |
| **Total** | **~$54/mo** | **~$195/mo** |

*Use AWS Free Tier for first 12 months where applicable.*

## Security Checklist

- [ ] HTTPS enforced everywhere (ALB + CloudFront)
- [ ] Security groups: least privilege
- [ ] S3: no public access, bucket policies for pre-signed URLs only
- [ ] RDS: private subnets, no public endpoint
- [ ] Redis: auth token, in-transit encryption
- [ ] Parameter Store: secrets encrypted
- [ ] ECS: non-root user, read-only root filesystem
- [ ] CSP headers via Helmet
- [ ] Rate limiting on API endpoints

## Scaling Considerations

### Horizontal Scaling
- ECS service auto-scaling on CPU/memory
- ALB distributes requests
- Redis handles atomic counters across instances
- S3 is inherently scalable

### Database
- Read replicas for dashboard queries
- Connection pooling (PgBouncer)
- Partition shares by `createdAt` for large datasets

### File Uploads
- Pre-signed URLs eliminate backend bottleneck
- Multipart uploads for >100MB files (future)

## Monitoring & Observability

```bash
# CloudWatch Logs
aws logs tail /aws/ecs/cipherdrop --follow

# Metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=cipherdrop-backend \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average
```

## Disaster Recovery

- **RDS**: Automated backups (7 days), point-in-time recovery
- **S3**: Versioning + cross-region replication (production)
- **Redis**: Multi-AZ with automatic failover
- **ECS**: Blue/green deployments via ALB

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend health check fails | Check security groups, ensure port 3001 open |
| S3 pre-signed URLs fail | Verify IAM role has `s3:PutObject`/`GetObject` on bucket |
| Database connection timeout | Check RDS security group allows ECS SG on 5432 |
| Redis connection refused | Check ElastiCache security group allows ECS SG on 6379 |
| Frontend shows blank page | Check CloudFront error responses (403/404 → index.html) |
| CORS errors | Verify `BASE_URL` matches frontend origin |

## Cleanup

```bash
cd server/infrastructure
npx cdk destroy
```

**Note**: RDS and S3 buckets have `RemovalPolicy.RETAIN` by default. Delete manually:
```bash
aws rds delete-db-instance --db-instance-identifier cipherdrop-db --skip-final-snapshot
aws s3 rb s3://cipherdrop-files-<account>-<region> --force
```

---

## Files Created for AWS Deployment

| File | Purpose |
|------|---------|
| `server/Dockerfile` | Backend container image |
| `server/Dockerfile.frontend` | Frontend + Nginx image |
| `server/nginx.conf` | SPA routing + static caching |
| `server/docker-compose.yml` | Local dev stack (PostgreSQL + Redis + Backend + Frontend) |
| `server/infrastructure/cdk-stack.ts` | Full AWS infrastructure as code |
| `server/infrastructure/deploy-aws.sh` | One-command deployment script |
| `server/dev-up.sh` | Local development startup |
| `server/src/lib/s3.ts` | S3 client + pre-signed URL generation |
| `server/src/lib/storage.ts` | Unified local/S3 storage abstraction |
| `server/src/routes/upload.ts` | Returns pre-signed PUT URL when S3 enabled |
| `server/src/routes/download.ts` | Returns pre-signed GET URL (60s) when S3 enabled |

---

## Next Steps

1. **Test locally with Docker Compose**: `cd server && ./dev-up.sh`
2. **Configure AWS credentials** in Parameter Store
3. **Deploy to AWS**: `cd server/infrastructure && ./deploy-aws.sh production`
4. **Verify end-to-end**: Create share → Upload file → Download via pre-signed URL
5. **Add custom domain** (optional): Point Route 53 to CloudFront + ALB
6. **Enable monitoring**: CloudWatch dashboards + alerts

The system is production-ready with zero-trust security, atomic counters, and AWS-native architecture.