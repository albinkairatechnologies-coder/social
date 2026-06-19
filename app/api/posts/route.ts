import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { schedulePostJobs, processDueJobs } from "@/lib/queue";

export async function POST(req: NextRequest) {
  // Session check
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const { caption, firstComment, hashtags, platforms, scheduledAt, mediaUrl, mediaType } = await req.json();

    // Form validations
    if (!caption || typeof caption !== "string") {
      return NextResponse.json({ error: "Post caption is required." }, { status: 400 });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "At least one target platform must be selected." }, { status: 400 });
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    const isPublishImmediately = !scheduledDate || scheduledDate <= new Date();

    // 1. Create the Post database entry
  const post = await prisma.post.create({
    data: {
      userId: session.user.id,
      caption: caption,
      firstComment: firstComment || null,
      hashtags: hashtags || null,
      status: isPublishImmediately ? "PROCESSING" : "SCHEDULED",
      scheduledAt: scheduledDate || new Date(),
      platforms: JSON.stringify(platforms),
    },
  });

    // 2. If media URL is attached, associate the media with the post
    if (mediaUrl) {
      // Find the media record (either created by AI or local upload)
      const existingMedia = await prisma.media.findFirst({
        where: {
          userId: session.user.id,
          url: mediaUrl,
        },
      });

      if (existingMedia) {
        await prisma.media.update({
          where: { id: existingMedia.id },
          data: { postId: post.id },
        });
      } else {
        // Create new media log if it wasn't tracked yet
        await prisma.media.create({
          data: {
            userId: session.user.id,
            postId: post.id,
            url: mediaUrl,
            type: mediaType || "IMAGE",
            source: "UPLOAD",
          },
        });
      }
    }

    // 3. Create scheduled publish jobs
    await schedulePostJobs(post.id);

    // 4. If publishing immediately, execute the queue runner synchronously
    if (isPublishImmediately) {
      console.log(`[Composer API] Running immediate publish execution for post ${post.id}...`);
      await processDueJobs();
      
      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id },
      });

      return NextResponse.json({
        success: true,
        message: updatedPost?.status === "PUBLISHED" 
          ? "Post has been published successfully!" 
          : `Post publication initialized. Status: ${updatedPost?.status}. Details: ${updatedPost?.errorLog || ""}`,
        post: updatedPost,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Post successfully scheduled for ${scheduledDate?.toLocaleString()}`,
      post: post,
    });
  } catch (error: any) {
    console.error("Post Submission API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit post." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.userId !== session.user.id) {
      return NextResponse.json({ error: "Post not found or unauthorized." }, { status: 404 });
    }

    // Delete the post record from Prisma db
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: "Post deleted successfully from schedule." });
  } catch (error: any) {
    console.error("Post Deletion API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete post." },
      { status: 505 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.userId !== session.user.id) {
      return NextResponse.json({ error: "Post not found or unauthorized." }, { status: 404 });
    }

    // Reset scheduled time to now and status to PROCESSING so it is immediately due
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PROCESSING",
        scheduledAt: new Date(),
        errorLog: null,
      },
    });

    // Reset pending/failed publish jobs for this post so the queue worker retries them immediately
    await prisma.publishJob.updateMany({
      where: {
        postId: postId,
        status: { in: ["PENDING", "FAILED"] },
      },
      data: {
        runAt: new Date(),
        status: "PENDING",
        attempts: 0,
        error: null,
      },
    });

    // Execute queue runner synchronously
    await processDueJobs();

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: updatedPost?.status === "PUBLISHED"
        ? "Post has been published successfully!"
        : `Post publication initialized. Status: ${updatedPost?.status}. Details: ${updatedPost?.errorLog || ""}`,
      post: updatedPost,
    });
  } catch (error: any) {
    console.error("Immediate Publication API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish post immediately." },
      { status: 500 }
    );
  }
}


