import { env } from "@/utils/env.server";
import { NextResponse } from 'next/server';

export async function GET() {
  // Using type-safe server environment
  const apiKey = env.MY_API_KEY; 
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  return NextResponse.json({
    message: "Server-side access successful!",
    hasApiKey: !!apiKey,
    publicUrl: apiUrl,
  });
}
