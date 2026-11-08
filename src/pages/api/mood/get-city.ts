import type { NextApiRequest, NextApiResponse } from "next";

// Get user's city from IP address using ip-api.com (free, no key required)
async function getCityFromIP(ip: string): Promise<string> {
  try {
    // Skip private/local IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return "Local";
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,status,message`, {
      headers: { "User-Agent": "OTW-Radio/1.0" }
    });
    
    if (!response.ok) throw new Error("Geolocation service unavailable");
    
    const data = await response.json();
    
    if (data.status === "success" && data.city) {
      return data.city;
    }
    
    return "Unknown";
  } catch (error) {
    console.error("IP geolocation failed:", error);
    return "Unknown";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get city from IP address
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "127.0.0.1";
  const city = await getCityFromIP(ip);

  return res.status(200).json({ city });
}