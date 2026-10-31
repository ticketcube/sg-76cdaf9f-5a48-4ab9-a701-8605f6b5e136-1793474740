import path from "node:path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

export const config = {
  azuracast: {
    baseUrl: () => required("AZURACAST_URL").replace(/\/$/, ""),
    apiKey: () => required("AZURACAST_API_KEY"),
    stationId: () => required("AZURACAST_STATION_ID"),
  },
  aimc: {
    baseUrl: () => required("AIMC_API_URL").replace(/\/$/, ""),
    apiKey: () => required("AIMC_API_KEY"),
  },
  configDir: process.env.OTW_CONFIG_DIR ?? path.resolve(process.cwd(), "../config"),
  workDir: process.env.OTW_WORK_DIR ?? path.resolve(process.cwd(), ".work"),
};
