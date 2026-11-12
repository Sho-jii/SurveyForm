"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/ui/decor-icon";
import { RotateCcw, PenTool, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  className?: string;
  placeholder?: string;
}

export function SignatureCanvas({
  value,
  onChange,
  className,
  placeholder = "Draw / sign your signature in the box below using your mouse or finger",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Detect if dark mode or light mode
    const isDark = document.documentElement.classList.contains("dark");
    ctx.strokeStyle = isDark ? "#ffffff" : "#09090b";

    if (value && value.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains("dark");
    ctx.strokeStyle = isDark ? "#ffffff" : "#09090b";

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export base64 data URL: convert white/light strokes to dark ink (#090e14)
    // so it prints with crisp black ink on PDF questionnaires, certificates, and white paper!
    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportCtx = exportCanvas.getContext("2d");
      if (exportCtx) {
        exportCtx.drawImage(canvas, 0, 0);
        const imgData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const alpha = d[i + 3];
          if (alpha > 15) {
            d[i] = 10;     // R
            d[i + 1] = 15; // G
            d[i + 2] = 20; // B
          }
        }
        exportCtx.putImageData(imgData, 0, 0);
        const darkDataUrl = exportCanvas.toDataURL("image/png");
        onChange(darkDataUrl);
        return;
      }
    } catch (e) {
      console.warn("SignatureCanvas dark ink conversion error:", e);
    }

    // Fallback export base64 data URL
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-1">
        <span className="flex items-center gap-1.5 uppercase tracking-wider">
          <PenTool className="size-3 text-primary" />
          Interactive Signature Pad
        </span>
        {hasDrawn && (
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <Check className="size-3" />
            Signature Recorded
          </span>
        )}
      </div>

      <div className="relative border border-border/80 bg-background/80 rounded-none overflow-hidden group">
        <DecorIcon position="top-right" className="opacity-40" />
        <DecorIcon position="bottom-left" className="opacity-40" />

        {/* Signature guideline line */}
        <div className="pointer-events-none absolute bottom-8 left-6 right-6 flex items-center gap-2 border-b border-border/40 pb-1 text-muted-foreground/30 font-mono text-[10px]">
          <span>✕</span>
          <span>SIGN ABOVE THIS LINE</span>
        </div>

        {!hasDrawn && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50 font-mono select-none p-4 text-center">
            {placeholder}
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair touch-none"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-mono text-muted-foreground">
          Use finger or mouse pointer to draw
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleClear}
          disabled={!hasDrawn}
          className="gap-1 rounded-none font-mono text-[11px]"
        >
          <RotateCcw className="size-3" />
          <span>Clear Canvas</span>
        </Button>
      </div>
    </div>
  );
}

