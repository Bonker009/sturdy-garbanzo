"use client";

import { useEffect, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AudioUploadProps {
  onAudioChange: (audioUrl: string) => void;
}

export interface AudioUploadRef {
  triggerUpload: () => void;
}

const AudioUpload = forwardRef<AudioUploadRef, AudioUploadProps>(
  ({ onAudioChange }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => ({
      triggerUpload: () => {
        fileInputRef.current?.click();
      },
    }));

    useEffect(() => {
      // Load audio from API
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.audioUrl) {
            onAudioChange(data.audioUrl);
          }
        })
        .catch((error) => {
          console.error("Error loading audio:", error);
        });
    }, [onAudioChange]);

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Client-side validation
      const validAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/webm"];
      const validExtensions = [".mp3", ".wav", ".ogg", ".aac", ".webm", ".m4a"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      // Check file type
      const isValidType = file.type && validAudioTypes.includes(file.type.toLowerCase());
      // Check file extension as fallback
      const isValidExtension = validExtensions.includes(fileExtension);

      if (!isValidType && !isValidExtension) {
        alert("Please select a valid audio file (MP3, WAV, OGG, AAC, WebM, or M4A)");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("File size must be less than 10MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/audio", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload audio");
        }

        if (data.success && data.audioUrl) {
          // Save to API instead of localStorage
          await fetch("/api/settings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ audioUrl: data.audioUrl }),
          });
          onAudioChange(data.audioUrl);
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
        alert(error instanceof Error ? error.message : "Failed to upload audio file");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    const [savedAudio, setSavedAudio] = useState<string>("");

    useEffect(() => {
      // Load audio URL for preview
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.audioUrl) {
            setSavedAudio(data.audioUrl);
          }
        })
        .catch((error) => {
          console.error("Error loading audio:", error);
        });
    }, []);

    const handlePlayPreview = () => {
      if (savedAudio && audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    };

    return (
      <Card className="bg-card border border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">
            Winner Audio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            className={`block w-full p-4 border-2 border-dashed border-accent/30 rounded-lg transition-colors text-center bg-input/30 ${
              isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-accent/60"
            }`}
          >
            <p className="text-xs text-muted-foreground">
              {isUploading ? "Uploading..." : "Click to upload audio"}
            </p>
          </label>
          {savedAudio && (
            <div className="mt-4 flex items-center gap-2">
              <audio ref={audioRef} src={savedAudio} className="hidden" />
              <button
                onClick={handlePlayPreview}
                className="text-xs px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30"
              >
                Preview
              </button>
              <p className="text-xs text-muted-foreground truncate flex-1">
                {savedAudio.split("/").pop()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

AudioUpload.displayName = "AudioUpload";

export default AudioUpload;

