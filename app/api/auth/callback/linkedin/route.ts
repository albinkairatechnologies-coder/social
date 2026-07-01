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
    console.error("LinkedIn OAuth Error:", errorDescription);
    return NextResponse.redirect(new URL(`/dashboard?status=error&message=${encodeURIComponent(errorDescription || "Access Denied")}`, req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "Authorization code missing." }, { status: 400 });
  }

  try {
    let accessToken = "";
    let userId = "";
    let displayName = "";
    let platformUsername = "";
    let expiresSeconds = 5184000; // 60 days default

    // Handle Mock Authentication Flow
    if (code === "mock_code_123" || !process.env.LINKEDIN_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID.startsWith("mock")) {
      console.log("[LinkedIn OAuth Callback] Simulating successful connection in local dev...");
      accessToken = "mock_linkedin_token_" + Math.random().toString(36).substring(2, 10);
      userId = "LP1DyyYHww"; // Default sandbox profile URN ID from user
      displayName = "ALBIN JEGUS (Sandbox)";
      platformUsername = "jegusselvaraj@gmail.com";
    } else {
      // Real OAuth flow
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const redirectUri = `${appUrl}/api/auth/callback/linkedin`;

      console.log("[LinkedIn OAuth Callback] Exchanging authorization code for token...");
      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId!,
          client_secret: clientSecret!,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      expiresSeconds = tokenData.expires_in || 5184000;

      console.log("[LinkedIn OAuth Callback] Retrieving profile information from OIDC userinfo...");
      const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch LinkedIn user info.");
      }

      const profileData = await profileResponse.json();
      userId = profileData.sub;
      displayName = profileData.name;
      platformUsername = profileData.email || displayName;
    }

    // Encrypt token
    const encryptedAccessToken = encrypt(accessToken);

    // Save/Upsert account details in database associated with current user session
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "linkedin",
          providerAccountId: `urn:li:person:${userId}`,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        platformUsername,
        platformDisplayName: displayName,
        expiresAt: new Date(Date.now() + expiresSeconds * 1000),
        updatedAt: new Date(),
      },
      create: {
        clientId: "legacy-client",
        provider: "linkedin",
        providerAccountId: `urn:li:person:${userId}`,
        accessToken: encryptedAccessToken,
        platformUsername,
        platformDisplayName: displayName,
        expiresAt: new Date(Date.now() + expiresSeconds * 1000),
      },
    });

    console.log(`[LinkedIn OAuth Callback] Successfully connected account for user ${displayName}`);
    return NextResponse.redirect(new URL("/dashboard?status=success&platform=linkedin", req.url));
  } catch (err: any) {
    console.error("LinkedIn OAuth Callback Exception:", err);
    return NextResponse.redirect(new URL(`/dashboard?status=error&message=${encodeURIComponent(err.message || "Failed to process LinkedIn callback")}`, req.url));
  }
}
