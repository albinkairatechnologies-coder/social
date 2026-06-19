import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate safe unique filename
    const fileExt = path.extname(file.name) || ".jpg";
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}_${uniqueId}${fileExt}`;

    let mediaUrl = "";

    // Upload to Vercel Blob if deployed on Vercel with token configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log("[Upload API] Uploading media to Vercel Blob storage...");
      const blob = await put(fileName, file, { access: "public" });
      mediaUrl = blob.url;
    } else {
      console.log("[Upload API] Uploading media to local public/uploads directory...");
      // Ensure upload directory exists inside public/
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Write file to disk
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      mediaUrl = `/uploads/${fileName}`;
    }
    const mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";

    // Track the media upload in Prisma database
    const media = await prisma.media.create({
      data: {
        userId: session.user.id,
        url: mediaUrl,
        type: mediaType,
        source: "UPLOAD",
        size: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      type: mediaType,
      media,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process file upload." },
      { status: 500 }
    );
  }
}
