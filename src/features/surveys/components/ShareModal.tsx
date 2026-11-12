"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Survey } from "../types";
import { Copy, Check, ExternalLink, Globe } from "lucide-react";

interface ShareModalProps {
  survey: Survey;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ survey, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Construct URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${baseUrl}/s/${survey.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none border border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <Badge variant="outline" className="border-primary/40 text-primary rounded-none font-mono text-[10px] uppercase">
              Public Survey Link
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold font-heading">
            Share Questionnaire
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Anyone with this link can view and answer your survey form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-muted-foreground uppercase">
              Direct Public Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={publicUrl}
                className="font-mono text-xs select-all bg-background/60 rounded-none"
              />
              <Button size="sm" onClick={handleCopy} className="gap-1.5 shrink-0 rounded-none font-mono text-xs">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-none bg-secondary/30 border border-border/70 text-xs text-muted-foreground space-y-1 font-mono">
            <p className="font-semibold text-foreground uppercase">Distribution Tips:</p>
            <p>• Send this link directly to IT experts, clients, fishermen, or respondents.</p>
            <p>• Works on mobile phones, tablets, and desktop browsers seamlessly.</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(publicUrl, "_blank")}
              className="gap-1.5 rounded-none font-mono text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </Button>
            <Button size="sm" onClick={onClose} className="rounded-none font-mono text-xs">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
