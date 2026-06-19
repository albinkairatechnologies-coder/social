import fs from "fs";
import path from "path";

/**
 * Saves a media file buffer to storage.
 * In development, it saves to the local public/uploads directory.
 * In production, it can be extended to use Vercel Blob or Supabase Storage.
 */
export async function saveMedia(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  // Production config hook: Vercel Blob Storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // In production, we would run:
      // const { put } = require("@vercel/blob");
      // const blob = await put(`media/${filename}`, buffer, {
      //   access: "public",
      //   contentType: mimeType,
      // });
      // return blob.url;
    } catch (err) {
      console.error("Vercel Blob upload failed, falling back to local:", err);
    }
  }

  // Production config hook: Supabase Storage
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL) {
    try {
      // In production, we would upload to Supabase bucket:
      // const { createClient } = require("@supabase/supabase-js");
      // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      // const { data, error } = await supabase.storage
      //   .from("social-media")
      //   .upload(`posts/${filename}`, buffer, { contentType: mimeType, upsert: true });
      // if (data) return `${process.env.SUPABASE_URL}/storage/v1/object/public/social-media/${data.path}`;
    } catch (err) {
      console.error("Supabase Storage upload failed, falling back to local:", err);
    }
  }

  // Local Storage Fallback (ideal for local development and offline runs)
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  // Create directory if it does not exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = path.join(uploadDir, cleanFilename);
  
  await fs.promises.writeFile(filePath, buffer);

  // Return the public-accessible local path
  return `/uploads/${cleanFilename}`;
}
