import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Extracts a broadcast-ready MP3 from any AIMC audio or video file with ffmpeg:
 * stereo, 44.1 kHz, 192 kbps, loudness-normalised to -16 LUFS, with title and artist tags.
 * ffmpeg reads straight from the presigned URL, so the full video never lands on disk.
 */
export async function extractAudio(
  sourceUrl: string,
  outFile: string,
  tags: { title: string; artist: string },
): Promise<Buffer> {
  await mkdir(path.dirname(outFile), { recursive: true });
  const args = [
    "-y",
    "-i", sourceUrl,
    "-vn",
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ac", "2",
    "-ar", "44100",
    "-b:a", "192k",
    "-metadata", `title=${tags.title}`,
    "-metadata", `artist=${tags.artist}`,
    outFile,
  ];
  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    ff.stderr.on("data", (chunk) => (stderr += chunk));
    ff.on("error", reject);
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-2000)}`)),
    );
  });
  return readFile(outFile);
}
