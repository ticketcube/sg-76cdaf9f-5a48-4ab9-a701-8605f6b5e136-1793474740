import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const schedulePath = path.join(process.cwd(), "otw-radio", "config", "schedule.json");
    const scheduleData = await fs.readFile(schedulePath, "utf-8");
    const schedule = JSON.parse(scheduleData);
    
    res.status(200).json(schedule);
  } catch (error) {
    console.error("Failed to load schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
}