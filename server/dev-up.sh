#!/bin/bash
# Local development with Docker Compose
# Usage: ./dev-up.sh

set -e

echo "🐳 Starting CipherDrop local development stack..."

docker compose -f docker-compose.yml up -d --build

echo ""
echo "✅ Services started:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   PostgreSQL: localhost:5432 (user: cipherdrop, pass: cipherdrop)"
echo "   Redis:    localhost:6379"
echo ""
echo "📝 View logs: docker compose -f docker-compose.yml logs -f"
echo "🛑 Stop:      docker compose -f docker-compose.yml down"