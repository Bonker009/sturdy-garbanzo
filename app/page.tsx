"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DrawingStage from "@/components/commons/drawing-stage";
import ConfettiEffect from "@/components/commons/confetti-effect";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Package, CheckCircle2, X, Users } from "lucide-react";
import { useRewards, useUpdateReward } from "@/lib/hooks/use-rewards";
import { useQueryClient } from "@tanstack/react-query";

export interface Reward {
  id: string;
  name: string;
  image: string;
  totalQuantity: number;
  remainingQuantity: number;
  winners: string[];
}

export default function Home() {
  const { data: rewards = [], isLoading } = useRewards();
  const queryClient = useQueryClient();
  const updateRewardMutation = useUpdateReward();
  const [currentWinner, setCurrentWinner] = useState("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [rewardSelectModalOpen, setRewardSelectModalOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [participants, setParticipants] = useState<string[]>([]);
  const drawingStageRef = useRef<{ animate: (callback: (winner: string) => void, filteredParticipants?: string[]) => void }>(null);
  const confettiRef = useRef<{ start: () => void; stop: () => void }>(null);
  const isWaiting = rewards.length === 0;

  // Sync selectedReward when rewards update
  useEffect(() => {
    if (selectedReward) {
      const updatedReward = rewards.find((r) => r.id === selectedReward.id);
      if (updatedReward) {
        // Only update if the reward data actually changed to avoid unnecessary re-renders
        if (
          updatedReward.remainingQuantity !== selectedReward.remainingQuantity ||
          updatedReward.winners.length !== selectedReward.winners.length
        ) {
          setSelectedReward(updatedReward);
        }
      } else {
        // Reward was deleted, clear selection
        setSelectedReward(null);
      }
    }
  }, [rewards, selectedReward]);

  useEffect(() => {
    const savedParticipants = localStorage.getItem("lucky-draw-participants");
    if (savedParticipants) {
      try {
        setParticipants(JSON.parse(savedParticipants));
      } catch (error) {
        console.error("Error loading participants from local storage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const savedBackground = localStorage.getItem("lucky-draw-background");
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, []);


  const handleDrawWinner = (reward: Reward) => {
    if (reward.remainingQuantity <= 0) {
      alert("This reward has no remaining quantity available!");
      return;
    }

    // Get all winners from all rewards to ensure a participant can only win once
    const allWinners = rewards.flatMap((r) => r.winners);
    const availableParticipants = participants.filter(
      (p) => !allWinners.includes(p)
    );

    if (availableParticipants.length === 0) {
      alert("No more participants available! All participants have already won a reward.");
      return;
    }

    setSelectedReward(reward);

    if (drawingStageRef.current) {
      // Store reward ID and available participants for use in callback
      const rewardId = reward.id;
      const filteredParticipants = availableParticipants;
      
      drawingStageRef.current.animate((winner: string) => {
        setCurrentWinner(winner);

        // Get the latest rewards data from the query cache to avoid stale closures
        const latestRewards = queryClient.getQueryData<Reward[]>(["rewards"]) || rewards;
        const currentReward = latestRewards.find((r) => r.id === rewardId);
        
        if (!currentReward) {
          console.error("Reward not found:", rewardId);
          return;
        }

        if (currentReward.remainingQuantity <= 0) {
          console.warn("Reward has no remaining quantity:", currentReward);
          return;
        }

        // Verify the winner is still available (double-check)
        const latestAllWinners = latestRewards.flatMap((r) => r.winners);
        if (latestAllWinners.includes(winner)) {
          alert("This participant has already won a reward. Please draw again.");
          return;
        }

        // Update reward on server using mutation (this will auto-invalidate and refetch)
        updateRewardMutation.mutate({
          id: rewardId,
          data: {
            remainingQuantity: currentReward.remainingQuantity - 1,
            winners: [...currentReward.winners, winner],
          },
        }, {
          onError: (error) => {
            console.error("Failed to update reward:", error);
            alert("Failed to update reward. Please try again.");
          }
        });

        setWinnerModalOpen(true);
      }, filteredParticipants);
    }
  };

  // Start confetti when modal opens
  useEffect(() => {
    if (winnerModalOpen) {
      // Small delay to ensure the confetti component is mounted and rendered
      const timer = setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current.start();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Stop confetti when modal closes
      if (confettiRef.current) {
        confettiRef.current.stop();
      }
    }
  }, [winnerModalOpen]);


  const handleCloseModal = () => {
    setWinnerModalOpen(false);
    if (confettiRef.current) {
      confettiRef.current.stop();
    }
  };

  return (
    <>
      <style>{`
        @keyframes winnerReveal {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(50px);
            filter: blur(10px);
          }
          60% {
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
        
        @keyframes winnerPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 40px rgba(212, 175, 55, 0.5));
          }
          50% {
            transform: scale(1.05);
            filter: brightness(1.2) drop-shadow(0 0 60px rgba(212, 175, 55, 0.8));
          }
        }
        
        .winner-name-animated {
          animation: winnerReveal 1.2s ease-out, winnerPulse 2s ease-in-out infinite 1.2s;
        }
      `}</style>
      <div
        className="min-h-screen flex flex-col bg-background"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
      {backgroundImage && (
        <div className="fixed inset-0 bg-black/40 pointer-events-none" />
      )}

      {/* Selected Reward Display - Left Side */}
      {selectedReward && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <div className="pointer-events-auto bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg p-4 shadow-xl max-w-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/30 bg-muted">
                <Image
                  src={selectedReward.image || "/placeholder.svg"}
                  alt={selectedReward.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {selectedReward.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedReward.remainingQuantity} remaining
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedReward(null)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAB - Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setRewardSelectModalOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Package className="h-6 w-6" />
        </Button>
      </div>

      {/* Center - Jackpot */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="pointer-events-auto w-full max-w-4xl mx-auto px-4">
          <DrawingStage
            ref={drawingStageRef}
            selectedReward={selectedReward}
            participants={participants}
            onDrawClick={() => {
              if (selectedReward) {
                if (selectedReward.remainingQuantity <= 0) {
                  alert("This reward has no remaining quantity available!");
                  return;
                }
                handleDrawWinner(selectedReward);
              } else {
                setRewardSelectModalOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Spacer for layout */}
      <main className="grow p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Empty space - content is now in fixed positions */}
        </div>
      </main>

      {/* Reward Selection Modal */}
      <Dialog open={rewardSelectModalOpen} onOpenChange={setRewardSelectModalOpen}>
        <DialogContent className="bg-card border border-primary/20 sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-primary mb-1">
                  Select Reward
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Choose a reward to draw winners for
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRewardSelectModalOpen(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-6">
            {rewards.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Rewards Available
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Add rewards in the admin panel to get started with the lucky draw.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => {
                  // Calculate available participants (those who haven't won any reward)
                  const allWinners = rewards.flatMap((r) => r.winners);
                  const availableCount = participants.filter(
                    (p) => !allWinners.includes(p)
                  ).length;
                  const canDraw = reward.remainingQuantity > 0 && availableCount > 0;
                  const isSelected = selectedReward?.id === reward.id;
                  const progressPercentage = (reward.remainingQuantity / reward.totalQuantity) * 100;

                  return (
                    <Card
                      key={reward.id}
                      className={`group relative overflow-hidden transition-all duration-300 ${
                        !canDraw
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:scale-[1.02] hover:shadow-xl"
                      } ${
                        isSelected
                          ? "border-2 border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                          : "border border-primary/20 hover:border-primary/40 bg-background/50"
                      }`}
                      onClick={() => {
                        if (!canDraw) {
                          if (reward.remainingQuantity <= 0) {
                            alert("This reward has no remaining quantity available!");
                          } else if (availableCount === 0) {
                            alert("No more participants available! All participants have already won a reward.");
                          }
                          return;
                        }
                        setSelectedReward(reward);
                        setRewardSelectModalOpen(false);
                      }}
                    >
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      <CardContent className="p-0">
                        {/* Reward Image */}
                        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                          <Image
                            src={reward.image || "/placeholder.svg"}
                            alt={reward.name}
                            fill
                            className={`object-cover transition-transform duration-300 ${
                              canDraw ? "group-hover:scale-110" : ""
                            }`}
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            {canDraw ? (
                              <span className="px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold backdrop-blur-sm">
                              Available
                            </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-gray-500/90 text-white text-xs font-semibold backdrop-blur-sm">
                              Unavailable
                            </span>
                            )}
                          </div>

                          {/* Remaining Quantity Badge */}
                          <div className="absolute bottom-3 right-3">
                            <div className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-bold">
                              {reward.remainingQuantity}/{reward.totalQuantity}
                            </div>
                          </div>
                        </div>

                        {/* Reward Info */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">
                            {reward.name}
                          </h3>
                          
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span>Progress</span>
                              <span>{Math.round(progressPercentage)}% remaining</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {availableCount} available
                              </span>
                            </div>
                            {reward.winners.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-accent" />
                                <span className="text-muted-foreground">
                                  {reward.winners.length} winner{reward.winners.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Winner Modal */}
      {winnerModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          {/* Dark Backdrop with Blur */}
          <div 
            className="absolute inset-0 bg-[#000]/90 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal Container */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-6 animate-in zoom-in-95 duration-300">
            {/* Gold Backlight Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#d4af37]/20 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="bg-[#0f1115] border border-[#d4af37] p-2 w-full max-w-3xl shadow-2xl relative">
              {/* Inner Border & Content */}
              <div className="border border-[#d4af37]/30 p-10 md:p-16 flex flex-col items-center text-center relative overflow-hidden">
                {/* Art Deco Corner Details */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#d4af37]"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#d4af37]"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#d4af37]"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#d4af37]"></div>
                
                <h3 className="text-[#8c7b4a] text-sm md:text-base uppercase tracking-[0.5em] mb-8 font-sans">
                  The Winner Is
                </h3>
                
                {/* Winner Name with Gold Gradient */}
                <p 
                  className="text-5xl md:text-7xl font-bold text-white leading-tight mb-10 drop-shadow-2xl winner-name-animated"
                  style={{ 
                    fontFamily: "Playfair Display, serif",
                    background: "linear-gradient(to bottom, #fbf5b3, #d4af37, #bf953f)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    textShadow: "0 0 40px rgba(212, 175, 55, 0.5), 0 0 80px rgba(212, 175, 55, 0.3)"
                  }}
                >
                  {currentWinner}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex gap-6">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-2 text-[#d4af37]/60 hover:text-[#d4af37] uppercase tracking-[0.2em] text-[10px] transition-all hover:underline underline-offset-8"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  handleCloseModal();
                  if (selectedReward && selectedReward.remainingQuantity > 0) {
                    handleDrawWinner(selectedReward);
                  }
                }}
                className="bg-[#d4af37] text-black px-8 py-3 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#fff] transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                Draw Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti - In front of the modal content */}
      {winnerModalOpen && (
        <div className="fixed inset-0 pointer-events-none z-[75]">
          <ConfettiEffect ref={confettiRef} />
        </div>
      )}
      </div>
    </>
  );
}
