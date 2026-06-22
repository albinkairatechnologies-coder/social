import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "local-dev-user-id";

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      response: "AI Copilot: Please configure GEMINI_API_KEY in your .env file to enable chat assistant functions."
    });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required." }, { status: 400 });
    }

    // 1. Retrieve current workspace state for context
    const accounts = await prisma.account.findMany({
      where: { userId },
    });

    const posts = await prisma.post.findMany({
      where: { userId },
      include: { analytics: true },
      orderBy: { createdAt: "desc" },
      take: 10, // last 10 posts for context
    });

    const totalScheduled = posts.filter(p => p.status === "SCHEDULED").length;
    const totalPublished = posts.filter(p => p.status === "PUBLISHED").length;
    const totalFailed = posts.filter(p => p.status === "FAILED").length;
    
    // Sum analytics
    let totalImpressions = 0;
    let totalLikes = 0;
    let totalComments = 0;
    posts.forEach(p => {
      p.analytics.forEach(a => {
        totalImpressions += a.impressions;
        totalLikes += a.likes;
        totalComments += a.comments;
      });
    });

    // 2. Build system context
    const workspaceContext = `
      You are the SocialForge AI Copilot, an advanced built-in marketing operations assistant.
      The user is asking a question in their social media scheduling dashboard.
      Here is the CURRENT real-time data from their workspace:
      - Connected Accounts: ${accounts.map(a => `${a.provider} (${a.platformUsername})`).join(", ") || "None"}
      - Post Queue Statistics:
        - Scheduled (Pending): ${totalScheduled} posts
        - Published: ${totalPublished} posts
        - Failed: ${totalFailed} posts
      - Total Analytics (Published Posts):
        - Impressions/Reach: ${totalImpressions}
        - Likes: ${totalLikes}
        - Comments: ${totalComments}
      
      Recent Post Content:
      ${posts.map((p, i) => `${i+1}. [Status: ${p.status}, Platform(s): ${p.platforms}] "${p.caption.substring(0, 100)}..."`).join("\n")}

      Guidelines:
      - Keep responses concise, professional, and directly actionable.
      - Provide copywriting optimization advice, caption template generation, post diagnostic checklists, or time recommendations based on their actual statistics.
      - Use bullet points and spacing to make recommendations easy to read.
      - Do not hallucinate metrics outside the provided workspace data, but do analyze their actual data.
    `;

    // 3. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format chat history for Gemini API
    const formattedContents = [
      {
        role: "user",
        parts: [{ text: `${workspaceContext}\n\nInitialize Copilot context. Keep this context in mind for all following conversation.` }]
      },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    ];

    const result = await model.generateContent({
      contents: formattedContents,
    });

    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      response: responseText,
    });
  } catch (error: any) {
    console.error("AI Copilot API Error:", error);
    return NextResponse.json({
      success: false,
      response: "AI Copilot encountered an issue while generating a response. Please verify your GEMINI_API_KEY."
    });
  }
}
