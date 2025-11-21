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

async function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

async function getRewards(): Promise<Reward[]> {
  await ensureDataDir();
  if (!existsSync(REWARDS_FILE)) {
    return [];
  }
  try {
    const fileContent = await readFile(REWARDS_FILE, "utf-8");
    const data = JSON.parse(fileContent);
    return data.rewards || [];
  } catch (error) {
    console.error("Error reading rewards:", error);
    return [];
  }
}

async function saveRewards(rewards: Reward[]) {
  await ensureDataDir();
  await writeFile(
    REWARDS_FILE,
    JSON.stringify({ rewards }, null, 2),
    "utf-8"
  );
}

// PUT - Update a reward (e.g., after drawing a winner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const rewardId = resolvedParams.id;
    const body = await request.json();

    console.log("PUT /api/rewards/[id] - rewardId:", rewardId);
    console.log("PUT /api/rewards/[id] - body:", body);

    const rewards = await getRewards();
    console.log("PUT /api/rewards/[id] - all reward IDs:", rewards.map(r => r.id));
    
    const rewardIndex = rewards.findIndex((r) => r.id === rewardId);

    if (rewardIndex === -1) {
      console.error("PUT /api/rewards/[id] - Reward not found. Looking for:", rewardId);
      console.error("PUT /api/rewards/[id] - Available rewards:", rewards);
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    // Update reward
    rewards[rewardIndex] = {
      ...rewards[rewardIndex],
      ...body,
    };

    await saveRewards(rewards);

    console.log("PUT /api/rewards/[id] - Successfully updated reward:", rewards[rewardIndex]);

    return NextResponse.json({
      success: true,
      reward: rewards[rewardIndex],
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    return NextResponse.json(
      { error: "Failed to update reward" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a reward
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const rewardId = resolvedParams.id;

    const rewards = await getRewards();
    const filteredRewards = rewards.filter((r) => r.id !== rewardId);

    if (rewards.length === filteredRewards.length) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    await saveRewards(filteredRewards);

    return NextResponse.json({
      success: true,
      message: "Reward deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reward:", error);
    return NextResponse.json(
      { error: "Failed to delete reward" },
      { status: 500 }
    );
  }
}

