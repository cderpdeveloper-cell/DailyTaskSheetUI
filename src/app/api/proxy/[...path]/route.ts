import { env } from "@/utils/env.server";
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
  const path = params.path.join("/");
  const targetUrl = `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/api/${path}`;
  
  const headers = new Headers(request.headers);
  headers.set("X-API-KEY", env.MY_API_KEY);
  
  // Forward everything to the real backend
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" ? await request.text() : null,
      duplex: "half", // Required for body forwarding in some versions
    } as any);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Proxy error" }, 
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
