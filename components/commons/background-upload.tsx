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
      const savedBackground = localStorage.getItem("lucky-draw-background");
      if (savedBackground) {
        onBackgroundChange(savedBackground);
      }
    }, [onBackgroundChange]);

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

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
          localStorage.setItem("lucky-draw-background", data.imageUrl);
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
