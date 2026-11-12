import type { NextApiRequest, NextApiResponse } from "next";

function unwrapAIMC(data: any): any {
  if (data?.statusCode && data?.body) {
    try {
      const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
      return body.data || body;
    } catch {
      return data;
    }
  }
  return data.data || data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const baseUrl = process.env.AIMC_API_URL || "https://otw.aimc-ln.com/v1";
  const apiKey = process.env.AIMC_API_KEY;
  const connectorId = process.env.AIMC_UPLOAD_CONNECTOR_ID || "115b2c89-246f-4d8f-8c83-71fd7fe77644";

  if (!apiKey) {
    return res.status(500).json({ error: "AIMC not configured" });
  }

  const results: any = {
    connectorId,
    apiUrl: baseUrl,
    checks: {}
  };

  try {
    // Check 1: List all connectors to verify this one exists and our key can see it
    console.log("[AIMC Diagnostic] Fetching connectors list...");
    const connectorsRes = await fetch(`${baseUrl}/connectors`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    results.checks.listConnectors = {
      status: connectorsRes.status,
      ok: connectorsRes.ok
    };

    if (connectorsRes.ok) {
      const connectorsData = await connectorsRes.json();
      const connectors = unwrapAIMC(connectorsData);
      results.allConnectors = Array.isArray(connectors) ? connectors.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status
      })) : connectors;

      // Find our specific connector
      const ourConnector = Array.isArray(connectors) 
        ? connectors.find((c: any) => c.id === connectorId)
        : null;
      
      if (ourConnector) {
        results.targetConnector = {
          id: ourConnector.id,
          name: ourConnector.name,
          type: ourConnector.type,
          status: ourConnector.status,
          config: ourConnector.config || "N/A"
        };
      } else {
        results.targetConnector = "NOT FOUND - connector ID not in list";
      }
    } else {
      const errorText = await connectorsRes.text();
      results.checks.listConnectors.error = errorText;
    }

    // Check 2: Try to get specific connector details
    console.log("[AIMC Diagnostic] Fetching specific connector...");
    const connectorRes = await fetch(`${baseUrl}/connectors/${connectorId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    results.checks.getConnector = {
      status: connectorRes.status,
      ok: connectorRes.ok
    };

    if (connectorRes.ok) {
      const connectorData = await connectorRes.json();
      results.connectorDetails = unwrapAIMC(connectorData);
    } else {
      const errorText = await connectorRes.text();
      results.checks.getConnector.error = errorText;
    }

    // Check 3: Test upload URL generation with minimal payload
    console.log("[AIMC Diagnostic] Testing upload URL generation...");
    const uploadTestRes = await fetch(`${baseUrl}/assets/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        connector_id: connectorId,
        filename: "diagnostic-test.txt",
        content_type: "text/plain",
        file_size: 100,
        path: process.env.AIMC_UPLOAD_FOLDER || "OTW/OTWL_Audio",
        collection_ids: [],
        method: "PUT"
      })
    });

    results.checks.uploadTest = {
      status: uploadTestRes.status,
      ok: uploadTestRes.ok
    };

    const uploadTestText = await uploadTestRes.text();
    
    if (uploadTestRes.ok) {
      try {
        const uploadTestData = JSON.parse(uploadTestText);
        results.checks.uploadTest.response = "SUCCESS - presigned URL generated";
        results.checks.uploadTest.hasUrl = !!(unwrapAIMC(uploadTestData).url);
      } catch {
        results.checks.uploadTest.response = uploadTestText;
      }
    } else {
      results.checks.uploadTest.error = uploadTestText;
    }

    res.status(200).json(results);

  } catch (error: any) {
    console.error("[AIMC Diagnostic] Exception:", error);
    res.status(500).json({ 
      error: error.message,
      results 
    });
  }
}