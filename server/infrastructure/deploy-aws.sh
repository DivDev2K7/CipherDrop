#!/bin/bash
# CipherDrop AWS Deployment Script
# Usage: ./deploy-aws.sh [environment] [domain] [hosted-zone-id]
# Example: ./deploy-aws.sh production cipherdrop.example.com Z123456789

set -e

ENVIRONMENT=${1:-production}
DOMAIN=${2:-}
HOSTED_ZONE_ID=${3:-}

echo "🚀 Deploying CipherDrop to AWS ($ENVIRONMENT)"

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found. Install it first."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx not found."; exit 1; }

# Verify AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo "❌ AWS credentials not configured. Run 'aws configure'."; exit 1; }

# Build frontend
echo "📦 Building frontend..."
cd ../
npm run build

# Build backend
echo "📦 Building backend..."
cd server
npm run build

# Build infrastructure
echo "🏗️  Building CDK infrastructure..."
cd infrastructure
npm ci
npm run build

# Deploy
echo "☁️  Deploying to AWS..."
if [ -n "$DOMAIN" ] && [ -n "$HOSTED_ZONE_ID" ]; then
  npx cdk deploy --context domain=$DOMAIN --context hostedZoneId=$HOSTED_ZONE_ID --require-approval never
else
  npx cdk deploy --require-approval never
fi

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure AWS credentials in Parameter Store:"
echo "   aws ssm put-parameter --name /cipherdrop/aws/access-key-id --value 'YOUR_KEY' --type SecureString"
echo "   aws ssm put-parameter --name /cipherdrop/aws/secret-access-key --value 'YOUR_SECRET' --type SecureString"
echo "2. Update the ECS service to pick up the new secrets (restart task)"
echo "3. Visit the CloudFront URL for the frontend"
echo "4. Backend API is available at the ALB URL"