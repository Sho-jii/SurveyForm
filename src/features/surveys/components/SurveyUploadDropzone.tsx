"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GoogleAuthButton } from "@/components/common/GoogleAuthButton";
import { authService } from "@/services/auth/authService";
import type { User } from "@supabase/supabase-js";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyUploadDropzoneProps {
  onParsed: (parsedData: any) => void;
  className?: string;
}

export function SurveyUploadDropzone({ onParsed, className }: SurveyUploadDropzoneProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track creator authentication state
  useEffect(() => {
    let mounted = true;
    authService.getCurrentUser().then((u) => {
      if (mounted) setCurrentUser(u);
    });

    const unsubscribe = authService.onAuthStateChange((u) => {
      if (mounted) setCurrentUser(u);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

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

    // Block upload from beginning if user is not signed in
    if (!currentUser) {
      setError("Sign in required: Please sign in with your Google account before uploading a survey PDF.");
      setShowAuthDialog(true);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDropzoneClick = () => {
    if (isUploading) return;

    // Block file picker from opening if user is not signed in
    if (!currentUser) {
      setError("Sign in required: Please sign in with your Google account before uploading a survey PDF.");
      setShowAuthDialog(true);
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      setError("Sign in required: Please sign in with your Google account before uploading a survey PDF.");
      setShowAuthDialog(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Double check authentication guard
    const user = currentUser || (await authService.getCurrentUser());
    if (!user) {
      setError("Sign in required: Please sign in with your Google account before uploading a survey PDF.");
      setShowAuthDialog(true);
      setIsUploading(false);
      return;
    }

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

      // Send authorization token if available
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/surveys/parse-pdf", {
        method: "POST",
        headers,
        body: formData,
      });

      setUploadProgress(85);
      setStatusMessage("Synthesizing universal JSON schema...");

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setShowAuthDialog(true);
        }
        throw new Error(data.error || "Failed to process PDF.");
      }

      setUploadProgress(100);
      setStatusMessage("Survey questionnaire parsed successfully!");

      setTimeout(() => {
        setIsUploading(false);
        onParsed(data.data);
      }, 500);
    } catch (err: any) {
      console.error("[Dropzone Upload Error]", err);
      setError(err?.message || "An error occurred while parsing the survey PDF.");
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleDropzoneClick}
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
            ) : !currentUser ? (
              <Lock className="w-8 h-8 text-amber-500" />
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

          {/* User authentication indicator badge */}
          {!currentUser ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-mono text-[10px] rounded-none gap-1 px-2.5 py-0.5">
              <Lock className="size-3 shrink-0" />
              <span>Sign In Required to Upload</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[10px] rounded-none gap-1 px-2.5 py-0.5">
              <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[220px]">Ready to Upload · {currentUser.email}</span>
            </Badge>
          )}

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
              <Button
                size="default"
                variant={currentUser ? "default" : "outline"}
                className={cn(
                  "rounded-none gap-2 font-medium font-mono text-xs uppercase tracking-wider",
                  !currentUser && "border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                )}
              >
                {!currentUser ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign in to Upload PDF</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Select PDF File</span>
                  </>
                )}
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                Supported: standard PDF, Likert tables
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Required Modal Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md rounded-none border border-border bg-card p-6 sm:p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="size-14 border border-primary/40 bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Lock className="size-7" />
            </div>
            <DialogTitle className="text-lg font-bold font-heading uppercase tracking-wider text-foreground">
              Creator Authentication Required
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Upload will not begin without an active creator session. Please sign in with your Google account so your survey form and responses remain securely attached to you.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex flex-col items-center justify-center gap-3">
            <GoogleAuthButton variant="card" redirectTo="/surveys/new" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthDialog(false)}
              className="rounded-none font-mono text-xs uppercase tracking-wider h-9 w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
