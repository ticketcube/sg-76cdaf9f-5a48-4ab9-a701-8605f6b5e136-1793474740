import { config } from "./config.js";

/**
 * AIMC runs on AWS Media Lake (S3-backed). Assets carry tags such as Artist, Series, Format
 * and Artist Spotify ID, plus representations (an MP4 proxy and a thumbnail) and media info
 * (durationSec, codecs).
 *
 * Authentication: Bearer token via AIMC_API_KEY environment variable.
 * Routes confirmed via AWS Media Lake open-source connector documentation.
 */

export interface AimcAsset {
  id: string;
  name: string;
  type: "Video" | "Audio" | "Image";
  tags: Record<string, string>;
  media?: { durationSec?: number };
  representations: { id: string; purpose: "proxy" | "thumbnail" | string; format: string }[];
}

async function call<T>(route: string): Promise<T> {
  const res = await fetch(`${config.aimc.baseUrl()}${route}`, {
    headers: { Authorization: `Bearer ${config.aimc.apiKey()}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`AIMC ${route} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const aimc = {
  /** Get asset metadata including tags, media info, and available representations */
  getAsset: (id: string) => call<AimcAsset>(`/assets/${encodeURIComponent(id)}`),

  /** Get presigned download URL for an asset or specific representation (proxy, thumbnail, etc.) */
  async getDownloadUrl(id: string, representationId?: string): Promise<string> {
    const query = representationId ? `?representation=${encodeURIComponent(representationId)}` : "";
    const result = await call<{ url: string }>(`/assets/${encodeURIComponent(id)}/download${query}`);
    return result.url;
  },

  /** The MP4 proxy is smaller than the original and is what the site plays for video premieres. */
  proxyOf(asset: AimcAsset) {
    return asset.representations.find((r) => r.purpose === "proxy");
  },
};
