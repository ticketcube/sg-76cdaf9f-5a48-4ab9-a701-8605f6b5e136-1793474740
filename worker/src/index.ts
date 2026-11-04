import { spawn } from "child_process";
import { createWriteStream, createReadStream, statSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import fetch from "node-fetch";
import SftpClient from "ssh2-sftp-client";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const WORKER_TOKEN = process.env.WORKER_TOKEN;
const SFTP_HOST = process.env.SFTP_HOST || "localhost";
const SFTP_PORT = parseInt(process.env.SFTP_PORT || "2022");
const SFTP_USER = process.env.SFTP_USER;
const SFTP_PRIVATE_KEY_PATH = process.env.SFTP_PRIVATE_KEY_PATH;
const RADIO_FOLDER = process.env.RADIO_FOLDER || "aimc";
const TEMP_DIR = "/tmp/extraction";

interface Job {
  id: string;
  asset_id: string;
  asset_name: string;
  artist: string | null;
  title: string;
  save_to_aimc: boolean;
  save_to_radio: boolean;
  download_url: string;
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function sanitizeFilename(name: string): string {
  // Remove extension
  let clean = name.replace(/\.[^.]+$/, "");
  // Keep only safe characters
  clean = clean.replace(/[^a-zA-Z0-9\s._-]/g, "");
  // Collapse multiple spaces
  clean = clean.replace(/\s+/g, " ").trim();
  // Fallback if empty
  return clean || "aimc-audio";
}

function checkDiskSpace(requiredBytes: number): boolean {
  try {
    const stats = statSync(TEMP_DIR);
    // Simple check - in production, use a proper disk space check
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const fileStream = createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.body!.pipe(fileStream);
    response.body!.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

async function checkAudioTrack(inputPath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=codec_type",
      "-of", "default=noprint_wrappers=1:nokey=1",
      inputPath
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("ffprobe failed"));
      } else {
        resolve(output.trim() === "audio");
      }
    });
  });
}

async function convertToMp3(
  inputPath: string,
  outputPath: string,
  artist: string,
  title: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-nostdin",
      "-i", inputPath,
      "-vn",
      "-af", "loudnorm",
      "-c:a", "libmp3lame",
      "-b:a", "192k",
      "-metadata", `artist=${artist}`,
      "-metadata", `title=${title}`,
      "-f", "mp3",
      outputPath
    ];

    const ffmpeg = spawn("nice", ["-n", "10", "ffmpeg", ...args]);

    ffmpeg.stderr.on("data", (data) => {
      // Log progress but don't include the whole stream
      const line = data.toString();
      if (line.includes("time=")) {
        log(`Converting: ${line.match(/time=[\d:.]+/)?.[0] || ""}`);
      }
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function uploadToAIMC(
  jobId: string,
  filePath: string,
  filename: string
): Promise<string> {
  const fileSize = statSync(filePath).size;

  // Get signed upload URL from app
  const uploadRes = await fetch(`${APP_URL}/api/worker/jobs/${jobId}/aimc-upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WORKER_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ filename, fileSize })
  });

  if (!uploadRes.ok) {
    const error = await uploadRes.text();
    throw new Error(`Failed to get AIMC upload URL: ${error}`);
  }

  const { uploadUrl, key } = await uploadRes.json();

  // Upload file
  const fileStream = createReadStream(filePath);
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": fileSize.toString()
    },
    body: fileStream
  });

  if (!putRes.ok) {
    throw new Error(`AIMC upload failed: ${putRes.statusText}`);
  }

  return key;
}

async function uploadToRadio(filePath: string, filename: string): Promise<string> {
  const sftp = new SftpClient();

  try {
    // Read private key
    const privateKey = existsSync(SFTP_PRIVATE_KEY_PATH!)
      ? require("fs").readFileSync(SFTP_PRIVATE_KEY_PATH!, "utf8")
      : undefined;

    if (!privateKey) {
      throw new Error("SFTP private key not found");
    }

    await sftp.connect({
      host: SFTP_HOST,
      port: SFTP_PORT,
      username: SFTP_USER!,
      privateKey
    });

    // Ensure folder exists
    const remotePath = `/${RADIO_FOLDER}`;
    try {
      await sftp.mkdir(remotePath, true);
    } catch {
      // Folder may already exist
    }

    // Find available filename
    let finalName = filename;
    let counter = 2;
    while (await sftp.exists(`${remotePath}/${finalName}`)) {
      const nameWithoutExt = filename.replace(/\.mp3$/, "");
      finalName = `${nameWithoutExt}-${counter}.mp3`;
      counter++;
    }

    // Upload to temp name first
    const tempName = `${finalName}.tmp`;
    const tempRemotePath = `${remotePath}/${tempName}`;
    const finalRemotePath = `${remotePath}/${finalName}`;

    await sftp.put(filePath, tempRemotePath);

    // Verify size
    const remoteStat = await sftp.stat(tempRemotePath);
    const localSize = statSync(filePath).size;
    if (remoteStat.size !== localSize) {
      await sftp.delete(tempRemotePath);
      throw new Error("File size mismatch after upload");
    }

    // Rename to final name
    await sftp.rename(tempRemotePath, finalRemotePath);

    return finalRemotePath;
  } finally {
    await sftp.end();
  }
}

async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("Failed to get duration"));
      } else {
        resolve(parseFloat(output.trim()));
      }
    });
  });
}

async function updateJobStatus(
  jobId: string,
  status: string,
  error?: string,
  result?: {
    aimc_key?: string;
    radio_path?: string;
    duration_sec?: number;
    size_bytes?: number;
  }
): Promise<void> {
  await fetch(`${APP_URL}/api/worker/jobs/${jobId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WORKER_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status, error, ...result })
  });
}

async function processJob(job: Job): Promise<void> {
  const tempInput = join(TEMP_DIR, `${job.id}-input`);
  const tempOutput = join(TEMP_DIR, `${job.id}-output.mp3`);

  try {
    // Update to downloading
    log(`[${job.id}] Downloading ${job.asset_name}...`);
    await updateJobStatus(job.id, "downloading");

    if (!checkDiskSpace(1024 * 1024 * 1024)) {
      throw new Error("Insufficient disk space");
    }

    await downloadFile(job.download_url, tempInput);

    // Check for audio track
    const hasAudio = await checkAudioTrack(tempInput);
    if (!hasAudio) {
      throw new Error("This video has no audio track");
    }

    // Convert
    log(`[${job.id}] Converting to MP3...`);
    await updateJobStatus(job.id, "converting");

    const artist = job.artist || "Unknown Artist";
    const title = job.title;
    await convertToMp3(tempInput, tempOutput, artist, title);

    // Get metadata
    const duration = await getAudioDuration(tempOutput);
    const fileSize = statSync(tempOutput).size;

    // Generate output filename
    const baseName = sanitizeFilename(job.asset_name);
    const filename = `${baseName}_OTWL.mp3`;

    // Upload
    log(`[${job.id}] Uploading...`);
    await updateJobStatus(job.id, "uploading");

    const result: any = {
      duration_sec: duration,
      size_bytes: fileSize
    };

    let aimcError: string | null = null;
    let radioError: string | null = null;

    if (job.save_to_aimc) {
      try {
        result.aimc_key = await uploadToAIMC(job.id, tempOutput, filename);
        log(`[${job.id}] AIMC upload complete: ${result.aimc_key}`);
      } catch (error: any) {
        aimcError = error.message;
        log(`[${job.id}] AIMC upload failed: ${error.message}`);
      }
    }

    if (job.save_to_radio) {
      try {
        result.radio_path = await uploadToRadio(tempOutput, filename);
        log(`[${job.id}] Radio upload complete: ${result.radio_path}`);
      } catch (error: any) {
        radioError = error.message;
        log(`[${job.id}] Radio upload failed: ${error.message}`);
      }
    }

    // Determine final status
    if (aimcError && radioError) {
      throw new Error(`Both uploads failed. AIMC: ${aimcError}. Radio: ${radioError}`);
    } else if (aimcError || radioError) {
      result.error = aimcError ? `AIMC failed: ${aimcError}` : `Radio failed: ${radioError}`;
      await updateJobStatus(job.id, "done", result.error, result);
    } else {
      await updateJobStatus(job.id, "done", undefined, result);
    }

    log(`[${job.id}] Job complete`);
  } catch (error: any) {
    log(`[${job.id}] Job failed: ${error.message}`);
    await updateJobStatus(job.id, "failed", error.message);
  } finally {
    // Cleanup
    try {
      if (existsSync(tempInput)) unlinkSync(tempInput);
      if (existsSync(tempOutput)) unlinkSync(tempOutput);
    } catch (error) {
      log(`[${job.id}] Cleanup error: ${error}`);
    }
  }
}

async function claimJob(): Promise<Job | null> {
  try {
    const response = await fetch(`${APP_URL}/api/worker/claim`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WORKER_TOKEN}`
      }
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Claim failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    log(`Claim error: ${error.message}`);
    return null;
  }
}

async function main() {
  if (!WORKER_TOKEN) {
    throw new Error("WORKER_TOKEN is required");
  }
  if (!SFTP_USER) {
    throw new Error("SFTP_USER is required");
  }
  if (!SFTP_PRIVATE_KEY_PATH) {
    throw new Error("SFTP_PRIVATE_KEY_PATH is required");
  }

  // Ensure temp directory exists
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }

  log("Worker started");
  log(`App URL: ${APP_URL}`);
  log(`SFTP: ${SFTP_USER}@${SFTP_HOST}:${SFTP_PORT}`);
  log(`Radio folder: ${RADIO_FOLDER}`);

  // Poll for jobs
  while (true) {
    try {
      const job = await claimJob();
      if (job) {
        log(`Claimed job ${job.id} for asset ${job.asset_name}`);
        await processJob(job);
      }
    } catch (error: any) {
      log(`Error: ${error.message}`);
    }

    // Wait 10 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});