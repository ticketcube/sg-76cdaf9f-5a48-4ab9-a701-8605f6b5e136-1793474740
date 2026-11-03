#!/bin/bash
# Script to migrate from cloud Supabase to self-hosted
# Run from your LOCAL machine, not the server

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Supabase Cloud → Self-hosted${NC}"
echo -e "${GREEN}Migration Script${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    npm install -g supabase
fi

# Prompt for project details
read -p "Enter your Supabase project ref (from cloud dashboard): " PROJECT_REF
read -p "Enter your Linode server IP: " SERVER_IP
read -p "Enter SSH user (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

echo ""
echo -e "${GREEN}Step 1: Logging into Supabase Cloud...${NC}"
supabase login

echo -e "${GREEN}Step 2: Linking to cloud project...${NC}"
supabase link --project-ref $PROJECT_REF

echo -e "${GREEN}Step 3: Dumping database schema...${NC}"
supabase db dump > schema.sql
echo "✓ Schema saved to schema.sql"

echo -e "${GREEN}Step 4: Dumping database data...${NC}"
supabase db dump --data-only > data.sql
echo "✓ Data saved to data.sql"

echo -e "${GREEN}Step 5: Copying files to server...${NC}"
scp schema.sql data.sql $SSH_USER@$SERVER_IP:/tmp/
echo "✓ Files copied to server"

echo -e "${GREEN}Step 6: Importing to self-hosted Supabase...${NC}"
ssh $SSH_USER@$SERVER_IP << 'ENDSSH'
cd /opt/supabase/docker

echo "Importing schema..."
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/schema.sql

echo "Importing data..."
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/data.sql

echo "Verifying import..."
docker exec -it supabase-db psql -U postgres -d postgres -c "\dt"

echo "Cleaning up..."
rm /tmp/schema.sql /tmp/data.sql

echo "✓ Migration complete!"
ENDSSH

echo ""
echo -e "${GREEN}Step 7: Testing connection...${NC}"
echo ""
echo "Please update your Next.js .env.local with:"
echo ""
echo -e "${YELLOW}NEXT_PUBLIC_SUPABASE_URL=https://supabase-api.yourdomain.com${NC}"
echo -e "${YELLOW}NEXT_PUBLIC_SUPABASE_ANON_KEY=<from server .env>${NC}"
echo ""
echo "Then rebuild and restart your app:"
echo "  npm run build && pm2 restart otw-radio"
echo ""
echo -e "${GREEN}Migration complete!${NC}"