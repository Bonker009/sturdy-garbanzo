import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const SETTINGS_FILE = join(process.cwd(), "data", "settings.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

interface Settings {
  backgroundImage?: string;
  audioUrl?: string;
  drawMode?: "one-by-one" | "all-at-once";
  showCongratulationModal?: boolean;
}

// GET - Retrieve settings
export async function GET() {
  try {
    await ensureDataDir();
    
    if (!existsSync(SETTINGS_FILE)) {
      return NextResponse.json({ 
        backgroundImage: "",
        audioUrl: "",
        drawMode: "one-by-one",
        showCongratulationModal: true
      });
    }

    const fileContent = await readFile(SETTINGS_FILE, "utf-8");
    const settings: Settings = JSON.parse(fileContent);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error reading settings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings" },
      { status: 500 }
    );
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backgroundImage, audioUrl, drawMode, showCongratulationModal } = body;

    await ensureDataDir();

    // Read existing settings
    let settings: Settings = {};
    if (existsSync(SETTINGS_FILE)) {
      try {
        const fileContent = await readFile(SETTINGS_FILE, "utf-8");
        settings = JSON.parse(fileContent);
      } catch (error) {
        console.error("Error reading existing settings:", error);
      }
    }

    // Update settings
    if (backgroundImage !== undefined) {
      settings.backgroundImage = backgroundImage;
    }
    if (audioUrl !== undefined) {
      settings.audioUrl = audioUrl;
    }
    if (drawMode !== undefined) {
      settings.drawMode = drawMode;
    }
    if (showCongratulationModal !== undefined) {
      settings.showCongratulationModal = showCongratulationModal;
    }

    // Save to file
    await writeFile(
      SETTINGS_FILE,
      JSON.stringify(settings, null, 2),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update settings: ${errorMessage}` },
      { status: 500 }
    );
  }
}

