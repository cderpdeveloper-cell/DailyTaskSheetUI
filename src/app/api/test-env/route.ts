import { env } from "@/utils/env.server";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Using type-safe server environment
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  return NextResponse.json({
    message: "Server-side access successful!",
    publicUrl: apiUrl,
  });
}
