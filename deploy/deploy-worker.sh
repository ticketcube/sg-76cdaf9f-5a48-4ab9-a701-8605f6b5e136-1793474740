#!/bin/bash
set -e

# OTW Radio Worker Deployment Script
# Deploys the extraction worker to the Linode server

LINODE_HOST="${LINODE_HOST:-root@onestowatch}"
WORKER_DIR="$HOME/otw-radio-worker"

echo "=== OTW Radio Worker Deployment ==="
echo "Target: $LINODE_HOST"
echo ""

# Step 1: Create worker directory on Linode
echo "Step 1: Creating worker directory..."
ssh "$LINODE_HOST" "mkdir -p $WORKER_DIR/src"

# Step 2: Copy worker files
echo "Step 2: Copying worker files..."
scp worker/package.json "$LINODE_HOST:$WORKER_DIR/"
scp worker/tsconfig.json "$LINODE_HOST:$WORKER_DIR/"
scp worker/Dockerfile "$LINODE_HOST:$WORKER_DIR/"
scp worker/docker-compose.yml "$LINODE_HOST:$WORKER_DIR/"
scp worker/src/index.ts "$LINODE_HOST:$WORKER_DIR/src/"
scp worker/README.md "$LINODE_HOST:$WORKER_DIR/"
scp worker/.gitignore "$LINODE_HOST:$WORKER_DIR/"
scp worker/.dockerignore "$LINODE_HOST:$WORKER_DIR/"

# Step 3: Generate SFTP key if it doesn't exist
echo "Step 3: Setting up SFTP key..."
ssh "$LINODE_HOST" << 'EOF'
cd ~/otw-radio-worker

if [ ! -f sftp_key ]; then
  echo "Generating new SFTP key..."
  ssh-keygen -t ed25519 -f sftp_key -N "" -C "otw-radio-worker"
  
  # Add public key to authorized_keys
  cat sftp_key.pub >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  
  echo "✓ SFTP key generated and added to authorized_keys"
else
  echo "✓ SFTP key already exists"
fi
EOF

# Step 4: Create .env file template
echo "Step 4: Creating .env template..."
ssh "$LINODE_HOST" << 'EOF'
cd ~/otw-radio-worker

if [ ! -f .env ]; then
  cat > .env << 'ENVFILE'
# App connection
APP_URL=https://your-vercel-app.vercel.app
WORKER_TOKEN=generate_with_command_below

# SFTP settings (for uploading to AzuraCast)
SFTP_HOST=localhost
SFTP_PORT=2022
SFTP_USER=azuracast
SFTP_PRIVATE_KEY_PATH=/run/secrets/sftp_key
RADIO_FOLDER=aimc
ENVFILE

  echo ""
  echo "⚠️  .env file created. You MUST edit it with:"
  echo "    1. APP_URL - Your Vercel app URL"
  echo "    2. WORKER_TOKEN - Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  echo ""
  echo "    Run: nano ~/otw-radio-worker/.env"
else
  echo "✓ .env file already exists"
fi
EOF

# Step 5: Show next steps
cat << 'NEXTSTEPS'

=== Deployment Complete ===

Next steps on the Linode server:

1. Edit the .env file:
   ssh root@onestowatch
   cd ~/otw-radio-worker
   nano .env
   
   Set:
   - APP_URL to your Vercel app URL
   - WORKER_TOKEN (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

2. Add the same WORKER_TOKEN to your app's .env.local:
   WORKER_TOKEN=same_token_as_worker

3. Verify SFTP access:
   sftp -P 2022 -i sftp_key azuracast@localhost
   (should connect successfully, then type 'exit')

4. Build and start the worker:
   cd ~/otw-radio-worker
   docker-compose build
   docker-compose up -d

5. Check logs:
   docker-compose logs -f

6. To stop the worker:
   docker-compose down

NEXTSTEPS
</thinking>

chmod +x deploy/deploy-worker.sh

echo ""
echo "✓ Deployment script created: deploy/deploy-worker.sh"
echo ""
echo "To deploy the worker to Linode, run:"
echo "  ./deploy/deploy-worker.sh"