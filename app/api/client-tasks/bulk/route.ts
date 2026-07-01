import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { videoCount = 0, posterCount = 0, clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
    }

    if (typeof videoCount !== 'number' || typeof posterCount !== 'number') {
      return NextResponse.json({ error: "Invalid counts provided." }, { status: 400 });
    }

    const tasksToCreate = [];

    // Queue up video tasks
    for (let i = 1; i <= videoCount; i++) {
      tasksToCreate.push({
        clientId,
        title: `Planned Video Task #${i}`,
        type: "VIDEO",
        status: "PENDING"
      });
    }

    // Queue up poster tasks
    for (let i = 1; i <= posterCount; i++) {
      tasksToCreate.push({
        clientId,
        title: `Planned Poster Task #${i}`,
        type: "POSTER",
        status: "PENDING"
      });
    }

    if (tasksToCreate.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Bulk create in Prisma
    const createdTasks = await prisma.clientTask.createMany({
      data: tasksToCreate
    });

    return NextResponse.json({ success: true, count: createdTasks.count });
  } catch (error: any) {
    console.error("Bulk Create Task API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate tasks." },
      { status: 500 }
    );
  }
}
