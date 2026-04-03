import { z } from "zod";

/**
 * Validates and provides type-safe access to PUBLIC environment variables.
 * These are prefixed with NEXT_PUBLIC_ so Next.js makes them 
 * accessible to the browser at build time.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:5083"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export type Env = z.infer<typeof envSchema>;
