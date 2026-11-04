FROM node:20-alpine

# Install ffmpeg and SSH client
RUN apk add --no-cache ffmpeg openssh-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built code
COPY dist ./dist

# Create temp directory
RUN mkdir -p /tmp/extraction

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001 && \
    chown -R worker:nodejs /app /tmp/extraction

USER worker

CMD ["node", "dist/index.js"]