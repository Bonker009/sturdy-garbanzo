#!/bin/sh
set -e

# Fix permissions for mounted volumes
# This ensures the nextjs user (uid 1001) can write to mounted directories
if [ -d "/app/data" ]; then
  chown -R nextjs:nodejs /app/data 2>/dev/null || true
  chmod -R 775 /app/data 2>/dev/null || true
fi

if [ -d "/app/public/rewards" ]; then
  chown -R nextjs:nodejs /app/public/rewards 2>/dev/null || true
  chmod -R 775 /app/public/rewards 2>/dev/null || true
fi

if [ -d "/app/public/background" ]; then
  chown -R nextjs:nodejs /app/public/background 2>/dev/null || true
  chmod -R 775 /app/public/background 2>/dev/null || true
fi

# Create directories if they don't exist
mkdir -p /app/data /app/public/rewards /app/public/background
chown -R nextjs:nodejs /app/data /app/public/rewards /app/public/background
chmod -R 775 /app/data /app/public/rewards /app/public/background

# Switch to nextjs user for running the application
exec su-exec nextjs "$@"

