"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/commons/header";
import BackgroundUpload, {
  BackgroundUploadRef,
} from "@/components/commons/background-upload";
import ParticipantUpload, {
  ParticipantUploadRef,
} from "@/components/commons/participant-upload";
import RewardsList from "@/components/commons/rewards-list";
import RewardFormModal from "@/components/commons/reward-form-modal";
import type { Reward } from "@/app/page";
import { Trash2, Edit2, Plus, Package, Users, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import {
  useRewards,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
} from "@/lib/hooks/use-rewards";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPage() {
  const { data: rewards = [] } = useRewards();
  const queryClient = useQueryClient();
  const createRewardMutation = useCreateReward();
  const updateRewardMutation = useUpdateReward();
  const deleteRewardMutation = useDeleteReward();
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const backgroundUploadRef = useRef<BackgroundUploadRef>(null);
  const participantUploadRef = useRef<ParticipantUploadRef>(null);

  // Load participants from localStorage
  const loadParticipants = () => {
    const savedParticipants = localStorage.getItem("lucky-draw-participants");
    if (savedParticipants) {
      try {
        setParticipants(JSON.parse(savedParticipants));
      } catch (error) {
        console.error("Error loading participants from local storage:", error);
      }
    } else {
      setParticipants([]);
    }
  };

  // Load background from localStorage
  const loadBackground = () => {
    const savedBackground = localStorage.getItem("lucky-draw-background");
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    } else {
      setBackgroundImage("");
    }
  };

  useEffect(() => {
    loadParticipants();
    loadBackground();

    // Listen for storage changes (e.g., from other tabs or components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lucky-draw-participants") {
        loadParticipants();
      } else if (e.key === "lucky-draw-background") {
        loadBackground();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically in case storage event doesn't fire (same tab updates)
    const interval = setInterval(() => {
      loadParticipants();
      loadBackground();
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleAddReward = async (reward: Omit<Reward, "id" | "winners">) => {
    try {
      await createRewardMutation.mutateAsync(reward);
      setFormModalOpen(false);
    } catch (error) {
      console.error("Error creating reward:", error);
      alert(error instanceof Error ? error.message : "Failed to create reward");
    }
  };

  const handleEditReward = async (reward: Omit<Reward, "id" | "winners">) => {
    if (!editingReward) return;
    
    try {
      // Get the latest reward data from the query cache to ensure we have current winners
      const latestRewards = queryClient.getQueryData<Reward[]>(["rewards"]) || rewards;
      const currentReward = latestRewards.find((r) => r.id === editingReward.id) || editingReward;
      
      // Calculate new remaining quantity based on winners count
      // remainingQuantity = totalQuantity - number of winners
      const winnersCount = currentReward.winners.length;
      const newRemainingQuantity = Math.max(0, reward.totalQuantity - winnersCount);
      
      console.log("handleEditReward - Editing reward ID:", editingReward.id);
      console.log("handleEditReward - Current reward from cache:", currentReward);
      console.log("handleEditReward - New totalQuantity:", reward.totalQuantity);
      console.log("handleEditReward - Winners count:", winnersCount);
      console.log("handleEditReward - Calculated remainingQuantity:", newRemainingQuantity);
      
      const updateData = {
        name: reward.name,
        image: reward.image,
        totalQuantity: reward.totalQuantity,
        remainingQuantity: newRemainingQuantity,
        winners: currentReward.winners,
      };
      
      console.log("handleEditReward - Sending update data:", updateData);
      
      await updateRewardMutation.mutateAsync({
        id: editingReward.id,
        data: updateData,
      });
      setEditingReward(null);
      setFormModalOpen(false);
    } catch (error) {
      console.error("Error updating reward:", error);
      alert(error instanceof Error ? error.message : "Failed to update reward");
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      await deleteRewardMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert(error instanceof Error ? error.message : "Failed to delete reward");
    }
  };

  const handleUploadBackgroundClick = () => {
    backgroundUploadRef.current?.triggerUpload();
  };

  const handleUploadParticipantsClick = () => {
    participantUploadRef.current?.triggerUpload();
  };

  const totalWinners = rewards.reduce((sum, r) => sum + r.winners.length, 0);
  const totalRemaining = rewards.reduce((sum, r) => sum + r.remainingQuantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onAddRewardClick={() => setFormModalOpen(true)}
        onUploadBackgroundClick={handleUploadBackgroundClick}
        onUploadParticipantsClick={handleUploadParticipantsClick}
      />

      <main className="grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage rewards, participants, and background settings
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setFormModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Reward
              </Button>
              <Button
                onClick={handleUploadBackgroundClick}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Background
              </Button>
              <Button
                onClick={handleUploadParticipantsClick}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Users className="h-4 w-4 mr-2" />
                Upload Participants
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  Total Rewards
                </h3>
                <Package className="h-5 w-5 text-primary/60" />
              </div>
              <p className="text-3xl font-bold text-primary">{rewards.length}</p>
            </div>

            <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  Participants
                </h3>
                <Users className="h-5 w-5 text-primary/60" />
              </div>
              <p className="text-3xl font-bold text-primary">{participants.length}</p>
            </div>

            <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  Winners
                </h3>
                <Users className="h-5 w-5 text-accent/60" />
              </div>
              <p className="text-3xl font-bold text-accent">{totalWinners}</p>
            </div>

            <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  Background
                </h3>
                <ImageIcon className="h-5 w-5 text-primary/60" />
              </div>
              <p className="text-sm font-semibold text-primary">
                {backgroundImage ? "✓ Set" : "✗ Not Set"}
              </p>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1">Rewards Management</h2>
                <p className="text-sm text-muted-foreground">
                  {rewards.length > 0 
                    ? `${rewards.length} reward${rewards.length !== 1 ? 's' : ''} • ${totalRemaining} remaining`
                    : "No rewards yet. Add your first reward to get started."
                  }
                </p>
              </div>
              <Button
                onClick={() => setFormModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Reward
              </Button>
            </div>

            {/* Rewards List */}
            <div className="bg-card border border-primary/20 rounded-lg p-6">
              {rewards.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    No rewards yet. Add rewards to get started.
                  </p>
                  <Button
                    onClick={() => setFormModalOpen(true)}
                    variant="outline"
                    className="border-primary/50 text-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Reward
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="bg-background/50 border border-primary/10 rounded-lg p-4 hover:border-primary/30 transition-all"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Reward Image */}
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-primary/20 relative bg-muted">
                          <img
                            src={reward.image || "/placeholder.svg"}
                            alt={reward.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Reward Info */}
                        <div className="grow min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-base font-semibold text-foreground">
                                {reward.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {reward.remainingQuantity} of {reward.totalQuantity} remaining
                                {reward.winners.length > 0 && (
                                  <span className="ml-2">
                                    • {reward.winners.length} winner{reward.winners.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => setEditingReward(reward)}
                                variant="ghost"
                                className="text-primary hover:bg-primary/10"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${reward.name}"?`)) {
                                    handleDeleteReward(reward.id);
                                  }
                                }}
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-white/5 rounded-full h-2 mt-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                              style={{
                                width: `${(reward.remainingQuantity / reward.totalQuantity) * 100}%`,
                              }}
                            />
                          </div>

                          {/* Winners List */}
                          {reward.winners.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-primary/10">
                              <p className="text-xs text-muted-foreground mb-2">Winners:</p>
                              <div className="flex flex-wrap gap-2">
                                {reward.winners.map((winner, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 bg-accent/20 text-accent rounded border border-accent/30"
                                  >
                                    {winner}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Background Preview Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1">Background Image</h2>
                <p className="text-sm text-muted-foreground">
                  Current background used for the lucky draw page
                </p>
              </div>
              <Button
                onClick={handleUploadBackgroundClick}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {backgroundImage ? "Change Background" : "Upload Background"}
              </Button>
            </div>

            <div className="bg-card border border-primary/20 rounded-lg p-6">
              {backgroundImage ? (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-primary/20 bg-muted">
                    <Image
                      src={backgroundImage}
                      alt="Current background"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Background: <span className="text-foreground font-medium">{backgroundImage}</span>
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove the background?")) {
                          localStorage.removeItem("lucky-draw-background");
                          setBackgroundImage("");
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    No background image set. Upload one to customize the lucky draw page.
                  </p>
                  <Button
                    onClick={handleUploadBackgroundClick}
                    variant="outline"
                    className="border-primary/50 text-primary"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Background
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Participants List Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1">Participants</h2>
                <p className="text-sm text-muted-foreground">
                  {participants.length > 0 
                    ? `${participants.length} participant${participants.length !== 1 ? 's' : ''} loaded`
                    : "No participants loaded yet"
                  }
                </p>
              </div>
              <Button
                onClick={handleUploadParticipantsClick}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Users className="h-4 w-4 mr-2" />
                {participants.length > 0 ? "Update Participants" : "Upload Participants"}
              </Button>
            </div>

            <div className="bg-card border border-primary/20 rounded-lg p-6">
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    No participants loaded. Upload an Excel file to add participants.
                  </p>
                  <Button
                    onClick={handleUploadParticipantsClick}
                    variant="outline"
                    className="border-primary/50 text-primary"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Upload Participants
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="text-foreground font-semibold">{participants.length}</span> participants
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Are you sure you want to clear all ${participants.length} participants?`)) {
                          localStorage.removeItem("lucky-draw-participants");
                          setParticipants([]);
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {participants.map((participant, index) => (
                        <div
                          key={index}
                          className="bg-background/50 border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground hover:border-primary/30 transition-colors"
                        >
                          <span className="text-xs text-muted-foreground mr-2">#{index + 1}</span>
                          {participant}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Reward Modal */}
      <RewardFormModal
        isOpen={formModalOpen || editingReward !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFormModalOpen(false);
            setEditingReward(null);
          }
        }}
        onAddReward={editingReward ? handleEditReward : handleAddReward}
        editingReward={editingReward}
      />

      {/* Hidden upload components - triggered via refs from header */}
      <div className="hidden">
        <BackgroundUpload
          ref={backgroundUploadRef}
          onBackgroundChange={setBackgroundImage}
        />
        <ParticipantUpload
          ref={participantUploadRef}
          onParticipantsChange={setParticipants}
          participants={participants}
        />
      </div>
    </div>
  );
}

