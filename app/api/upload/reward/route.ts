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

    // Validate file type - check both MIME type and file extension
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"];
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
    
    // Extract file extension once
    const fileExtensionRaw = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileExtensionWithDot = "." + fileExtensionRaw;
    const isValidType = file.type && validImageTypes.includes(file.type.toLowerCase());
    const isValidExtension = validExtensions.includes(fileExtensionWithDot);

    if (!isValidType && !isValidExtension) {
      return NextResponse.json(
        { error: "File must be an image (JPEG, PNG, GIF, WebP, BMP, or SVG)" },
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

    // Use the already extracted extension for filename
    const fileName = `reward-${Date.now()}.${fileExtensionRaw}`;
    
    // Path to public/rewards directory
    const publicDir = join(process.cwd(), "public", "rewards");
    
    // Ensure directory exists with proper permissions
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true, mode: 0o775 });
    }

    // Save file to public/rewards
    const filePath = join(publicDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      await writeFile(filePath, buffer, { mode: 0o664 });
    } catch (writeError) {
      console.error("Write error details:", {
        error: writeError,
        filePath,
        publicDir,
        exists: existsSync(publicDir),
        cwd: process.cwd(),
      });
      throw writeError;
    }

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("Error details:", errorDetails);
    return NextResponse.json(
      { 
        error: "Failed to process reward image",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

