# Worker Deployment Guide

Simple step-by-step guide to deploy the extraction worker to your Linode server.

## Prerequisites

- Your Linode IP address or domain (e.g., `123.456.789.012` or `radio.onestowatch.com`)
- SSH access to the Linode as root
- Your Vercel app URL (e.g., `https://otwhm.vercel.app`)

---

## Part 1: From Your Laptop

**1. Open a terminal on your laptop** (NOT the SSH session)

**2. Navigate to your project:**
```bash
cd /path/to/your/otw-radio-project
```

**3. Set your Linode address and run the deployment script:**
```bash
# Replace with your actual Linode IP or domain
export LINODE_HOST="root@123.456.789.012"

# Run the deployment script
chmod +x deploy/deploy-worker.sh
./deploy/deploy-worker.sh
```

The script will:
- Copy all worker files to the Linode
- Generate an SFTP key for the worker
- Create a `.env` template

---

## Part 2: On the Linode

**1. SSH to your Linode:**
```bash
ssh root@123.456.789.012
```

**2. Go to the worker directory:**
```bash
cd ~/otw-radio-worker
```

**3. Generate a worker token:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (a long random string).

**4. Edit the .env file:**
```bash
nano .env
```

Replace the placeholders:
```bash
APP_URL=https://your-actual-vercel-app.vercel.app
WORKER_TOKEN=paste_the_token_you_just_generated
```

Save (Ctrl+O, Enter) and exit (Ctrl+X).

**5. Test SFTP connection:**
```bash
sftp -P 2022 -i sftp_key azuracast@localhost
```

You should see `Connected to localhost`. Type `exit` to quit.

**6. Build and start the worker:**
```bash
docker-compose build
docker-compose up -d
```

**7. Check that it's running:**
```bash
docker-compose logs -f
```

You should see:
```
Worker started
App URL: https://your-app.vercel.app
SFTP: azuracast@localhost:2022
Radio folder: aimc
```

Press Ctrl+C to stop watching logs (worker keeps running).

---

## Part 3: In Your App

**1. Add the WORKER_TOKEN to your app's environment:**

In your Vercel project settings (or `.env.local` for local development):
```bash
WORKER_TOKEN=same_token_as_worker
```

**2. Also make sure these are set:**
```bash
AIMC_API_KEY=9XXX  # Uncomment your existing key
AIMC_UPLOAD_CONNECTOR_ID=115b2c89-246f-4d8f-8c83-71fd7fe77644
AIMC_UPLOAD_FOLDER=OTW/OTWL_Audio
```

**3. Redeploy your app** (if using Vercel, just push to git)

---

## Testing It Works

1. Go to your app: `/admin/extract-audio`
2. Paste an AIMC video URL
3. Click "Extract Audio"
4. Watch the job progress through: queued → downloading → converting → uploading → done

On the Linode, you can watch the worker logs:
```bash
cd ~/otw-radio-worker
docker-compose logs -f
```

---

## Common Issues

### "ssh: Could not resolve hostname onestowatch"

The script can't find your server. Use the IP address instead:
```bash
LINODE_HOST="root@123.456.789.012" ./deploy/deploy-worker.sh
```

### "Permission denied (publickey)"

Your SSH key isn't set up. Test manual SSH first:
```bash
ssh root@123.456.789.012
```

### "SFTP connection failed"

The SFTP key isn't authorized. On the Linode:
```bash
cat ~/otw-radio-worker/sftp_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### "Worker isn't claiming jobs"

Check the WORKER_TOKEN matches in both places:
- Linode: `~/otw-radio-worker/.env`
- App: Vercel environment variables

---

## Quick Commands

**View worker logs:**
```bash
cd ~/otw-radio-worker
docker-compose logs -f
```

**Restart worker:**
```bash
cd ~/otw-radio-worker
docker-compose restart
```

**Stop worker:**
```bash
cd ~/otw-radio-worker
docker-compose down
```

**Update worker code:**

From your laptop:
```bash
LINODE_HOST="root@YOUR_IP" ./deploy/deploy-worker.sh
```

Then on Linode:
```bash
cd ~/otw-radio-worker
docker-compose down
docker-compose build
docker-compose up -d
```