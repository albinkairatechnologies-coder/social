import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "local-dev-user-id";

  try {
    const { provider, username, displayName } = await req.json();

    if (!provider || !["instagram", "linkedin"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider specified." }, { status: 400 });
    }

    const mockAccessToken = encrypt(`mock_access_token_${provider}_${Date.now()}`);
    const mockRefreshToken = encrypt(`mock_refresh_token_${provider}_${Date.now()}`);
    const providerAccountId = `mock_acc_${provider}_${Date.now()}`;

    // Upsert the connected account in the database
    const account = await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      update: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        platformUsername: username,
        platformDisplayName: displayName,
      },
      create: {
        userId,
        provider,
        providerAccountId,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        platformUsername: username,
        platformDisplayName: displayName,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully connected ${provider === "instagram" ? "Instagram" : "LinkedIn"} account!`,
      account,
    });
  } catch (error: any) {
    console.error("Mock Connect API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect mock account." },
      { status: 500 }
    );
  }
}
