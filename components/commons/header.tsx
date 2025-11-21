"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import Image from "next/image";
import { GlowingEffect } from "../ui/glowing-effect";

interface HeaderProps {
  onAddRewardClick: () => void;
  onUploadBackgroundClick: () => void;
  onUploadParticipantsClick: () => void;
}

export default function Header({
  onAddRewardClick,
  onUploadBackgroundClick,
  onUploadParticipantsClick,
}: HeaderProps) {
  return (
    <header className="py-4 border-b border-primary/20 bg-background/80 backdrop-blur-xs sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg flex items-center justify-center">
            <Image src={"/hrd.png"} width={28} height={28} alt="HRD LOGO" />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="group border-primary/50 text-primary hover:bg-primary/10 bg-transparent flex items-center gap-2 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] data-[state=open]:bg-primary/10 data-[state=open]:text-white"
            >
              Actions
              <MoreVertical className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[state=open]:rotate-90" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="min-w-[180px] backdrop-blur-sm bg-popover/95 border-primary/20 shadow-xl"
          >
            <DropdownMenuItem 
              onClick={onAddRewardClick}
              className="cursor-pointer focus:bg-primary/10 hover:bg-primary/10 transition-all duration-200 ease-out"
            >
              Add Reward
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onUploadBackgroundClick}
              className="cursor-pointer focus:bg-primary/10 hover:bg-primary/10 transition-all duration-200 ease-out"
            >
              Upload Background
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onUploadParticipantsClick}
              className="cursor-pointer focus:bg-primary/10 hover:bg-primary/10 transition-all duration-200 ease-out"
            >
              Upload Participants
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
