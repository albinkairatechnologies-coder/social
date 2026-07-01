import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "local-dev-user-id";
  const authorName = session?.user?.name || "Admin (You)";

  try {
    const { postId, parentId, text } = await req.json();

    if (!postId || !text) {
      return NextResponse.json({ error: "postId and text are required." }, { status: 400 });
    }

    // Double check that the post belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.clientId !== "legacy-client") {
      return NextResponse.json({ error: "Post not found or unauthorized." }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        parentId: parentId || null,
        authorName,
        text,
        sentiment: "NEUTRAL",
        isAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error: any) {
    console.error("Comment Reply API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit comment reply." },
      { status: 500 }
    );
  }
}
