"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Reward } from "@/app/page";
import Image from "next/image";

interface RewardsListProps {
  rewards: Reward[];
  onDelete: (id: string) => void;
  onDraw: (reward: Reward) => void;
}

export default function RewardsList({
  rewards,
  onDelete,
  onDraw,
}: RewardsListProps) {
  if (rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">No rewards yet. Add rewards to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rewards.map((reward) => (
        <Card
          key={reward.id}
          className="bg-card border border-white/10 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => onDraw(reward)}
        >
          <CardContent className="flex gap-4 items-start py-3 px-4">
            {/* Reward Image */}
            <div className="w-16 h-16 shrink-0 rounded overflow-hidden border border-white/10 relative">
              <Image
                src={reward.image || "/placeholder.svg"}
                alt={reward.name}
                className="w-full h-full object-cover"
                width={64}
                height={64}

              />
            </div>

            {/* Reward Info */}
            <div className="grow min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {reward.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {reward.remainingQuantity} of {reward.totalQuantity} remaining
              </p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-primary to-accent"
                  style={{
                    width: `${(reward.remainingQuantity / reward.totalQuantity) * 100
                      }%`,
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                disabled={reward.remainingQuantity <= 0}
                onClick={() => onDraw(reward)}
                className="bg-primary/20 text-primary hover:bg-primary/30 text-xs"
                variant="ghost"
              >
                Draw
              </Button>
              <Button
                size="sm"
                onClick={() => onDelete(reward.id)}
                className="bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs"
                variant="ghost"
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
