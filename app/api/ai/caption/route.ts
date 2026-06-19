import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { generateCaptionAndHashtags } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  // Secure the API route with NextAuth session check
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const { prompt, platform } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A valid prompt is required." }, { status: 400 });
    }

    if (!platform || !["instagram", "linkedin", "both"].includes(platform)) {
      return NextResponse.json({ error: "A valid target platform is required." }, { status: 400 });
    }

    const aiResponse = await generateCaptionAndHashtags(prompt, platform as "instagram" | "linkedin" | "both");

    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error("AI Caption API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate caption." },
      { status: 500 }
    );
  }
}
