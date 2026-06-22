import { decrypt } from "../crypto";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

/**
 * Publishes a post or Reel to Instagram using the Meta Graph API.
 * Supports image, video, and Reel content publishing.
 * 
 * Flow:
 * 1. Create a media container (POST /v20.0/{ig-user-id}/media)
 * 2. Poll the media container status until it changes from "IN_PROGRESS" to "FINISHED" (or "ERROR")
 * 3. Publish the container (POST /v20.0/{ig-user-id}/media_publish)
 */
export async function publishToInstagram(params: {
  encryptedAccessToken: string;
  instagramUserId: string;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  caption: string;
  isReel?: boolean;
}): Promise<PublishResult> {
  const { encryptedAccessToken, instagramUserId, mediaUrl, mediaType, caption, isReel } = params;

  if (!mediaUrl) {
    throw new Error("Instagram posts require at least one image or video asset.");
  }

  // Decrypt token for API usage

  let accessToken: string;
  try {
    accessToken = decrypt(encryptedAccessToken);
  } catch (err) {
    return { success: false, error: "Failed to decrypt Instagram access token." };
  }

  // If using mock credentials, simulate the posting process
  if (accessToken.startsWith("mock") || instagramUserId.startsWith("mock")) {
    console.log(`[SIMULATION] Publishing to Instagram (User ID: ${instagramUserId})`);
    console.log(`[SIMULATION] Media: ${mediaUrl} (${mediaType}, isReel: ${!!isReel})`);
    console.log(`[SIMULATION] Caption: ${caption}`);
    
    // Simulate transcode/polling delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return {
      success: true,
      platformPostId: `ig_mock_post_${Date.now()}`,
    };
  }

  try {
    const baseUrl = "https://graph.facebook.com/v20.0";
    
    // 1. Create Media Container
    console.log(`Creating Instagram media container for ${mediaUrl}...`);
    
    let containerPayload: Record<string, any> = {
      caption: caption,
      access_token: accessToken,
    };

    if (mediaType === "VIDEO" || isReel) {
      containerPayload = {
        ...containerPayload,
        media_type: "REELS",
        video_url: mediaUrl, // Must be a publicly accessible URL (not localhost unless tunneled via ngrok)
        share_to_feed: "true",
      };
    } else {
      containerPayload = {
        ...containerPayload,
        image_url: mediaUrl, // Must be a publicly accessible URL
      };
    }

    const containerResponse = await fetch(`${baseUrl}/${instagramUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerPayload),
    });

    if (!containerResponse.ok) {
      const errorJson = await containerResponse.json();
      throw new Error(`Failed to create media container: ${JSON.stringify(errorJson.error || errorJson)}`);
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // 2. Poll Container Status (Especially critical for Reels which take time to transcode on Facebook servers)
    console.log(`Media container created (ID: ${containerId}). Polling status...`);
    let isFinished = false;
    let attempts = 0;
    const maxAttempts = 30; // Max 5 minutes (10s intervals)

    while (!isFinished && attempts < maxAttempts) {
      attempts++;
      // Wait 10 seconds between checks
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const statusResponse = await fetch(
        `${baseUrl}/${containerId}?fields=status_code,error_message&access_token=${accessToken}`
      );
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to fetch container status: Status code ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      const statusCode = statusData.status_code;

      console.log(`Poll attempt ${attempts}: Status is "${statusCode}"`);

      if (statusCode === "FINISHED") {
        isFinished = true;
      } else if (statusCode === "ERROR") {
        throw new Error(`Instagram processing error: ${statusData.error_message || "Unknown transcode failure"}`);
      }
    }

    if (!isFinished) {
      throw new Error("Instagram Reels transcode timed out on Meta servers.");
    }

    // 3. Publish the Media Container
    console.log(`Publishing container ${containerId}...`);
    const publishResponse = await fetch(`${baseUrl}/${instagramUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    if (!publishResponse.ok) {
      const errorJson = await publishResponse.json();
      throw new Error(`Failed to publish container: ${JSON.stringify(errorJson.error || errorJson)}`);
    }

    const publishData = await publishResponse.json();
    console.log("Instagram post published successfully!");

    return {
      success: true,
      platformPostId: publishData.id,
    };
  } catch (error: any) {
    console.error("Instagram Publish Exception:", error);
    return {
      success: false,
      error: error.message || "Unknown error during Instagram publishing.",
    };
  }
}
