<![CDATA[
# Self-Hosting Supabase on Linode

Complete guide to migrate from Supabase Cloud to self-hosted on your Linode server.

## Prerequisites

- Linode server with Docker and Docker Compose installed
- Domain DNS configured (api.radio.yourdomain.com, studio.radio.yourdomain.com)
- At least 4GB RAM, 2 CPU cores
- SMTP credentials (SendGrid, Mailgun, or similar)

---

## Part 1: Install Supabase on Linode

**SSH into your Linode server first:**

```bash
ssh root@your-linode-ip
```

### Step 1: Clone Supabase

```bash
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

### Step 2: Generate Secure Keys

```bash
# Generate all required secrets
POSTGRES_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ANON_KEY=$(openssl rand -base64 32)
SERVICE_KEY=$(openssl rand -base64 32)
DASHBOARD_PASS=$(openssl rand -base64 16)

# SAVE THESE - you'll need them for .env.local
echo "========================================"
echo "SAVE THESE CREDENTIALS IMMEDIATELY:"
echo "========================================"
echo "Postgres Password: $POSTGRES_PASS"
echo "JWT Secret: $JWT_SECRET"
echo "Anon Key: $ANON_KEY"
echo "Service Role Key: $SERVICE_KEY"
echo "Dashboard Password: $DASHBOARD_PASS"
echo "========================================"
```

### Step 3: Create .env Configuration

```bash
cat > .env << EOF
############
# Secrets
############
POSTGRES_PASSWORD=$POSTGRES_PASS
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASS

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API Proxy
############
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API
############
PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Auth
############
# Replace with your actual domain
SITE_URL=https://radio.onestowatch.live
API_EXTERNAL_URL=https://api.radio.onestowatch.live

# Additional URLs that can refer users - comma separated
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
SECURITY_CAPTCHA_ENABLED=false
SECURITY_CAPTCHA_SECRET=
ENABLE_ANONYMOUS_USERS=true

# Email/SMS config
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SMTP_ADMIN_EMAIL=admin@onestowatch.live
GOTRUE_SMTP_HOST=smtp.sendgrid.net
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=apikey
GOTRUE_SMTP_PASS=YOUR_SENDGRID_API_KEY
GOTRUE_SMTP_SENDER_NAME=OTW Radio

############
# Studio
############
STUDIO_DEFAULT_ORGANIZATION=OTW Radio
STUDIO_DEFAULT_PROJECT=Production

PUBLIC_REST_URL=http://rest:3000
STUDIO_PG_META_URL=http://meta:8080

############
# Storage
############
FILE_SIZE_LIMIT=52428800

############
# Realtime
############
# Set to true if you want to enable webhooks for database changes
ENABLE_WEBHOOKS=false
EOF
```

### Step 4: Start Supabase

```bash
# Pull and start all services
docker-compose up -d

# Wait 2 minutes for initialization
sleep 120

# Check all services are running
docker-compose ps

# Expected output: All services should show "Up"
# - supabase-db (PostgreSQL)
# - supabase-auth (GoTrue)
# - supabase-rest (PostgREST)
# - supabase-storage
# - supabase-studio
# - supabase-kong (API Gateway)
# - supabase-realtime
```

### Step 5: Verify Services

```bash
# Check if database is ready
docker exec -it supabase-db psql -U postgres -c "SELECT version();"

# Check Studio is accessible (should return HTML)
curl -I http://localhost:3002

# Check REST API (should return 404 with JSON)
curl http://localhost:8000/rest/v1/
```

---

## Part 2: Configure Nginx Reverse Proxy

### Step 1: Create Nginx Configuration

```bash
cat > /etc/nginx/sites-available/supabase << 'EOF'
# Supabase API Gateway (Kong)
upstream supabase_api {
    server 127.0.0.1:8000;
}

# Supabase Studio
upstream supabase_studio {
    server 127.0.0.1:3002;
}

# API endpoint (REST, Auth, Storage, Realtime)
server {
    listen 80;
    server_name api.radio.onestowatch.live;

    # Increase timeout for long-running queries
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    location / {
        proxy_pass http://supabase_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Studio Dashboard
server {
    listen 80;
    server_name studio.radio.onestowatch.live;

    location / {
        proxy_pass http://supabase_studio;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Studio
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 2: Install SSL Certificates

```bash
# Make sure DNS is pointing to your Linode IP first
certbot --nginx -d api.radio.onestowatch.live -d studio.radio.onestowatch.live

# Auto-renewal
certbot renew --dry-run
```

---

## Part 3: Migrate Data from Cloud to Self-Hosted

### Step 1: Export from Supabase Cloud

**On your local machine (not Linode):**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your cloud project
supabase link --project-ref agyoehyzvergiiwdbzmz

# Export schema
supabase db dump > schema.sql

# Export data (excluding auth.users - will be exported separately)
supabase db dump --data-only --exclude-table auth.users > data.sql

# Export auth users (sensitive)
supabase db dump --data-only --include-table auth.users --include-table auth.identities > auth_data.sql
```

### Step 2: Copy to Linode

```bash
# From your local machine
scp schema.sql data.sql auth_data.sql root@your-linode-ip:/tmp/
```

### Step 3: Import to Self-Hosted

**On your Linode server:**

```bash
cd /opt/supabase/docker

# Import schema
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/schema.sql

# Import data
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/data.sql

# Import auth data
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/auth_data.sql

# Verify tables exist
docker exec -it supabase-db psql -U postgres -d postgres -c "\dt"

# Verify auth users migrated
docker exec -it supabase-db psql -U postgres -d postgres -c "SELECT email, created_at FROM auth.users LIMIT 5;"

# Check RLS policies migrated
docker exec -it supabase-db psql -U postgres -d postgres -c "\d mood_taps"
```

---

## Part 4: Update Your Application

### Update .env.local

Replace cloud Supabase credentials with self-hosted:

```bash
# BEFORE (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://agyoehyzvergiiwdbzmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...cloud-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...cloud-service-key...

# AFTER (Self-Hosted)
NEXT_PUBLIC_SUPABASE_URL=https://api.radio.onestowatch.live
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your generated ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<your generated SERVICE_KEY>
```

### Test Connection

```bash
# Restart your Next.js app to pick up new env vars
npm run dev

# Or if running in production
pm2 restart all
```

---

## Part 5: Migrate Storage Files (if applicable)

If you have files in Supabase Storage:

```bash
# On your local machine
# Download all storage buckets
supabase storage ls
supabase storage download <bucket-name> --recursive

# Copy to Linode
scp -r <bucket-name> root@your-linode-ip:/tmp/

# On Linode, copy to storage volume
docker cp /tmp/<bucket-name> supabase-storage:/var/lib/storage/
```

---

## Part 6: Verification Checklist

### Database
```bash
# Connect to database
docker exec -it supabase-db psql -U postgres -d postgres

# Check tables
\dt

# Check users
SELECT email, created_at FROM auth.users;

# Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies;

# Exit
\q
```

### Auth
```bash
# Try login from your app
# Check auth logs
docker logs supabase-auth --tail 50
```

### Storage
```bash
# Check storage is working
curl -X GET https://api.radio.onestowatch.live/storage/v1/bucket
```

### Studio
- Visit: https://studio.radio.onestowatch.live
- Login with credentials from Step 2
- Verify tables, auth users, storage buckets

---

## Troubleshooting

### Services Won't Start

```bash
cd /opt/supabase/docker
docker-compose logs -f
```

### Database Connection Issues

```bash
# Check database is accepting connections
docker exec -it supabase-db pg_isready

# Check PostgreSQL logs
docker logs supabase-db --tail 100
```

### Auth Not Working

```bash
# Check GoTrue logs
docker logs supabase-auth --tail 50

# Verify JWT secret matches
docker exec -it supabase-db psql -U postgres -c "SHOW app.settings.jwt_secret;"
```

### Storage Upload Fails

```bash
# Check storage service
docker logs supabase-storage --tail 50

# Verify storage volume permissions
docker exec -it supabase-storage ls -la /var/lib/storage/
```

---

## Maintenance

### Backup Database

```bash
# Daily backup script
cat > /root/backup-supabase.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/root/supabase-backups
mkdir -p $BACKUP_DIR

# Backup database
docker exec supabase-db pg_dump -U postgres postgres | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x /root/backup-supabase.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-supabase.sh >> /var/log/supabase-backup.log 2>&1") | crontab -
```

### Update Supabase

```bash
cd /opt/supabase/docker
docker-compose pull
docker-compose up -d
```

### Monitor Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f supabase-db
docker logs -f supabase-auth
docker logs -f supabase-rest
```

---

## DNS Configuration Required

Add these A records to your domain:

```
api.radio.onestowatch.live    → your-linode-ip
studio.radio.onestowatch.live → your-linode-ip
```

Wait 5-10 minutes for DNS propagation before running certbot.

---

## Cost Comparison

**Supabase Cloud:** ~$25-50/month for Pro tier  
**Self-Hosted on Linode:** ~$10-20/month (shared Linode with AzuraCast)

**Benefits of Self-Hosting:**
- Full control over data
- No API rate limits
- Co-located with AzuraCast on same server
- Lower latency between services
- Cost savings

**Tradeoffs:**
- You manage backups
- You manage updates
- No managed auto-scaling
- Self-managed security patches
</file_contents>