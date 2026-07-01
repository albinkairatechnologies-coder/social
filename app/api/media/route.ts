import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Local dev fallback if session is not set up
  const userId = session?.user?.id || "local-dev-user-id";

  try {
    const media = await prisma.media.findMany({
      where: { clientId: "legacy-client" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error: any) {
    console.error("Media Fetch API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load media assets." },
      { status: 500 }
    );
  }
}
