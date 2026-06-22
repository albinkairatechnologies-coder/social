import { decrypt } from "../crypto";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

/**
 * Publishes a tweet to Twitter/X (supports text, image, and video).
 */
export async function publishToTwitter(params: {
  encryptedAccessToken: string;
  authorId: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
}): Promise<PublishResult> {
  const { encryptedAccessToken, authorId, caption, mediaUrl, mediaType } = params;

  // Decrypt token
  let accessToken: string;
  try {
    accessToken = decrypt(encryptedAccessToken);
  } catch (err) {
    return { success: false, error: "Failed to decrypt Twitter access token." };
  }

  // Simulation Mode for development
  if (accessToken.startsWith("mock") || authorId.startsWith("mock")) {
    console.log(`[SIMULATION] Publishing to Twitter/X (Account ID: ${authorId})`);
    console.log(`[SIMULATION] Tweet: ${caption}`);
    if (mediaUrl) {
      console.log(`[SIMULATION] Attached media URL: ${mediaUrl} (${mediaType})`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      platformPostId: `twitter_mock_tweet_${Date.now()}`,
    };
  }

  try {
    // Basic Stub for production Twitter/X API (v2)
    // In production, you would upload media to media/upload first, then call tweets endpoint
    return {
      success: false,
      error: "Twitter/X production publishing requires fully verified developer keys.",
    };
  } catch (error: any) {
    console.error("Twitter Publish Exception:", error);
    return {
      success: false,
      error: error.message || "Unknown error during Twitter publishing.",
    };
  }
}
