import { config } from "./config.js";

/**
 * Minimal AzuraCast API client. Field names follow the AzuraCast API as of 0.20.x;
 * check them against the API docs on your own instance (Help -> API) before going live.
 */

export interface ScheduleItem {
  start_time: number;
  end_time: number;
  start_date?: string | null;
  end_date?: string | null;
  days?: number[];
  loop_once?: boolean;
}

export interface PlaylistInput {
  name: string;
  type?: "default" | "once_per_x_songs" | "once_per_x_minutes" | "once_per_hour" | "custom";
  source?: "songs" | "remote_url";
  order?: "shuffle" | "random" | "sequential";
  is_enabled?: boolean;
  weight?: number;
  include_in_requests?: boolean;
  avoid_duplicates?: boolean;
  backend_options?: string[];
  schedule_items?: ScheduleItem[];
}

export interface Playlist extends PlaylistInput {
  id: number;
}

export interface StationMedia {
  id: number;
  path: string;
  title?: string;
  artist?: string;
}

async function call<T>(method: string, route: string, body?: unknown): Promise<T> {
  const url = `${config.azuracast.baseUrl()}/api${route}`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-API-Key": config.azuracast.apiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`AzuraCast ${method} ${route} failed: ${res.status} ${await res.text()}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const station = () => `/station/${config.azuracast.stationId()}`;

export const azuracast = {
  listPlaylists: () => call<Playlist[]>("GET", `${station()}/playlists`),

  createPlaylist: (input: PlaylistInput) => call<Playlist>("POST", `${station()}/playlists`, input),

  updatePlaylist: (id: number, input: Partial<PlaylistInput>) =>
    call<unknown>("PUT", `${station()}/playlist/${id}`, input),

  /** Creates the playlist if no playlist has this name, otherwise updates it in place. */
  async upsertPlaylist(input: PlaylistInput): Promise<Playlist> {
    const existing = (await this.listPlaylists()).find((p) => p.name === input.name);
    if (!existing) return this.createPlaylist(input);
    await this.updatePlaylist(existing.id, input);
    return { ...existing, ...input };
  },

  /** Lists all media files in the station library. */
  listFiles: () => call<StationMedia[]>("GET", `${station()}/files`),

  /** Uploads a file into the station media library at the given relative path. */
  uploadFile: (relativePath: string, contents: Buffer) =>
    call<StationMedia>("POST", `${station()}/files`, {
      path: relativePath,
      file: contents.toString("base64"),
    }),

  /** Assigns a media file to playlists and sets its custom fields (aimc_asset_id, has_video). */
  updateFile: (
    mediaId: number,
    update: { playlists?: number[]; custom_fields?: Record<string, string>; title?: string; artist?: string },
  ) =>
    call<unknown>("PUT", `${station()}/file/${mediaId}`, {
      ...update,
      playlists: update.playlists?.map((id) => ({ id })),
    }),
};
