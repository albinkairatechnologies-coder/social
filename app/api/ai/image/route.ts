import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { generateVerticalImage } from "@/lib/gemini";
import { saveMedia } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Secure the API route with NextAuth session check
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A valid prompt is required." }, { status: 400 });
    }

    // Call Gemini's Imagen 3 API via our wrapper
    const { base64Data, mimeType } = await generateVerticalImage(prompt);
    
    // Convert base64 data to Buffer
    const buffer = Buffer.from(base64Data, "base64");
    
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `ai-gen-${timestamp}.jpg`;

    // Save to storage (local public/uploads or Vercel Blob/Supabase in production)
    const mediaUrl = await saveMedia(buffer, filename, mimeType);

    // Save media log record to the database for this user
    const mediaRecord = await prisma.media.create({
      data: {
        clientId: req.headers.get("x-client-id") || "legacy-client",
        url: mediaUrl,
        type: "IMAGE",
        width: 1024, // Imagen 3 default standard vertical width/height sizing
        height: 1792, // 9:16 aspect ratio equivalent
        size: buffer.byteLength,
        source: "AI_GENERATED",
      },
    });

    return NextResponse.json({
      success: true,
      media: mediaRecord,
    });
  } catch (error: any) {
    console.error("AI Image Generation Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI image." },
      { status: 500 }
    );
  }
}
