# Worker Management Commands

Quick reference for managing the extraction worker on the Linode server.

## Initial Setup

```bash
# 1. Deploy worker files from your local machine
./deploy/deploy-worker.sh

# 2. SSH to Linode
ssh root@onestowatch

# 3. Edit environment variables
cd ~/otw-radio-worker
nano .env

# Set:
# - APP_URL=https://your-vercel-app.vercel.app
# - WORKER_TOKEN=<generate with command below>

# Generate WORKER_TOKEN:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Test SFTP connection
sftp -P 2022 -i sftp_key azuracast@localhost
# Should connect successfully, then type: exit

# 5. Build and start
docker-compose build
docker-compose up -d
```

## Daily Operations

```bash
# View logs (follow mode)
docker-compose logs -f

# View recent logs
docker-compose logs --tail=100

# Check status
docker-compose ps

# Restart worker
docker-compose restart

# Stop worker
docker-compose down

# Start worker
docker-compose up -d
```

## Updates

```bash
# When worker code changes, re-deploy:
# From your local machine:
./deploy/deploy-worker.sh

# Then on Linode:
cd ~/otw-radio-worker
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

```bash
# Check disk space
df -h /tmp

# Check if worker is running
docker ps | grep otw-radio-worker

# View worker container logs
docker logs otw-radio-worker

# Check SFTP connection
sftp -P 2022 -i sftp_key azuracast@localhost

# Test ffmpeg availability
docker exec otw-radio-worker ffmpeg -version

# Check temp directory
ls -lh /tmp/extraction/

# Manual cleanup (if needed)
rm -rf /tmp/extraction/*
```

## Environment Variables

The worker uses these settings from `.env`:

- `APP_URL` - Your Next.js app URL (where to poll for jobs)
- `WORKER_TOKEN` - Shared secret for authentication
- `SFTP_HOST` - Usually `localhost`
- `SFTP_PORT` - Usually `2022`
- `SFTP_USER` - Usually `azuracast`
- `SFTP_PRIVATE_KEY_PATH` - Path to SSH key (mounted by Docker)
- `RADIO_FOLDER` - Where to save files (default: `aimc`)