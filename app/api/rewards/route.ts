import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface Reward {
  id: string;
  name: string;
  image: string;
  totalQuantity: number;
  remainingQuantity: number;
  winners: string[];
}

const REWARDS_FILE = join(process.cwd(), "data", "rewards.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// GET - Retrieve all rewards
export async function GET() {
  try {
    await ensureDataDir();
    
    if (!existsSync(REWARDS_FILE)) {
      return NextResponse.json({ rewards: [] });
    }

    const fileContent = await readFile(REWARDS_FILE, "utf-8");
    const data = JSON.parse(fileContent);
    
    return NextResponse.json({ rewards: data.rewards || [] });
  } catch (error) {
    console.error("Error reading rewards:", error);
    return NextResponse.json(
      { error: "Failed to retrieve rewards" },
      { status: 500 }
    );
  }
}

// POST - Create a new reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, image, totalQuantity } = body;

    // Validate required fields
    if (!name || !image || !totalQuantity) {
      return NextResponse.json(
        { error: "Missing required fields: name, image, totalQuantity" },
        { status: 400 }
      );
    }

    // Validate totalQuantity
    const quantity = Number.parseInt(totalQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "totalQuantity must be a positive number" },
        { status: 400 }
      );
    }

    await ensureDataDir();

    // Read existing rewards
    let rewards: Reward[] = [];
    if (existsSync(REWARDS_FILE)) {
      try {
        const fileContent = await readFile(REWARDS_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        rewards = data.rewards || [];
      } catch (error) {
        console.error("Error reading existing rewards:", error);
        // Continue with empty array if file is corrupted
      }
    }

    // Create new reward
    const newReward: Reward = {
      id: Date.now().toString(),
      name: name.trim(),
      image: image,
      totalQuantity: quantity,
      remainingQuantity: quantity,
      winners: [],
    };

    // Add to rewards array
    rewards.push(newReward);

    // Save to file
    await writeFile(
      REWARDS_FILE,
      JSON.stringify({ rewards }, null, 2),
      "utf-8"
    );

    console.log(`Reward created successfully: ${newReward.id} - ${newReward.name}`);
    console.log(`Rewards file saved to: ${REWARDS_FILE}`);

    return NextResponse.json({
      success: true,
      reward: newReward,
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create reward: ${errorMessage}` },
      { status: 500 }
    );
  }
}

