import { config } from "./config.js";

/**
 * AIMC is the OTW media lake, an AWS Media Lake deployment (S3-backed). Assets carry tags
 * such as Artist, Series, Format and Artist Spotify ID, plus derived representations (an MP4
 * proxy and a thumbnail) and media info.
 *
 * Routes follow the Media Lake API (aws-solutions-library-samples/guidance-for-medialake-on-aws):
 *   GET  /assets/{inventoryId}              -> { data: { asset } }
 *   POST /assets/generate-presigned-url     -> { data: { presigned_url, expires_in } }
 * Auth is an AIMC API key in the X-API-Key header.
 */

export interface AimcAsset {
  id: string;
  name: string;
  type: "Video" | "Audio" | "Image";
  tags: Record<string, string>;
  media?: { durationSec?: number };
  representations: { id: string; purpose: "proxy" | "thumbnail" | string; format: string }[];
}

/** The subset of the raw Media Lake asset record the radio reads. */
interface RawAsset {
  InventoryID: string;
  DigitalSourceAsset?: {
    Type?: string;
    MainRepresentation?: { StorageInfo?: { PrimaryLocation?: { ObjectKey?: { Name?: string } } } };
  };
  DerivedRepresentations?: {
    ID: string;
    Purpose: string;
    Format: string;
    VideoSpec?: { Duration?: number };
    AudioSpec?: { Duration?: number };
  }[];
  Metadata?: { CustomMetadata?: Record<string, unknown> };
}

async function call<T>(route: string, init?: { method: string; body: unknown }): Promise<T> {
  const res = await fetch(`${config.aimc.baseUrl()}${route}`, {
    method: init?.method ?? "GET",
    headers: {
      "X-API-Key": config.aimc.apiKey(),
      Accept: "application/json",
      ...(init ? { "Content-Type": "application/json" } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new Error(`AIMC ${route} failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data?: T };
  return json.data as T;
}

/** Flattens custom metadata into string tags, keeping only scalar values. */
function tagsOf(raw: RawAsset): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw.Metadata?.CustomMetadata ?? {})) {
    if (typeof value === "string" || typeof value === "number") tags[key] = String(value);
  }
  return tags;
}

export const aimc = {
  async getAsset(id: string): Promise<AimcAsset> {
    const { asset: raw } = await call<{ asset: RawAsset }>(`/assets/${encodeURIComponent(id)}`);
    const reps = raw.DerivedRepresentations ?? [];
    const duration = reps.map((r) => r.VideoSpec?.Duration ?? r.AudioSpec?.Duration).find((d) => d !== undefined);
    return {
      id: raw.InventoryID,
      name: raw.DigitalSourceAsset?.MainRepresentation?.StorageInfo?.PrimaryLocation?.ObjectKey?.Name ?? raw.InventoryID,
      type: (raw.DigitalSourceAsset?.Type ?? "Video") as AimcAsset["type"],
      tags: tagsOf(raw),
      media: duration === undefined ? undefined : { durationSec: duration },
      representations: reps.map((r) => ({ id: r.ID, purpose: r.Purpose, format: r.Format })),
    };
  },

  /**
   * Short-lived presigned URL for the original file, or for a derived representation when
   * `purpose` is given (for example "proxy"). AIMC falls back to the original if the asset has
   * no representation with that purpose.
   */
  async getDownloadUrl(id: string, purpose?: string, expirationSec = 3600): Promise<string> {
    const result = await call<{ presigned_url: string }>("/assets/generate-presigned-url", {
      method: "POST",
      body: { inventory_id: id, expiration_time: expirationSec, ...(purpose ? { purpose } : {}) },
    });
    return result.presigned_url;
  },

  /** The MP4 proxy is smaller than the original and is what the site plays for video premieres. */
  proxyOf(asset: AimcAsset) {
    return asset.representations.find((r) => r.purpose === "proxy");
  },
};
