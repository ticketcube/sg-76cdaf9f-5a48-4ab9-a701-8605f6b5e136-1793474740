import type { NextApiRequest, NextApiResponse } from "next";

// Get user's city from IP address using ip-api.com (free, no key required)
async function getCityFromIP(ip: string): Promise<{ city: string; method: string }> {
  try {
    // Skip private/local IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return { city: "Local", method: "private-ip" };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,status,message`, {
      headers: { "User-Agent": "OTW-Radio/1.0" },
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (!response.ok) throw new Error("Geolocation service unavailable");
    
    const data = await response.json();
    
    if (data.status === "success" && data.city) {
      return { city: data.city, method: "ip-api" };
    }
    
    return { city: "Unknown", method: "ip-api-failed" };
  } catch (error) {
    console.error("IP geolocation failed:", error);
    return { city: "Unknown", method: "error" };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Try multiple IP header sources (for mobile networks, CDNs, proxies)
  const headers = req.headers;
  let ip = "127.0.0.1";
  let source = "fallback";

  // Priority order for IP detection
  const ipSources = [
    { header: "x-real-ip", name: "x-real-ip" },
    { header: "x-forwarded-for", name: "x-forwarded-for" },
    { header: "cf-connecting-ip", name: "cloudflare" }, // Cloudflare
    { header: "x-client-ip", name: "x-client-ip" },
    { header: "true-client-ip", name: "true-client-ip" },
  ];

  for (const { header, name } of ipSources) {
    const value = headers[header];
    if (value) {
      source = name;
      if (typeof value === "string") {
        // Take first IP if comma-separated
        ip = value.split(",")[0].trim();
      } else if (Array.isArray(value)) {
        ip = value[0].trim();
      }
      break;
    }
  }

  // Fallback to socket address
  if (ip === "127.0.0.1" && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
    source = "socket";
  }

  console.log(`[get-city] IP: ${ip}, Source: ${source}`);

  const { city, method } = await getCityFromIP(ip);

  return res.status(200).json({ 
    city, 
    ip_source: source,
    detection_method: method,
    needs_fallback: city === "Unknown" || city === "Local"
  });
}