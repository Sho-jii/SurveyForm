"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DecorIcon } from "@/components/ui/decor-icon";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyUploadDropzoneProps {
  onParsed: (parsedData: any) => void;
  className?: string;
}

export function SurveyUploadDropzone({ onParsed, className }: SurveyUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF document (.pdf).");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(20);
    setStatusMessage("Reading PDF document...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(50);
      setStatusMessage("Extracting Likert matrices, sections, and criteria...");

      const res = await fetch("/api/surveys/parse-pdf", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      setStatusMessage("Synthesizing universal JSON schema...");

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process PDF.");
      }

      setUploadProgress(100);
      setStatusMessage("Survey questionnaire parsed successfully!");

      setTimeout(() => {
        setIsUploading(false);
        onParsed(data.data);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred while parsing the survey PDF.");
      setIsUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={cn(
        "relative rounded-none border-2 border-dashed p-8 md:p-14 text-center transition-all cursor-pointer overflow-hidden group",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border/80 hover:border-primary/70 bg-card/40 hover:bg-card/70",
        isUploading && "pointer-events-none cursor-default",
        className
      )}
    >
      <DecorIcon position="top-left" />
      <DecorIcon position="top-right" />
      <DecorIcon position="bottom-left" />
      <DecorIcon position="bottom-right" />

      {/* Extended Box Border Lines */}
      <div className="absolute -inset-y-4 -left-px w-px bg-border/40" />
      <div className="absolute -inset-y-4 -right-px w-px bg-border/40" />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-none bg-secondary/70 border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="w-8 h-8 text-primary" />
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg md:text-xl font-semibold text-foreground font-heading">
            Drag & Drop Survey Questionnaire PDF
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Drop your Likert scale evaluation or survey form PDF here.
            We will extract all sections, scale descriptions, and generate a live web form.
          </p>
        </div>

        {isUploading && (
          <div className="w-full space-y-2 pt-2">
            <Progress value={uploadProgress} className="h-1.5 rounded-none" />
            <p className="text-xs text-primary font-mono font-medium animate-pulse">{statusMessage}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-none bg-destructive/10 text-destructive text-xs border border-destructive/30 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isUploading && (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button size="default" variant="default" className="rounded-none gap-2 pointer-events-none font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Select PDF File</span>
            </Button>
            <span className="text-xs font-mono text-muted-foreground">Supported: standard PDF, Likert tables</span>
          </div>
        )}
      </div>
    </div>
  );
}
