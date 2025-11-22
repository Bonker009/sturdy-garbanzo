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
    const validAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/webm"];
    const validExtensions = [".mp3", ".wav", ".ogg", ".aac", ".webm", ".m4a"];
    
    // Extract file extension once
    const fileExtensionRaw = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const fileExtensionWithDot = "." + fileExtensionRaw;
    const isValidType = file.type && validAudioTypes.includes(file.type.toLowerCase());
    const isValidExtension = validExtensions.includes(fileExtensionWithDot);

    if (!isValidType && !isValidExtension) {
      return NextResponse.json(
        { error: "File must be an audio file (MP3, WAV, OGG, AAC, WebM, or M4A)" },
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
    const fileName = `winner-audio-${Date.now()}.${fileExtensionRaw}`;
    
    // Path to public/audio directory
    const publicDir = join(process.cwd(), "public", "audio");
    
    // Ensure directory exists with proper permissions
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true, mode: 0o775 });
    }

    // Save file to public/audio
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
    const publicUrl = `/audio/${fileName}`;

    return NextResponse.json({
      success: true,
      audioUrl: publicUrl,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("Error details:", errorDetails);
    return NextResponse.json(
      { 
        error: "Failed to process audio file",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

