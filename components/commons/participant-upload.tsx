"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface ParticipantUploadProps {
  onParticipantsChange: (participants: string[]) => void;
  participants: string[];
}

export interface ParticipantUploadRef {
  triggerUpload: () => void;
}

const ParticipantUpload = forwardRef<ParticipantUploadRef, ParticipantUploadProps>(
  ({ onParticipantsChange, participants }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useImperativeHandle(ref, () => ({
      triggerUpload: () => fileInputRef.current?.click(),
    }));

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/participants", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload participants");
        }

        if (data.success && data.participants) {
          onParticipantsChange(data.participants);
          localStorage.setItem("lucky-draw-participants", JSON.stringify(data.participants));
        }
      } catch (error) {
        console.error("Error uploading participants:", error);
        alert(error instanceof Error ? error.message : "Failed to upload participants file");
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
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
            id="participant-upload"
          />
          <label
            htmlFor="participant-upload"
            className={`block w-full p-4 border-2 border-dashed border-accent/30 rounded-lg transition-colors text-center bg-input/30 ${
              isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-accent/60"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className={`h-6 w-6 text-muted-foreground ${isUploading ? "animate-pulse" : ""}`} />
              <p className="text-xs text-muted-foreground">
                {isUploading ? "Uploading..." : "Upload Excel File"}
              </p>
              {!isUploading && (
                <p className="text-xs text-muted-foreground/70">(.xlsx, .xls, .csv)</p>
              )}
            </div>
          </label>
          {participants.length > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              {participants.length} participant{participants.length !== 1 ? "s" : ""} loaded
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

ParticipantUpload.displayName = "ParticipantUpload";

export default ParticipantUpload;
