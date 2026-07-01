import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filter = (session.user as any).role === "ADMIN" 
      ? { userId: session.user.id }
      : { id: (session.user as any).clientId };
      
    const clients = await prisma.client.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            clientTasks: { where: { status: "PENDING" } },
            posts: true,
            accounts: true
          }
        }
      }
    });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("GET Clients Error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, company, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admins can create clients" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    // Hash password and create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const clientUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
      }
    });

    const client = await prisma.client.create({
      data: {
        userId: session.user.id, // Admin who owns the client
        loginUserId: clientUser.id, // The new login account
        name,
        company,
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("POST Client Error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
