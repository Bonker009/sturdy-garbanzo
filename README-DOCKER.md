# Docker Setup for Lucky Draw Application

This guide explains how to run the Lucky Draw application using Docker Compose.

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)

## Quick Start

1. **Build and start the application:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

4. **Rebuild after code changes:**
   ```bash
   docker-compose up -d --build
   ```

## Accessing the Application

Once the container is running, access the application at:
- **Main Application:** http://localhost:3001
- **Admin Dashboard:** http://localhost:3001/admin

## Data Persistence

The following directories are mounted as volumes to persist data:
- `./data` - Stores rewards.json
- `./public/rewards` - Stores uploaded reward images
- `./public/background` - Stores uploaded background images

These directories will be created automatically if they don't exist.

**Important:** If you encounter permission issues with file uploads, ensure the directories exist on the host and have proper permissions:

```bash
# Create directories with proper permissions
mkdir -p data public/rewards public/background
chmod -R 775 data public/rewards public/background
```

Or let Docker create them automatically - the entrypoint script will set the correct permissions.

## Environment Variables

You can customize the application by creating a `.env` file or modifying the `environment` section in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

## Auto-Restart Policy

The container is configured with `restart: always`, which means:
- The container will automatically restart if it stops unexpectedly
- The container will restart automatically after a Docker daemon restart
- The container will restart even if it exits with a non-zero exit code

To manually stop the container without auto-restart, use:
```bash
docker-compose stop lucky-draw
```

## Health Check

The container includes a health check that verifies the application is running. Check the health status with:

```bash
docker-compose ps
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs lucky-draw`
- Verify port 3000 is not in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Data not persisting
- Ensure the volume directories exist and have proper permissions
- Check that volumes are correctly mounted in `docker-compose.yml`

### Build fails
- Clear Docker cache: `docker system prune -a`
- Rebuild without cache: `docker-compose build --no-cache`

### Cannot upload images
If you're getting permission errors when uploading images:

1. **Check container logs:**
   ```bash
   docker-compose logs lucky-draw | grep -i "permission\|error\|upload"
   ```

2. **Verify directory permissions on host:**
   ```bash
   ls -la data public/rewards public/background
   ```

3. **Fix permissions manually (if needed):**
   ```bash
   sudo chown -R $USER:$USER data public/rewards public/background
   sudo chmod -R 775 data public/rewards public/background
   ```

4. **Restart the container:**
   ```bash
   docker-compose restart lucky-draw
   ```

5. **Check entrypoint script ran correctly:**
   ```bash
   docker-compose exec lucky-draw ls -la /app/public/rewards
   docker-compose exec lucky-draw ls -la /app/public/background
   ```

6. **If still having issues, exec into container and check:**
   ```bash
   docker-compose exec lucky-draw sh
   # Inside container:
   id
   ls -la /app/public/rewards
   touch /app/public/rewards/test.txt
   ```

## Development Mode

For development, you can still use:
```bash
npm run dev
```

The Docker setup is optimized for production use.

