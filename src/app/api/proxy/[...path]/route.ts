import { env as publicEnv } from "@/utils/env";
import { NextRequest, NextResponse } from "next/server";

/**
 * A secure proxy to append the private API key to requests
 * before forwarding them to the .NET backend.
 */
async function handleProxy(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const targetUrl = `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/api/${path}`;
    
    // Create new headers from request
    const proxyHeaders = new Headers();
    request.headers.forEach((value, key) => {
      // Forward standard headers, but let fetch handle Host and content-length
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        proxyHeaders.set(key, value);
      }
    });
    
    // Capture the body if present
    const requestBody = request.method !== "GET" ? await request.text() : null;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: requestBody,
      duplex: "half",
    } as any);

    const contentType = response.headers.get("content-type") || "";
    
    // Check if the response is actually JSON
    if (contentType.includes("application/json")) {
      try {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } catch (parseError) {
        // If it's supposed to be JSON but parsing fails (like empty response)
        const text = await response.text();
        if (!text) {
           return NextResponse.json({ success: response.ok, message: "No content returned from server" }, { status: response.status });
        }
        throw new Error(`Failed to parse JSON: ${text.substring(0, 100)}`);
      }
    } else {
      // If NOT JSON (could be text or HTML error), return it as text
      const text = await response.text();
      return NextResponse.json({ 
        success: response.ok, 
        message: "Server returned non-JSON content", 
        data: text.substring(0, 500) 
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Proxy Error: ${error.message || "Unknown error"}`,
        details: error.toString()
      }, 
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;

// You can add GET, PUT, DELETE similar to POST if needed or use a generic handler.
