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
    console.error("Facebook OAuth Error:", errorDescription);
    return NextResponse.redirect(new URL(`/dashboard?status=error&message=${encodeURIComponent(errorDescription || "Access Denied")}`, req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "Authorization code missing." }, { status: 400 });
  }

  try {
    let accessToken = "";
    let facebookPageId = "";
    let platformUsername = "";
    let platformDisplayName = "";
    let platformAvatarUrl = null;
    let expiresSeconds = 5184000; // 60 days default

    // Handle Mock Authentication Flow
    if (code === "mock_code_facebook" || !process.env.META_CLIENT_ID || process.env.META_CLIENT_ID.startsWith("mock")) {
      console.log("[Facebook OAuth Callback] Simulating successful connection in local dev...");
      accessToken = "mock_facebook_token_" + Math.random().toString(36).substring(2, 10);
      facebookPageId = "mock_fb_page_123456789"; 
      platformUsername = "mock_facebook_page";
      platformDisplayName = "Mock Facebook Page";
    } else {
      // Real OAuth flow
      const clientId = process.env.META_CLIENT_ID;
      const clientSecret = process.env.META_CLIENT_SECRET;
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const redirectUri = `${appUrl}/api/auth/callback/facebook`;

      console.log("[Facebook OAuth Callback] Exchanging code for short-lived token...");
      const tokenResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`);

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokenData = await tokenResponse.json();
      const shortLivedToken = tokenData.access_token;

      console.log("[Facebook OAuth Callback] Upgrading to long-lived user access token...");
      const upgradeResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`);

      if (!upgradeResponse.ok) {
        const errText = await upgradeResponse.text();
        throw new Error(`Token upgrade failed: ${errText}`);
      }

      const upgradeData = await upgradeResponse.json();
      const longLivedUserToken = upgradeData.access_token;

      console.log("[Facebook OAuth Callback] Fetching Facebook Pages...");
      const pagesResponse = await fetch(`https://graph.facebook.com/v20.0/me/accounts?fields=name,access_token,picture{url}&access_token=${longLivedUserToken}`);

      if (!pagesResponse.ok) {
        const errText = await pagesResponse.text();
        throw new Error(`Failed to fetch connected pages: ${errText}`);
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      if (pages.length === 0) {
        throw new Error("No connected Facebook Pages found for your account.");
      }

      // For simplicity, take the first page
      const page = pages[0];

      accessToken = page.access_token; // Use Page Access Token
      facebookPageId = page.id;
      platformUsername = page.name.replace(/\s+/g, '_').toLowerCase();
      platformDisplayName = page.name;
      platformAvatarUrl = page.picture?.data?.url || null;
    }

    // Encrypt token
    const encryptedAccessToken = encrypt(accessToken);

    // Save/Upsert Facebook account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "facebook",
          providerAccountId: facebookPageId,
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
        provider: "facebook",
        providerAccountId: facebookPageId,
        accessToken: encryptedAccessToken,
        platformUsername,
        platformDisplayName,
        platformAvatarUrl,
        expiresAt: new Date(Date.now() + expiresSeconds * 1000),
      },
    });

    console.log(`[Facebook OAuth Callback] Connected Facebook account: @${platformUsername}`);
    return NextResponse.redirect(new URL("/dashboard?status=success&platform=facebook", req.url));
  } catch (err: any) {
    console.error("Facebook OAuth Callback Exception:", err);
    return NextResponse.redirect(new URL(`/dashboard?status=error&message=${encodeURIComponent(err.message || "Failed to process Facebook callback")}`, req.url));
  }
}
