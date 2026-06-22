import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId || clientId.startsWith("mock")) {
    console.log("[LinkedIn OAuth Connect] Using mock local credentials fallback...");
    const redirectUrl = new URL("/api/auth/callback/linkedin?code=mock_code_123", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/callback/linkedin`;
  
  // Standard scopes for openid, user profile info, and publishing permissions
  const scope = "openid profile email w_member_social";

  // Force login prompt with prompt=login
  const authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&prompt=login`;

  console.log(`[LinkedIn OAuth Connect] Redirecting to: ${authorizationUrl}`);
  return NextResponse.redirect(authorizationUrl);
}
