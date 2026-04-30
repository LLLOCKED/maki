#!/bin/sh
set -e

echo "🚀 Running Prisma migrations..."
node ./node_modules/prisma/build/index.js db execute --file prisma/production-repair.sql --schema prisma/schema.prisma
node ./node_modules/prisma/build/index.js migrate deploy

echo "🚀 Starting Next.js..."
node server.js
