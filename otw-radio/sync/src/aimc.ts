import { config } from "./config.js";

/**
 * AIMC is the OTW media lake (S3-backed). Assets carry tags such as Artist, Series, Format
 * and Artist Spotify ID, plus representations (an MP4 proxy and a thumbnail) and media info
 * (durationSec, codecs).
 *
 * The two routes below are placeholders: replace them with the real AIMC REST endpoints
 * for "get asset" and "get presigned download link" once the AIMC team confirms them.
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
  // TODO(aimc): confirm route.
  getAsset: (id: string) => call<AimcAsset>(`/assets/${encodeURIComponent(id)}`),

  // TODO(aimc): confirm route. Should return a short-lived presigned URL.
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
