# Complete Linode Deployment Guide

Deploy AzuraCast + Self-hosted Supabase + OTW Radio Site on a single Linode server.

## Server Requirements

**Recommended Linode Plan:** Dedicated 8GB ($36/month)
- 4 CPU Cores
- 8GB RAM
- 160GB Storage
- 5TB Transfer

**Minimum:** Shared 4GB ($24/month) - May be tight under load

## Architecture Overview

```
Linode Server (Single Instance)
├── AzuraCast (Docker) - Ports 80, 443, 8000-8999
├── Supabase Stack (Docker Compose)
│   ├── PostgreSQL - Port 5432
│   ├── Auth (GoTrue) - Port 9999
│   ├── REST API (PostgREST) - Port 3001
│   ├── Storage API - Port 5000
│   └── Studio (Admin UI) - Port 3002
├── Next.js Radio Site (PM2) - Port 3000
└── Nginx (Reverse Proxy) - Frontend to all services
```

## Step 1: Initial Server Setup

```bash
# SSH into your Linode
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl

# Start Docker
systemctl enable docker
systemctl start docker

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2
```

## Step 2: Install AzuraCast

```bash
# Create directory
mkdir -p /var/azuracast
cd /var/azuracast

# Download installer
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh > docker.sh
chmod +x docker.sh

# Run installation
./docker.sh install

# Note the admin password it generates
```

AzuraCast will be available at: `http://your-server-ip` (port 80)

## Step 3: Install Self-hosted Supabase

```bash
# Clone Supabase
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Generate secure keys
cat > .env << 'EOF'
############
# Secrets
############
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ANON_KEY=$(openssl rand -base64 32)
SERVICE_ROLE_KEY=$(openssl rand -base64 32)
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$(openssl rand -base64 16)

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API
############
API_EXTERNAL_URL=https://supabase-api.yourdomain.com
STUDIO_DEFAULT_ORGANIZATION=OTW Radio
STUDIO_DEFAULT_PROJECT=Production

############
# Auth
############
SITE_URL=https://radio.yourdomain.com
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
MAILER_URLPATHS_CONFIRMATION=/auth/confirm
MAILER_URLPATHS_INVITE=/auth/invite
MAILER_URLPATHS_RECOVERY=/auth/reset-password

############
# Email (Configure with your SMTP)
############
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_SENDER_NAME=OTW Radio
EOF

# Start Supabase
docker-compose up -d

# Wait for services to start (takes ~2 minutes)
sleep 120

# Check status
docker-compose ps
```

**Save these credentials safely:**
- Anon Key: `echo $ANON_KEY`
- Service Role Key: `echo $SERVICE_ROLE_KEY`
- Dashboard Password: `echo $DASHBOARD_PASSWORD`

Supabase Studio: `http://your-server-ip:3002`

## Step 4: Deploy Next.js Radio Site

```bash
# Clone your repository
cd /opt
git clone https://github.com/yourusername/otw-radio.git
cd otw-radio

# Install dependencies
npm install

# Create production environment file
cat > .env.local << 'EOF'
# AzuraCast Connection
NEXT_PUBLIC_AZURACAST_API_URL=https://your-azuracast-domain.com/api
NEXT_PUBLIC_AZURACAST_STATION_ID=1

# Self-hosted Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://supabase-api.yourdomain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step3
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step3

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://radio.yourdomain.com
EOF

# Build production app
npm run build

# Start with PM2
pm2 start npm --name "otw-radio" -- start
pm2 save
pm2 startup
# Run the command PM2 outputs

# Verify it's running
pm2 list
```

## Step 5: Configure Nginx Reverse Proxy

```bash
# Remove default site
rm /etc/nginx/sites-enabled/default

# Create main radio site config
cat > /etc/nginx/sites-available/radio << 'EOF'
# Main Radio Site
server {
    listen 80;
    server_name radio.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Supabase API
server {
    listen 80;
    server_name supabase-api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Supabase Auth
server {
    listen 80;
    server_name supabase-auth.yourdomain.com;

    location / {
        proxy_pass http://localhost:9999;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Supabase Studio (Admin Dashboard)
server {
    listen 80;
    server_name supabase-studio.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/radio /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## Step 6: Configure DNS

Add these A records in your DNS provider:

```
radio.yourdomain.com         → your-server-ip
supabase-api.yourdomain.com  → your-server-ip
supabase-auth.yourdomain.com → your-server-ip
supabase-studio.yourdomain.com → your-server-ip
```

**Note:** AzuraCast should already be configured on your main domain.

## Step 7: Enable SSL Certificates

```bash
# Install certificates for all domains
certbot --nginx -d radio.yourdomain.com
certbot --nginx -d supabase-api.yourdomain.com
certbot --nginx -d supabase-auth.yourdomain.com
certbot --nginx -d supabase-studio.yourdomain.com

# Certificates will auto-renew
```

## Step 8: Migrate Data from Cloud Supabase

### Export from Cloud Supabase

```bash
# Install Supabase CLI locally (on your computer)
npm install -g supabase

# Login to your cloud project
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Dump your database schema and data
supabase db dump --data-only > data.sql
supabase db dump > schema.sql
```

### Import to Self-hosted Supabase

```bash
# Copy files to server
scp schema.sql data.sql root@your-server-ip:/tmp/

# SSH into server
ssh root@your-server-ip

# Import schema
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/schema.sql

# Import data
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/data.sql

# Verify
docker exec -it supabase-db psql -U postgres -d postgres
\dt
SELECT * FROM auth.users;
\q
```

## Step 9: Update Next.js Environment

```bash
cd /opt/otw-radio

# Update .env.local with self-hosted Supabase URLs
nano .env.local

# Rebuild app
npm run build

# Restart PM2
pm2 restart otw-radio
```

## Step 10: Setup Backups

```bash
# Create backup script
cat > /root/backup-otw.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/otw-radio"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Supabase Database
docker exec supabase-db pg_dump -U postgres postgres | gzip > $BACKUP_DIR/supabase_$DATE.sql.gz

# Backup AzuraCast Database
docker exec azuracast_mariadb mysqldump -u azuracast -p$(docker exec azuracast bash -c 'echo $MYSQL_PASSWORD') azuracast | gzip > $BACKUP_DIR/azuracast_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup-otw.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
# 0 2 * * * /root/backup-otw.sh >> /var/log/otw-backup.log 2>&1
```

## Monitoring & Maintenance

### Check Service Status

```bash
# AzuraCast
cd /var/azuracast && ./docker.sh status

# Supabase
cd /opt/supabase/docker && docker-compose ps

# Next.js Site
pm2 status

# Nginx
systemctl status nginx
```

### View Logs

```bash
# Next.js logs
pm2 logs otw-radio

# Supabase logs
cd /opt/supabase/docker && docker-compose logs -f

# AzuraCast logs
cd /var/azuracast && ./docker.sh logs
```

### Update Services

```bash
# Update Next.js site
cd /opt/otw-radio
git pull
npm install
npm run build
pm2 restart otw-radio

# Update Supabase
cd /opt/supabase/docker
git pull
docker-compose pull
docker-compose up -d

# Update AzuraCast
cd /var/azuracast
./docker.sh update-self
./docker.sh update
```

## Troubleshooting

### Supabase Connection Issues

```bash
# Check if PostgreSQL is accessible
docker exec -it supabase-db psql -U postgres
\l
\q

# Restart Supabase services
cd /opt/supabase/docker
docker-compose restart
```

### Next.js Site Not Loading

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs otw-radio --err

# Restart
pm2 restart otw-radio

# Clear logs and restart fresh
pm2 flush
pm2 restart otw-radio
```

### Port Conflicts

```bash
# Check what's using a port
netstat -tulpn | grep :3000

# Kill process if needed
kill -9 <PID>
```

## Security Hardening

```bash
# Enable UFW firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000:8999/tcp  # AzuraCast streaming ports
ufw enable

# Disable root SSH login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd

# Enable automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## Cost Breakdown

- **Linode Server:** $36/month (Dedicated 8GB)
- **Domain:** ~$12/year
- **Total:** ~$37/month (vs. $80+/month for separate hosting)

## Access URLs (After Setup)

- **Radio Site:** https://radio.yourdomain.com
- **AzuraCast:** https://yourdomain.com
- **Supabase Studio:** https://supabase-studio.yourdomain.com
- **Supabase API:** https://supabase-api.yourdomain.com

## Next Steps

1. Configure AzuraCast station settings
2. Upload media to AzuraCast
3. Create playlists in Supabase Studio
4. Test authentication flows
5. Setup monitoring (optional: Uptime Robot, StatusCake)
6. Configure email SMTP for Supabase auth emails