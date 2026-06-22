import { decrypt } from "../crypto";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

/**
 * Publishes a post to Facebook Page/Profile (supports image, video, and text-only posts).
 */
export async function publishToFacebook(params: {
  encryptedAccessToken: string;
  pageId: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
}): Promise<PublishResult> {
  const { encryptedAccessToken, pageId, caption, mediaUrl, mediaType } = params;

  // Decrypt token
  let accessToken: string;
  try {
    accessToken = decrypt(encryptedAccessToken);
  } catch (err) {
    return { success: false, error: "Failed to decrypt Facebook access token." };
  }

  // Simulation Mode for development
  if (accessToken.startsWith("mock") || pageId.startsWith("mock")) {
    console.log(`[SIMULATION] Publishing to Facebook Page (Page ID: ${pageId})`);
    console.log(`[SIMULATION] Message: ${caption}`);
    if (mediaUrl) {
      console.log(`[SIMULATION] Attached media: ${mediaUrl} (${mediaType})`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      platformPostId: `fb_mock_post_${Date.now()}`,
    };
  }

  try {
    // Basic Stub for production Facebook Graph API
    return {
      success: false,
      error: "Facebook production publishing requires verified Page Access Tokens.",
    };
  } catch (error: any) {
    console.error("Facebook Publish Exception:", error);
    return {
      success: false,
      error: error.message || "Unknown error during Facebook publishing.",
    };
  }
}
