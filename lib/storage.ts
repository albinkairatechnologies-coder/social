import { put } from "@vercel/blob";

/**
 * Saves a media file buffer to storage using Vercel Blob.
 */
export async function saveMedia(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  console.log("[Storage Utility] Uploading media to Vercel Blob storage...");
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blob = await put(cleanFilename, buffer, {
    access: "public",
    contentType: mimeType,
  });
  return blob.url;
}

