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
import AudioUpload, {
  AudioUploadRef,
} from "@/components/commons/audio-upload";
import RewardsList from "@/components/commons/rewards-list";
import RewardFormModal from "@/components/commons/reward-form-modal";
import type { Reward } from "@/app/page";
import { Trash2, Edit2, Plus, Package, Users, Image as ImageIcon, X, Download, Music } from "lucide-react";
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
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [drawMode, setDrawMode] = useState<"one-by-one" | "all-at-once">("one-by-one");
  const [showCongratulationModal, setShowCongratulationModal] = useState<boolean>(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const backgroundUploadRef = useRef<BackgroundUploadRef>(null);
  const participantUploadRef = useRef<ParticipantUploadRef>(null);
  const audioUploadRef = useRef<AudioUploadRef>(null);

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

  // Load background from API
  const loadBackground = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.backgroundImage) {
        setBackgroundImage(data.backgroundImage);
      } else {
        setBackgroundImage("");
      }
    } catch (error) {
      console.error("Error loading background:", error);
      setBackgroundImage("");
    }
  };

  // Load audio from API
  const loadAudio = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        setAudioUrl("");
      }
      if (data.drawMode) {
        setDrawMode(data.drawMode);
      } else {
        setDrawMode("one-by-one");
      }
      if (data.showCongratulationModal !== undefined) {
        setShowCongratulationModal(data.showCongratulationModal);
      } else {
        setShowCongratulationModal(true);
      }
    } catch (error) {
      console.error("Error loading audio:", error);
      setAudioUrl("");
    }
  };

  useEffect(() => {
    loadParticipants();
    loadBackground();
    loadAudio();

    // Listen for storage changes (e.g., from other tabs or components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lucky-draw-participants") {
        loadParticipants();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for settings updates
    const interval = setInterval(() => {
      loadParticipants();
      loadBackground();
      loadAudio();
    }, 2000);

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

  const handleUploadAudioClick = () => {
    audioUploadRef.current?.triggerUpload();
  };

  const handleDownloadWinners = async () => {
    try {
      const response = await fetch("/api/export/winners");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to download winners");
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "winners-export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading winners:", error);
      alert(error instanceof Error ? error.message : "Failed to download winners");
    }
  };


  const totalWinners = rewards.reduce((sum, r) => sum + r.winners.length, 0);
  const totalRemaining = rewards.reduce((sum, r) => sum + r.remainingQuantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f1115] via-[#1a1c23] to-[#0f1115]">
      {/* <Header
        onAddRewardClick={() => setFormModalOpen(true)}
        onUploadBackgroundClick={handleUploadBackgroundClick}
        onUploadParticipantsClick={handleUploadParticipantsClick}
      /> */}

      <main className="grow p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#d4af37] via-[#fbf5b3] to-[#d4af37] bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage rewards, participants, and background settings
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#d4af37] mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setFormModalOpen(true)}
                    className="bg-gradient-to-r from-[#d4af37] to-[#bf953f] text-[#1a1c23] hover:from-[#e6c475] hover:to-[#d4af37] border border-[#fbf5b3]/30 shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add Reward
                  </Button>
                  <Button
                    onClick={handleUploadBackgroundClick}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Background
                  </Button>
                  <Button
                    onClick={handleUploadParticipantsClick}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Upload Participants
                  </Button>
                  <Button
                    onClick={handleUploadAudioClick}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Upload Audio
                  </Button>
                  <Button
                    onClick={handleDownloadWinners}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                    disabled={totalWinners === 0}
                    title={totalWinners === 0 ? "No winners to export" : "Download all winners as Excel"}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Winners
                  </Button>
                </div>
              </div>

              {/* Draw Mode Settings */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-[#d4af37]/40 rounded-lg p-6 shadow-xl shadow-[#d4af37]/10">
                  <h2 className="text-xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Draw Mode Settings
                  </h2>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Drawing Mode:
                    </label>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          setDrawMode("one-by-one");
                          try {
                            await fetch("/api/settings", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ drawMode: "one-by-one" }),
                            });
                          } catch (error) {
                            console.error("Error updating draw mode:", error);
                            alert("Failed to update draw mode");
                          }
                        }}
                        variant={drawMode === "one-by-one" ? "default" : "outline"}
                        className={
                          drawMode === "one-by-one"
                            ? "bg-gradient-to-r from-[#d4af37] to-[#bf953f] text-[#1a1c23] hover:from-[#e6c475] hover:to-[#d4af37] border border-[#fbf5b3]/30 shadow-md shadow-[#d4af37]/20 font-semibold"
                            : "border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                        }
                      >
                        One by One
                      </Button>
                      <Button
                        onClick={async () => {
                          setDrawMode("all-at-once");
                          try {
                            await fetch("/api/settings", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ drawMode: "all-at-once" }),
                            });
                          } catch (error) {
                            console.error("Error updating draw mode:", error);
                            alert("Failed to update draw mode");
                          }
                        }}
                        variant={drawMode === "all-at-once" ? "default" : "outline"}
                        className={
                          drawMode === "all-at-once"
                            ? "bg-gradient-to-r from-[#d4af37] to-[#bf953f] text-[#1a1c23] hover:from-[#e6c475] hover:to-[#d4af37] border border-[#fbf5b3]/30 shadow-md shadow-[#d4af37]/20 font-semibold"
                            : "border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                        }
                      >
                        All at Once
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground ml-auto">
                      {drawMode === "one-by-one"
                        ? "Draws one winner at a time"
                        : "Draws all remaining winners at once"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#d4af37]/20">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Show Congratulation Modal:
                    </label>
                    <Button
                      onClick={async () => {
                        const newValue = !showCongratulationModal;
                        setShowCongratulationModal(newValue);
                        try {
                          await fetch("/api/settings", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ showCongratulationModal: newValue }),
                          });
                        } catch (error) {
                          console.error("Error updating congratulation modal setting:", error);
                          alert("Failed to update setting");
                        }
                      }}
                      variant={showCongratulationModal ? "default" : "outline"}
                      className={
                        showCongratulationModal
                          ? "bg-gradient-to-r from-[#d4af37] to-[#bf953f] text-[#1a1c23] hover:from-[#e6c475] hover:to-[#d4af37] border border-[#fbf5b3]/30 shadow-md shadow-[#d4af37]/20 font-semibold"
                          : "border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                      }
                    >
                      {showCongratulationModal ? "Enabled" : "Disabled"}
                    </Button>
                    <p className="text-xs text-muted-foreground ml-auto">
                      {showCongratulationModal
                        ? "Shows celebration modal for each winner"
                        : "No modal shown, only slot machine animation"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Total Rewards
                    </h3>
                    <Package className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#fbf5b3] bg-clip-text text-transparent">{rewards.length}</p>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Participants
                    </h3>
                    <Users className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#fbf5b3] bg-clip-text text-transparent">{participants.length}</p>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Winners
                    </h3>
                    <Users className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#fbf5b3] bg-clip-text text-transparent">{totalWinners}</p>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Background
                    </h3>
                    <ImageIcon className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <p className="text-sm font-semibold text-[#d4af37]">
                    {backgroundImage ? "✓ Set" : "✗ Not Set"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Audio
                    </h3>
                    <Music className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <p className="text-sm font-semibold text-[#d4af37]">
                    {audioUrl ? "✓ Set" : "✗ Not Set"}
                  </p>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#d4af37] mb-1">Rewards Management</h2>
                    <p className="text-sm text-muted-foreground">
                      {rewards.length > 0 
                        ? `${rewards.length} reward${rewards.length !== 1 ? 's' : ''} • ${totalRemaining} remaining`
                        : "No rewards yet. Add your first reward to get started."
                      }
                    </p>
                  </div>
                  <Button
                    onClick={() => setFormModalOpen(true)}
                    className="bg-gradient-to-r from-[#d4af37] to-[#bf953f] text-[#1a1c23] hover:from-[#e6c475] hover:to-[#d4af37] border border-[#fbf5b3]/30 shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add Reward
                  </Button>
                </div>

                {/* Rewards List */}
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 shadow-lg">
                  {rewards.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm mb-4">
                        No rewards yet. Add rewards to get started.
                      </p>
                      <Button
                        onClick={() => setFormModalOpen(true)}
                        variant="outline"
                        className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
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
                      className="bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/80 border border-[#d4af37]/20 rounded-lg p-4 hover:border-[#d4af37]/50 hover:shadow-lg hover:shadow-[#d4af37]/10 hover:text-white transition-all"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Reward Image */}
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 border-[#d4af37]/40 relative bg-muted shadow-lg shadow-[#d4af37]/20">
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
                                className="text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-white border border-[#d4af37]/20"
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
                          <div className="w-full bg-[#1e293b] rounded-full h-2 mt-3 overflow-hidden border border-[#d4af37]/20">
                            <div
                              className="h-full bg-gradient-to-r from-[#d4af37] via-[#fbf5b3] to-[#d4af37] transition-all shadow-lg shadow-[#d4af37]/30"
                              style={{
                                width: `${(reward.remainingQuantity / reward.totalQuantity) * 100}%`,
                              }}
                            />
                          </div>

                          {/* Winners List */}
                          {reward.winners.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#d4af37]/20">
                              <p className="text-xs text-[#d4af37] mb-2 font-semibold">Winners:</p>
                              <div className="flex flex-wrap gap-2">
                                {reward.winners.map((winner, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 bg-gradient-to-r from-[#d4af37]/20 to-[#bf953f]/20 text-[#fbf5b3] rounded border border-[#d4af37]/40 shadow-sm"
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
                    <h2 className="text-2xl font-bold text-[#d4af37] mb-1">Background Image</h2>
                    <p className="text-sm text-muted-foreground">
                      Current background used for the lucky draw page
                    </p>
                  </div>
                  <Button
                    onClick={handleUploadBackgroundClick}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {backgroundImage ? "Change Background" : "Upload Background"}
                  </Button>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 shadow-lg">
              {backgroundImage ? (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-[#d4af37]/40 bg-muted shadow-lg shadow-[#d4af37]/20">
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
                    onClick={async () => {
                      if (confirm("Are you sure you want to remove the background?")) {
                        try {
                          await fetch("/api/settings", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ backgroundImage: "" }),
                          });
                          setBackgroundImage("");
                        } catch (error) {
                          console.error("Error removing background:", error);
                          alert("Failed to remove background");
                        }
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
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Background
                  </Button>
                </div>
              )}
            </div>
          </div>

              {/* Audio Preview Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#d4af37] mb-1">Winner Audio</h2>
                    <p className="text-sm text-muted-foreground">
                      Audio file played when a winner is announced
                    </p>
                  </div>
                  <Button
                    onClick={handleUploadAudioClick}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    {audioUrl ? "Change Audio" : "Upload Audio"}
                  </Button>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 shadow-lg">
                  {audioUrl ? (
                    <div className="relative">
                      <div className="flex items-center gap-4 p-4 bg-[#1e293b]/50 rounded-lg border border-[#d4af37]/20">
                        <Music className="h-8 w-8 text-[#d4af37]" />
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-medium mb-1">
                            {audioUrl.split("/").pop()}
                          </p>
                          <audio controls className="w-full mt-2">
                            <source src={audioUrl} type="audio/mpeg" />
                            <source src={audioUrl} type="audio/wav" />
                            <source src={audioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (confirm("Are you sure you want to remove the audio?")) {
                              try {
                                await fetch("/api/settings", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ audioUrl: "" }),
                                });
                                setAudioUrl("");
                              } catch (error) {
                                console.error("Error removing audio:", error);
                                alert("Failed to remove audio");
                              }
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
                      <Music className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm mb-4">
                        No audio file set. Upload one to play when winners are announced.
                      </p>
                      <Button
                        onClick={handleUploadAudioClick}
                        variant="outline"
                        className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                      >
                        <Music className="h-4 w-4 mr-2" />
                        Upload Audio
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Participants List Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#d4af37] mb-1">Participants</h2>
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
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {participants.length > 0 ? "Update Participants" : "Upload Participants"}
                  </Button>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#d4af37]/30 rounded-lg p-6 shadow-lg">
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    No participants loaded. Upload an Excel file to add participants.
                  </p>
                  <Button
                    onClick={handleUploadParticipantsClick}
                    variant="outline"
                    className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-white"
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
                          className="bg-gradient-to-br from-[#1e293b]/60 to-[#0f172a]/60 border border-[#d4af37]/20 rounded-lg px-3 py-2 text-sm text-foreground hover:border-[#d4af37]/50 hover:shadow-md hover:shadow-[#d4af37]/10 hover:text-white transition-all"
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

            {/* Right Column - Winners List */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-[#d4af37]/40 rounded-lg p-6 shadow-2xl shadow-[#d4af37]/20">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] via-[#fbf5b3] to-[#d4af37] bg-clip-text text-transparent mb-1">
                        Winners
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        All winners by reward
                      </p>
                    </div>
                    {totalWinners > 0 && (
                      <Button
                        onClick={handleDownloadWinners}
                        size="sm"
                        className="bg-gradient-to-r from-[#d4af37] to-[#bf953f] text-[#1a1c23] hover:from-[#e6c475] hover:to-[#d4af37] border border-[#fbf5b3]/30 shadow-md shadow-[#d4af37]/20 flex items-center gap-1 font-semibold"
                        title="Download all winners as Excel"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    )}
                  </div>

                  {rewards.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm">
                        No rewards yet. Winners will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {rewards.map((reward) => (
                        <div
                          key={reward.id}
                          className="bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/80 border border-[#d4af37]/30 rounded-lg p-4 hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/10 hover:text-white transition-all"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 border-[#d4af37]/40 relative bg-muted shadow-md shadow-[#d4af37]/20">
                              <img
                                src={reward.image || "/placeholder.svg"}
                                alt={reward.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="grow min-w-0">
                              <h3 className="text-sm font-semibold text-[#fbf5b3] truncate">
                                {reward.name}
                              </h3>
                              <p className="text-xs text-[#d4af37] mt-1">
                                {reward.winners.length} of {reward.totalQuantity} winner{reward.totalQuantity !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {reward.winners.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {reward.winners.map((winner, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs px-2 py-1 bg-gradient-to-r from-[#d4af37]/20 to-[#bf953f]/20 text-[#fbf5b3] rounded border border-[#d4af37]/40 flex items-center gap-1 shadow-sm"
                                  >
                                    <span className="text-[#d4af37] font-semibold">#{idx + 1}</span>
                                    <span>{winner}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              No winners yet
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
        <AudioUpload
          ref={audioUploadRef}
          onAudioChange={setAudioUrl}
        />
      </div>
    </div>
  );
}

