"use client";

import { useEffect, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BackgroundUploadProps {
  onBackgroundChange: (backgroundImage: string) => void;
}

export interface BackgroundUploadRef {
  triggerUpload: () => void;
}

const BackgroundUpload = forwardRef<BackgroundUploadRef, BackgroundUploadProps>(
  ({ onBackgroundChange }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useImperativeHandle(ref, () => ({
      triggerUpload: () => {
        fileInputRef.current?.click();
      },
    }));

    useEffect(() => {
      // Load background from API
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.backgroundImage) {
            onBackgroundChange(data.backgroundImage);
          }
        })
        .catch((error) => {
          console.error("Error loading background:", error);
        });
    }, [onBackgroundChange]);

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Client-side validation
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"];
      const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      // Check file type
      const isValidType = file.type && validImageTypes.includes(file.type.toLowerCase());
      // Check file extension as fallback
      const isValidExtension = validExtensions.includes(fileExtension);

      if (!isValidType && !isValidExtension) {
        alert("Please select a valid image file (JPEG, PNG, GIF, WebP, BMP, or SVG)");
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

        const response = await fetch("/api/upload/background", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload background");
        }

        if (data.success && data.imageUrl) {
          // Save to API instead of localStorage
          await fetch("/api/settings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ backgroundImage: data.imageUrl }),
          });
          onBackgroundChange(data.imageUrl);
        }
      } catch (error) {
        console.error("Error uploading background:", error);
        alert(error instanceof Error ? error.message : "Failed to upload background image");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

  return (
    <Card className="bg-card border border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">
          Background Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          className="hidden"
          id="bg-upload"
        />
        <label
          htmlFor="bg-upload"
          className={`block w-full p-4 border-2 border-dashed border-accent/30 rounded-lg transition-colors text-center bg-input/30 ${
            isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-accent/60"
          }`}
        >
          <p className="text-xs text-muted-foreground">
            {isUploading ? "Uploading..." : "Click to upload background"}
          </p>
        </label>
      </CardContent>
    </Card>
  );
});

BackgroundUpload.displayName = "BackgroundUpload";

export default BackgroundUpload;
