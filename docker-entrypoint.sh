#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Create directories if they don't exist (before mounting volumes)
mkdir -p /app/data /app/public/rewards /app/public/background

# Fix permissions for mounted volumes
# This ensures the nextjs user (uid 1001) can write to mounted directories
echo "Setting permissions for /app/data..."
if [ -d "/app/data" ]; then
  chown -R nextjs:nodejs /app/data 2>/dev/null || true
  chmod -R 775 /app/data 2>/dev/null || true
  ls -la /app/data || true
fi

echo "Setting permissions for /app/public/rewards..."
if [ -d "/app/public/rewards" ]; then
  chown -R nextjs:nodejs /app/public/rewards 2>/dev/null || true
  chmod -R 775 /app/public/rewards 2>/dev/null || true
  ls -la /app/public/rewards || true
fi

echo "Setting permissions for /app/public/background..."
if [ -d "/app/public/background" ]; then
  chown -R nextjs:nodejs /app/public/background 2>/dev/null || true
  chmod -R 775 /app/public/background 2>/dev/null || true
  ls -la /app/public/background || true
fi

# Ensure directories exist and have correct permissions
echo "Creating and setting final permissions..."
mkdir -p /app/data /app/public/rewards /app/public/background
chown -R nextjs:nodejs /app/data /app/public/rewards /app/public/background 2>/dev/null || true
chmod -R 775 /app/data /app/public/rewards /app/public/background 2>/dev/null || true

# Verify permissions
echo "Verifying permissions..."
id nextjs || true
ls -ld /app/data /app/public/rewards /app/public/background || true

echo "Switching to nextjs user and starting application..."
# Switch to nextjs user for running the application
exec su-exec nextjs "$@"

