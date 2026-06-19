import { decrypt } from "../crypto";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

/**
 * Publishes a post to LinkedIn (supports image, video, and text-only posts).
 * Fits both personal Profiles (urn:li:person:ID) and Company Pages (urn:li:organization:ID).
 * 
 * Flow for posts with media:
 * 1. Register media asset (POST /v2/assets?action=registerUpload)
 * 2. Upload file binary via PUT request to the upload URL returned by registration
 * 3. Create UGC Post (POST /v2/ugcPosts) referencing the media URN
 */
export async function publishToLinkedIn(params: {
  encryptedAccessToken: string;
  authorId: string; // E.g., "urn:li:person:ABC123XYZ" or "urn:li:organization:987654"
  caption: string;
  mediaBuffer?: Buffer;
  mediaMimeType?: string;
  mediaType?: "IMAGE" | "VIDEO";
}): Promise<PublishResult> {
  const { encryptedAccessToken, authorId, caption, mediaBuffer, mediaMimeType, mediaType } = params;

  // Decrypt token
  let accessToken: string;
  try {
    accessToken = decrypt(encryptedAccessToken);
  } catch (err) {
    return { success: false, error: "Failed to decrypt LinkedIn access token." };
  }

  // Simulation Mode for development
  if (accessToken.startsWith("mock") || authorId.startsWith("mock")) {
    console.log(`[SIMULATION] Publishing to LinkedIn (Author ID: ${authorId})`);
    console.log(`[SIMULATION] Caption: ${caption}`);
    if (mediaBuffer) {
      console.log(`[SIMULATION] Attached media: ${mediaType} (${mediaBuffer.byteLength} bytes)`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
      success: true,
      platformPostId: `urn:li:share:mock_share_${Date.now()}`,
    };
  }

  try {
    const baseUrl = "https://api.linkedin.com";
    let mediaUrn: string | null = null;

    // 1. If media is attached, upload to LinkedIn
    if (mediaBuffer && mediaType) {
      console.log(`Registering LinkedIn asset upload for ${mediaType}...`);
      
      const registerResponse = await fetch(`${baseUrl}/v2/assets?action=registerUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [
              mediaType === "IMAGE"
                ? "urn:li:digitalmediaRecipe:feedshare-image"
                : "urn:li:digitalmediaRecipe:feedshare-video",
            ],
            owner: authorId,
            supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
          },
        }),
      });

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        throw new Error(`Failed to register asset: ${errorText}`);
      }

      const registerData = await registerResponse.json();
      const uploadMechanism = registerData.value.uploadMechanism;
      const uploadUrl = uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      mediaUrn = registerData.value.asset;

      console.log(`Asset registered (URN: ${mediaUrn}). Uploading binary buffer...`);

      // 2. Upload file binary
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": mediaMimeType || "image/jpeg",
        },
        body: mediaBuffer as any,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Binary file upload failed: Status code ${uploadResponse.status}`);
      }
      console.log("Binary asset uploaded successfully.");
    }

    // 3. Submit UGC Post
    console.log("Submitting LinkedIn UGC Post...");
    
    const ugcPayload: Record<string, any> = {
      author: authorId,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: caption,
          },
          shareMediaCategory: mediaUrn ? (mediaType === "VIDEO" ? "VIDEO" : "IMAGE") : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // Attach media payload if asset is uploaded
    if (mediaUrn) {
      ugcPayload.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          description: {
            text: "Uploaded via SocialForge",
          },
          media: mediaUrn,
          title: {
            text: "Media Attachment",
          },
        },
      ];
    }

    const postResponse = await fetch(`${baseUrl}/v2/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ugcPayload),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`UGC Post submission failed: ${errorText}`);
    }

    const postData = await postResponse.json();
    console.log("LinkedIn UGC Post created successfully!");

    return {
      success: true,
      platformPostId: postData.id,
    };
  } catch (error: any) {
    console.error("LinkedIn Publish Exception:", error);
    return {
      success: false,
      error: error.message || "Unknown error during LinkedIn publishing.",
    };
  }
}
