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

    // Generate safe unique filename
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}_${uniqueId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
    let mediaUrl = "";

    const hasBlobToken = process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.length > 0;

    if (hasBlobToken) {
      console.log("[Upload API] Uploading media to Vercel Blob storage...");
      // Upload it to Vercel Blob using put()
      const uploadedBlob = await put(fileName, file, {
        access: "public",
        contentType: file.type,
      });
      mediaUrl = uploadedBlob.url;
    } else {
      console.log("[Upload API] BLOB_READ_WRITE_TOKEN missing. Using local fallback.");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      mediaUrl = `/uploads/${fileName}`;
    }

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
