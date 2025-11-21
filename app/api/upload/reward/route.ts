import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `reward-${Date.now()}.${fileExtension}`;
    
    // Path to public/rewards directory
    const publicDir = join(process.cwd(), "public", "rewards");
    
    // Ensure directory exists
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // Save file to public/rewards
    const filePath = join(publicDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicUrl = `/rewards/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Error uploading reward image:", error);
    return NextResponse.json(
      { error: "Failed to process reward image" },
      { status: 500 }
    );
  }
}

