import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16; // Standard for GCM

/**
 * Encrypts a plain text string using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not defined");
  }

  // Ensure the encryption key is converted to a 32-byte Buffer
  // We expect a 64-character hex string in the environment variable
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte (64-character hex) string");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return IV, ciphertext, and authorization tag concatenated with ":"
  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypts an encrypted string back to plain text
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not defined");
  }

  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte (64-character hex) string");
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 3) { // Expect 3 parts: iv, ciphertext, tag
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, ciphertextHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
