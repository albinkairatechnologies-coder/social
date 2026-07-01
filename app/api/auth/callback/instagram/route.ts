import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("Instagram OAuth Error:", errorDescription);
    return NextResponse.redirect(new URL(`/dashboard?status=error&message=${encodeURIComponent(errorDescription || "Access Denied")}`, req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "Authorization code missing." }, { status: 400 });
  }

  try {
    let accessToken = "";
    let instagramUserId = "";
    let platformUsername = "";
    let platformDisplayName = "";
    let platformAvatarUrl = null;
    let expiresSeconds = 5184000; // 60 days default

    // Handle Mock Authentication Flow
    if (code === "mock_code_456" || !process.env.META_CLIENT_ID || process.env.META_CLIENT_ID.startsWith("mock")) {
      console.log("[Instagram OAuth Callback] Simulating successful connection in local dev...");
      accessToken = "mock_instagram_token_" + Math.random().toString(36).substring(2, 10);
      instagramUserId = "17841423545512385"; // Default sandbox profile ID from user's data
      platformUsername = "drivenbyjegus";
      platformDisplayName = "jegus";
    } else {
      // Real OAuth flow
      const clientId = process.env.META_CLIENT_ID;
      const clientSecret = process.env.META_CLIENT_SECRET;
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const redirectUri = `${appUrl}/api/auth/callback/instagram`;

      console.log("[Instagram OAuth Callback] Exchanging code for short-lived token...");
      const tokenResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`);

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokenData = await tokenResponse.json();
      const shortLivedToken = tokenData.access_token;

      console.log("[Instagram OAuth Callback] Upgrading to long-lived user access token...");
      const upgradeResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`);

      if (!upgradeResponse.ok) {
        const errText = await upgradeResponse.text();
        throw new Error(`Token upgrade failed: ${errText}`);
      }

      const upgradeData = await upgradeResponse.json();
      accessToken = upgradeData.access_token;
      expiresSeconds = upgradeData.expires_in || 5184000;

      console.log("[Instagram OAuth Callback] Fetching Facebook Pages and linked Instagram accounts...");
      const pagesResponse = await fetch(`https://graph.facebook.com/v20.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`);

      if (!pagesResponse.ok) {
        const errText = await pagesResponse.text();
        throw new Error(`Failed to fetch connected pages: ${errText}`);
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      // Find the page that has an Instagram Business Account linked
      let linkedInsta = null;
      for (const page of pages) {
        if (page.instagram_business_account) {
          linkedInsta = page.instagram_business_account;
          break;
        }
      }

      if (!linkedInsta) {
        throw new Error("No connected Instagram Business/Creator account found on your Facebook Pages. Please link your Instagram account to a Facebook Page first.");
      }

      instagramUserId = linkedInsta.id;
      platformUsername = linkedInsta.username;
      platformDisplayName = linkedInsta.name || linkedInsta.username;
      platformAvatarUrl = linkedInsta.profile_picture_url || null;
    }

    // Encrypt token
    const encryptedAccessToken = encrypt(accessToken);

    // Save/Upsert Instagram account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "instagram",
          providerAccountId: instagramUserId,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        platformUsername,
        platformDisplayName,
        platformAvatarUrl,
        expiresAt: new Date(Date.now() + expiresSeconds * 1000),
        updatedAt: new Date(),
      },
      create: {
        clientId: "legacy-client",
        provider: "instagram",
        providerAccountId: instagramUserId,
        accessToken: encryptedAccessToken,
        platformUsername,
        platformDisplayName,
        platformAvatarUrl,
        expiresAt: new Date(Date.now() + expiresSeconds * 1000),
      },
    });

    console.log(`[Instagram OAuth Callback] Connected Instagram account: @${platformUsername}`);
    return NextResponse.redirect(new URL("/dashboard?status=success&platform=instagram", req.url));
  } catch (err: any) {
    console.error("Instagram OAuth Callback Exception:", err);
    return NextResponse.redirect(new URL(`/dashboard?status=error&message=${encodeURIComponent(err.message || "Failed to process Instagram callback")}`, req.url));
  }
}
