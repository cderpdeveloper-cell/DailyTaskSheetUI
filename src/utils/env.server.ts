import { z } from "zod";

/**
 * Validates and provides type-safe access to PRIVATE environment variables.
 * These are ONLY available on the server (API routes, Server Components, etc).
 */
const envServerSchema = z.object({});

// Since this is a server-side only file, we want this to error 
// if it's imported on the client.
export const env = envServerSchema.parse({});

export type EnvServer = z.infer<typeof envServerSchema>;
