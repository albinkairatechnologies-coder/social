import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { publishToInstagram } from "./social/instagram";
import { publishToLinkedIn } from "./social/linkedin";

/**
 * Creates background PublishJob entries for a scheduled post.
 */
export async function schedulePostJobs(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error(`Post with ID ${postId} not found.`);
  }

  const runAt = post.scheduledAt || new Date();
  const platforms = JSON.parse(post.platforms) as string[];

  // Create a PublishJob for each target platform
  const jobPromises = platforms.map((platform) => {
    return prisma.publishJob.create({
      data: {
        postId: post.id,
        platform: platform,
        runAt: runAt,
        status: "PENDING",
        maxAttempts: 3,
      },
    });
  });

  await Promise.all(jobPromises);
  
  // Set post status to SCHEDULED (or retain it if it's already set)
  await prisma.post.update({
    where: { id: postId },
    data: { status: "SCHEDULED" },
  });
}

/**
 * Processes all PublishJobs that are due (runAt <= now) and in a runnable state.
 * This is designed to be called by a cron job endpoint or a background worker.
 */
export async function processDueJobs(): Promise<{ processedCount: number; successCount: number; failedCount: number }> {
  const now = new Date();
  
  // Find jobs that are due, pending, or failed but have retries left
  const dueJobs = await prisma.publishJob.findMany({
    where: {
      runAt: { lte: now },
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: prisma.publishJob.fields.maxAttempts }, // attempts < maxAttempts
    },
    include: {
      post: {
        include: {
          media: true,
        },
      },
    },
  });

  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;

  console.log(`[Queue Worker] Found ${dueJobs.length} due jobs to process.`);

  for (const job of dueJobs) {
    processedCount++;
    const post = job.post;

    // 1. Mark job as PROCESSING
    await prisma.publishJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    try {
      // 2. Fetch the connected OAuth Account for this platform
      const account = await prisma.account.findFirst({
        where: {
          userId: post.userId,
          provider: job.platform.toLowerCase(), // 'instagram' or 'linkedin'
        },
      });

      if (!account) {
        throw new Error(`No connected ${job.platform} account found for this user.`);
      }

      const mediaItem = post.media[0]; // Take the primary media asset if attached
      let result: { success: boolean; platformPostId?: string; error?: string };

      if (job.platform === "INSTAGRAM") {
        if (!mediaItem) {
          throw new Error("Instagram posts require at least one image or video asset.");
        }

        // Instagram Graph API requires an absolute public URL.
        // For local development, if media URL is relative, construct a public fallback
        // or let it pass so the simulation mock handles it.
        let publicMediaUrl = mediaItem.url;
        if (mediaItem.url.startsWith("/")) {
          const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          publicMediaUrl = `${appUrl}${mediaItem.url}`;
        }

        result = await publishToInstagram({
          encryptedAccessToken: account.accessToken,
          instagramUserId: account.providerAccountId,
          mediaUrl: publicMediaUrl,
          mediaType: mediaItem.type as "IMAGE" | "VIDEO",
          caption: post.caption,
          isReel: mediaItem.type === "VIDEO",
        });
      } else if (job.platform === "LINKEDIN") {
        let mediaBuffer: Buffer | undefined;
        let mimeType: string | undefined;

        if (mediaItem) {
          // If we have a local upload, read the file into a buffer to perform a binary upload to LinkedIn
          if (mediaItem.url.startsWith("/uploads/")) {
            const localPath = path.join(process.cwd(), "public", mediaItem.url);
            if (fs.existsSync(localPath)) {
              mediaBuffer = await fs.promises.readFile(localPath);
              mimeType = mediaItem.type === "VIDEO" ? "video/mp4" : "image/jpeg";
            }
          } else if (mediaItem.url.startsWith("http")) {
            try {
              console.log(`[Queue Worker] Downloading remote media asset: ${mediaItem.url}`);
              const res = await fetch(mediaItem.url);
              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                mediaBuffer = Buffer.from(arrayBuffer);
                mimeType = res.headers.get("content-type") || (mediaItem.type === "VIDEO" ? "video/mp4" : "image/jpeg");
              } else {
                console.error(`[Queue Worker] Failed to fetch remote media: HTTP ${res.status}`);
              }
            } catch (err) {
              console.error("[Queue Worker] Remote media fetch exception:", err);
            }
          }
        }

        result = await publishToLinkedIn({
          encryptedAccessToken: account.accessToken,
          authorId: account.providerAccountId,
          caption: post.caption,
          mediaBuffer,
          mediaMimeType: mimeType,
          mediaType: mediaItem ? (mediaItem.type as "IMAGE" | "VIDEO") : undefined,
        });
      } else {
        throw new Error(`Unsupported platform: ${job.platform}`);
      }

      // 3. Update Job and Post Status based on result
      if (result.success) {
        successCount++;
        await prisma.publishJob.update({
          where: { id: job.id },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            error: null,
          },
        });
      } else {
        failedCount++;
        throw new Error(result.error || "Unknown publishing error.");
      }
    } catch (error: any) {
      console.error(`[Queue Worker] Job ${job.id} failed:`, error.message);
      
      const updatedJob = await prisma.publishJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= job.maxAttempts ? "FAILED" : "FAILED", // Retries will be triggered next run if under max
          error: error.message || "Failed to publish post.",
        },
      });

      // Update post error logs
      await prisma.post.update({
        where: { id: post.id },
        data: {
          errorLog: `[${job.platform} Error]: ${error.message || "Unknown error"}`,
        },
      });
    }
  }

  // 4. Synchronize overall Post statuses.
  // If all jobs for a post are SUCCESS, mark post as PUBLISHED.
  // If any job failed and has hit max attempts, and no pending jobs remain, mark post as FAILED.
  if (dueJobs.length > 0) {
    const uniquePostIds = Array.from(new Set(dueJobs.map((j) => j.postId)));
    for (const postId of uniquePostIds) {
      const allJobs = await prisma.publishJob.findMany({
        where: { postId: postId },
      });

      const allSuccess = allJobs.every((j) => j.status === "SUCCESS");
      const anyFailedMax = allJobs.some((j) => j.status === "FAILED" && j.attempts >= j.maxAttempts);
      const nonePending = allJobs.every((j) => j.status === "SUCCESS" || j.status === "FAILED");

      if (allSuccess) {
        await prisma.post.update({
          where: { id: postId },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
      } else if (anyFailedMax && nonePending) {
        await prisma.post.update({
          where: { id: postId },
          data: { status: "FAILED" },
        });
      }
    }
  }

  return { processedCount, successCount, failedCount };
}
