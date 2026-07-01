import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, accessToken, refreshToken, providerAccountId, username, displayName } = await req.json();

    if (!provider || !accessToken || !providerAccountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["instagram", "linkedin", "twitter", "facebook"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Encrypt tokens
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

    // Upsert account
    const account = await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        platformUsername: username,
        platformDisplayName: displayName,
        updatedAt: new Date(),
      },
      create: {
        clientId: "legacy-client",
        provider,
        providerAccountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        platformUsername: username,
        platformDisplayName: displayName,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error("Manual Connect Error:", error);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}
