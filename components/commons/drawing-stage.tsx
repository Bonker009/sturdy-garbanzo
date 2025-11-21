"use client";

import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import type { Reward } from "@/app/page";

interface DrawingStageProps {
  selectedReward: Reward | null;
  participants: string[];
  onDrawClick?: () => void;
}

const ITEM_HEIGHT = 90;
const MIN_SPINS = 40;

const DrawingStage = forwardRef<
  { animate: (callback: (winner: string) => void, filteredParticipants?: string[]) => void },
  DrawingStageProps
>(({ selectedReward, participants, onDrawClick }, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelItems, setReelItems] = useState<string[]>(["Waiting for Guests..."]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const reelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<((winner: string) => void) | null>(null);

  // Initialize reel items when participants change
  useEffect(() => {
    if (participants.length > 0) {
      const previewItems = ["", ...participants.slice(0, 5)];
      setReelItems(previewItems.length > 1 ? previewItems : ["Waiting for Guests..."]);
      // Reset reel position
      if (reelRef.current) {
        reelRef.current.style.transition = "none";
        reelRef.current.style.transform = "translateY(0px)";
      }
    } else {
      setReelItems(["Waiting for Guests..."]);
      if (reelRef.current) {
        reelRef.current.style.transition = "none";
        reelRef.current.style.transform = "translateY(0px)";
      }
    }
  }, [participants]);

  useImperativeHandle(ref, () => ({
    animate: (callback: (winner: string) => void, filteredParticipants?: string[]) => {
      // Use filtered participants if provided, otherwise use all participants
      const participantsToUse = filteredParticipants || participants;
      
      if (isSpinning || participantsToUse.length === 0) return;

      callbackRef.current = callback;
      setIsSpinning(true);
      setHighlightIndex(-1);

      if (!reelRef.current) return;

      // Clear and build reel
      const winnerIndex = Math.floor(Math.random() * participantsToUse.length);
      const winnerName = participantsToUse[winnerIndex];

      const newReelItems: string[] = [];
      newReelItems.push(""); // Top padding (empty string for visual spacing)

      // Fill noise
      for (let i = 0; i < MIN_SPINS; i++) {
        newReelItems.push(participantsToUse[Math.floor(Math.random() * participantsToUse.length)]);
      }

      // Add Winner
      newReelItems.push(winnerName);
      const winnerItemIndex = newReelItems.length - 1;

      // Add trailing
      newReelItems.push(participantsToUse[Math.floor(Math.random() * participantsToUse.length)]);
      newReelItems.push(participantsToUse[Math.floor(Math.random() * participantsToUse.length)]);

      setReelItems(newReelItems);

      // Animate after render
      setTimeout(() => {
        const reel = reelRef.current;
        if (!reel) return;

        // Reset Position
        reel.style.transition = "none";
        reel.style.transform = "translateY(0px)";

        // Force reflow
        void reel.offsetHeight;

        // Calculate Target - Winner should be at index 1 (middle of 3 visible items)
        const targetY = -((winnerItemIndex - 1) * ITEM_HEIGHT);
        const duration = 5000;

        // Start Animation
        requestAnimationFrame(() => {
          reel.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
          reel.style.transform = `translateY(${targetY}px)`;
        });

        // Finish
        setTimeout(() => {
          setIsSpinning(false);
          setHighlightIndex(winnerItemIndex);

          // Call callback with winner
          setTimeout(() => {
            if (callbackRef.current) {
              callbackRef.current(winnerName);
            }
          }, 500);
        }, duration);
      }, 0);
    },
  }));

  return (
    <div className="relative p-12 stage-frame w-full max-w-3xl mx-auto shadow-2xl bg-gradient-to-br from-[#1a1c23] to-[#0f1115] rounded-xl border border-gray-800">
      {/* Corner ornaments */}
      <div className="absolute w-10 h-10 border-2 border-accent z-10 top-2.5 left-2.5 border-r-0 border-b-0"></div>
      <div className="absolute w-10 h-10 border-2 border-accent z-10 top-2.5 right-2.5 border-l-0 border-b-0"></div>
      <div className="absolute w-10 h-10 border-2 border-accent z-10 bottom-2.5 left-2.5 border-r-0 border-t-0"></div>
      <div className="absolute w-10 h-10 border-2 border-accent z-10 bottom-2.5 right-2.5 border-l-0 border-t-0"></div>


      {/* Reel Window */}
      <div className="slot-window h-[270px] w-full bg-[#fdfbf7] relative border-y-4 border-[#1a1c23] overflow-hidden shadow-inner">
        {/* Payline */}
        <div className="absolute top-1/2 left-[10%] right-[10%] h-[90px] -translate-y-1/2 border-t border-b border-accent/50 bg-yellow-400/5 pointer-events-none z-10 flex justify-between items-center px-2">
          <span className="text-accent text-lg">▶</span>
          <span className="text-accent text-lg">◀</span>
        </div>

        {/* Moving Reel */}
        <div ref={reelRef} className="w-full will-change-transform">
          {reelItems.map((item, idx) => (
            <div
              key={idx}
              className={`
                h-[90px] flex items-center justify-center font-serif font-bold text-[2.2rem] tracking-tighter text-slate-800
                ${idx === highlightIndex ? "text-[#b38728] scale-110 transition-transform duration-300" : ""}
                ${!item || item === "Guest List Empty" || item === "Waiting for Guests..."
                  ? "text-slate-400 italic text-lg font-normal"
                  : ""}
              `}
            >
              {item || ""}
            </div>
          ))}
        </div>
      </div>

      {/* Spin Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={onDrawClick}
          disabled={
            isSpinning || 
            participants.length === 0 || 
            !selectedReward || 
            selectedReward.remainingQuantity <= 0
          }
          className="gala-btn w-64 py-4 rounded-sm text-xl font-bold uppercase tracking-widest disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
        >
          {isSpinning ? "Drawing..." : "Draw Winner"}
        </button>
      </div>

      {/* Floor Shadow */}
      <div className="w-4/5 h-10 bg-black/50 blur-xl rounded-full -mt-4 mx-auto"></div>
    </div>
  );
});

DrawingStage.displayName = "DrawingStage";

export default DrawingStage;
