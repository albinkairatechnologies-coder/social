import { NextRequest, NextResponse } from "next/server";
import { processDueJobs } from "@/lib/queue";

/**
 * Endpoint to process scheduled social media posts.
 * This can be triggered by:
 * 1. A Vercel Cron Job (cron expression: * * * * *)
 * 2. An Upstash QStash schedule
 * 3. An Inngest background event
 * 4. A local server setInterval worker
 */
export async function GET(req: NextRequest) {
  // Production security check: Verify CRON authorization token if set
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  try {
    const summary = await processDueJobs();
    
    return NextResponse.json({
      success: true,
      message: `Queue process run completed at ${new Date().toISOString()}`,
      ...summary,
    });
  } catch (error: any) {
    console.error("Queue Route Trigger Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process queue." },
      { status: 500 }
    );
  }
}

// Support POST request for standard webhook integrations
export async function POST(req: NextRequest) {
  return GET(req);
}
