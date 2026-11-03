#!/bin/bash
# Automated Linode Setup Script for OTW Radio
# Run as: curl -sSL https://raw.githubusercontent.com/yourusername/otw-radio/main/deploy/setup-linode.sh | bash

set -e

echo "=========================================="
echo "OTW Radio - Linode Server Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing dependencies...${NC}"
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl wget unzip

echo -e "${GREEN}Step 3: Starting Docker...${NC}"
systemctl enable docker
systemctl start docker

echo -e "${GREEN}Step 4: Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo -e "${GREEN}Step 5: Installing PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 6: Installing AzuraCast...${NC}"
mkdir -p /var/azuracast
cd /var/azuracast
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh > docker.sh
chmod +x docker.sh
./docker.sh install

echo -e "${GREEN}Step 7: Installing Supabase...${NC}"
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Generate secure credentials
POSTGRES_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ANON_KEY=$(openssl rand -base64 32)
SERVICE_KEY=$(openssl rand -base64 32)
DASHBOARD_PASS=$(openssl rand -base64 16)

echo -e "${YELLOW}Generating Supabase configuration...${NC}"
cat > .env << EOF
POSTGRES_PASSWORD=$POSTGRES_PASS
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASS
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
API_EXTERNAL_URL=http://localhost:3001
STUDIO_DEFAULT_ORGANIZATION=OTW Radio
STUDIO_DEFAULT_PROJECT=Production
SITE_URL=http://localhost:3000
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
MAILER_URLPATHS_CONFIRMATION=/auth/confirm
MAILER_URLPATHS_INVITE=/auth/invite
MAILER_URLPATHS_RECOVERY=/auth/reset-password
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=OTW Radio
EOF

echo -e "${GREEN}Starting Supabase services...${NC}"
docker-compose up -d

echo -e "${GREEN}Step 8: Setting up firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000:8999/tcp
echo "y" | ufw enable

echo -e "${GREEN}Step 9: Creating backup script...${NC}"
mkdir -p /backups/otw-radio
cat > /root/backup-otw.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/backups/otw-radio"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec supabase-db pg_dump -U postgres postgres | gzip > $BACKUP_DIR/supabase_$DATE.sql.gz
docker exec azuracast_mariadb mysqldump -u azuracast -p$(docker exec azuracast bash -c 'echo $MYSQL_PASSWORD') azuracast | gzip > $BACKUP_DIR/azuracast_$DATE.sql.gz
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
echo "Backup completed: $DATE"
BACKUP_EOF
chmod +x /root/backup-otw.sh

echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Important Credentials (SAVE THESE):${NC}"
echo ""
echo "Supabase Anon Key: $ANON_KEY"
echo "Supabase Service Role Key: $SERVICE_KEY"
echo "Supabase Dashboard Password: $DASHBOARD_PASS"
echo "PostgreSQL Password: $POSTGRES_PASS"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your domain DNS to point to this server"
echo "2. Update /opt/supabase/docker/.env with your domain"
echo "3. Clone and deploy your Next.js radio site"
echo "4. Configure Nginx reverse proxy"
echo "5. Run Certbot for SSL certificates"
echo ""
echo "See full documentation: /opt/otw-radio/docs/LINODE_DEPLOYMENT.md"
echo ""