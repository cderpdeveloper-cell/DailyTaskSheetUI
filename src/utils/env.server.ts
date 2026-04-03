import { z } from "zod";

/**
 * Validates and provides type-safe access to PRIVATE environment variables.
 * These are ONLY available on the server (API routes, Server Components, etc).
 */
const envServerSchema = z.object({
  MY_API_KEY: z.string().min(1, "vVkx8gEF8OpLsi+Pwc6+VjJF3OZKeJzQx6JlLsNFUmY="),
});

// Since this is a server-side only file, we want this to error 
// if it's imported on the client OR if variables are missing.
export const env = envServerSchema.parse({
  MY_API_KEY: process.env.MY_API_KEY,
});

export type EnvServer = z.infer<typeof envServerSchema>;
