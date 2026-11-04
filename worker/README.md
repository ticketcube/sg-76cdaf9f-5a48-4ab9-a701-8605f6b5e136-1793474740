# OTW Radio Extraction Worker

Worker service that extracts audio from AIMC videos and saves to AIMC and/or AzuraCast radio station.

## Prerequisites

- Docker and Docker Compose
- SSH private key for SFTP access to the AzuraCast server
- Environment variables configured

## Deployment on Linode

### 1. Prepare the SSH Key

Place your SFTP private key in the worker directory:

```bash
cp /path/to/your/ssh_key worker/sftp_key
chmod 600 worker/sftp_key
```

**Important:** Never commit this key to git. It's listed in `.gitignore`.

### 2. Configure Environment Variables

Create a `.env` file in the `worker/` directory:

```bash
APP_URL=https://your-app-domain.com
WORKER_TOKEN=your-long-random-secret-here
SFTP_HOST=localhost
SFTP_PORT=2022
SFTP_USER=azuracast
RADIO_FOLDER=aimc
```

**Generate WORKER_TOKEN:**
```bash
openssl rand -hex 32
```

This token must match the `WORKER_TOKEN` in your app's environment variables.

### 3. Build and Start

```bash
cd worker
npm install
npm run build
docker-compose up -d
```

### 4. View Logs

```bash
docker-compose logs -f worker
```

### 5. Stop/Restart

```bash
docker-compose stop
docker-compose start
docker-compose restart
```

## How It Works

1. Worker polls `/api/worker/claim` every 10 seconds
2. When a job is available, it claims it and marks it "downloading"
3. Downloads the video from AIMC using a presigned S3 URL
4. Checks for audio track with ffprobe
5. Converts to MP3 with loudness normalization (192kbps)
6. Uploads to AIMC (if requested) using presigned upload URL
7. Uploads to radio station via SFTP (if requested)
8. Reports status back to the app

## File Naming

- Input: `{asset_name}` from AIMC
- Output: `{sanitized_asset_name}_OTWL.mp3`
- If file exists: adds `-2`, `-3`, etc.

## Disk Space

The worker needs free disk space equal to:
- Input video size
- Output MP3 size (~2-3MB per minute)
- Plus 10% buffer

Videos over 5GB will work but take significant time.

## Troubleshooting

### Worker not claiming jobs
- Check `APP_URL` is correct and accessible
- Verify `WORKER_TOKEN` matches between worker and app
- Check app logs for claim endpoint errors

### SFTP upload fails
- Verify SSH key permissions: `chmod 600 sftp_key`
- Test SFTP access manually: `sftp -i sftp_key -P 2022 azuracast@localhost`
- Check AzuraCast SFTP is enabled and port is correct

### AIMC upload fails
- Check app has valid `AIMC_API_KEY`
- Verify connector ID and folder path in app environment

### Conversion fails
- Check input file has audio track
- Verify ffmpeg is installed: `docker-compose exec worker ffmpeg -version`
- Check disk space: `docker-compose exec worker df -h`

## Security Notes

- SFTP private key is mounted read-only into container
- Download URLs are never logged or stored
- Worker only makes outgoing HTTPS requests
- No incoming connections required
</README>