import { env } from "@/utils/env";

const isClient = typeof window !== "undefined";

export const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
export const API_URL = `${API_BASE_URL}/api`;

/**
 * Helper to get the full URL for any resource (like images, logos, etc.)
 * @param path The relative path from the server root
 * @returns The full URL string
 */
export const getFullUrl = (path: string | null | undefined) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Ensure we don't have double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
