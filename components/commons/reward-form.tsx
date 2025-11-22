"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Reward } from "@/app/page";
import Image from "next/image";

interface RewardFormProps {
  onAddReward: (reward: Omit<Reward, "id" | "winners">) => void;
}

export default function RewardForm({ onAddReward }: RewardFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [image, setImage] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name || !quantity || !image) {
      alert("Please fill in all fields");
      return;
    }

    const qty = Number.parseInt(quantity);
    if (qty <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    onAddReward({
      name,
      image,
      totalQuantity: qty,
      remainingQuantity: qty,
    });

    setName("");
    setQuantity("");
    setImage("");
  };

  return (
    <Card className="bg-card border border-white/5 shadow-2xl">
      <CardHeader className="pb-4">
        <label className="text-sm font-bold text-primary uppercase tracking-widest">
          Add Reward
        </label>
      </CardHeader>
      <CardContent className="gap-4 flex flex-col">
        {/* Image Preview & Upload */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Reward Image
          </p>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="block w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors text-center"
            >
              {image ? (
                <Image
                  src={image || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <p className="text-xs text-muted-foreground py-8">
                  Click to upload image
                </p>
              )}
            </label>
          </div>
        </div>
 
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Reward Name
          </p>
          <Input
            placeholder="e.g., Premium Headphones"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm bg-input text-foreground"
          />
        </div>
 
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Total Quantity
          </p>
          <Input
            type="number"
            placeholder="e.g., 5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="text-sm bg-input text-foreground"
          />
        </div>
 
        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-b from-[#cfaa5b] to-[#9e7c28] text-primary-foreground font-bold uppercase tracking-widest rounded-sm hover:from-[#e6c475] hover:to-[#b38f34] mt-4"
        >
          Add Reward
        </Button>
      </CardContent>
    </Card>
  );
}
