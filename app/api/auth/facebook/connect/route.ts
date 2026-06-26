import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  const clientId = process.env.META_CLIENT_ID;
  if (!clientId || clientId.startsWith("mock")) {
    console.log("[Facebook OAuth Connect] Using mock local credentials fallback...");
    const redirectUrl = new URL("/api/auth/callback/facebook?code=mock_code_facebook", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;
  
  // Facebook Graph API scopes
  const scope = "pages_manage_posts,pages_read_engagement,pages_show_list,public_profile";

  // Force account selection/re-authentication using auth_type=reauthenticate
  const authorizationUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&auth_type=reauthenticate`;

  console.log(`[Facebook OAuth Connect] Redirecting to: ${authorizationUrl}`);
  return NextResponse.redirect(authorizationUrl);
}
