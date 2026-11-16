"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  ShieldCheck,
  Maximize2,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  X,
  ZoomIn,
} from "lucide-react";
import { SurveySignatory } from "@/features/surveys/types";
import { jsPDF } from "jspdf";
import { renderCertificateToCanvas } from "../utils/certificateCanvasRenderer";
import {
  JARIB_SIGNATURE_BASE64,
  RECOGNIZED_BY_NAME,
  RECOGNIZED_BY_TITLE,
} from "../jaribSignatureBase64";

export interface CertificateCardProps {
  recipientName: string;
  recipientRole?: string | null;
  surveyTitle: string;
  issuedAt?: string;
  certificateCode: string;
  qrDataUrl?: string;
  themeColor?: string;
  capstoneLogoUrl?: string | null;
  capstoneOrgName?: string | null;
  signatories?: SurveySignatory[] | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  signatoryOrganization?: string | null;
  signatorySignatureUrl?: string | null;
  secondarySignatoryName?: string | null;
  secondarySignatoryTitle?: string | null;
  secondarySignatoryOrganization?: string | null;
  secondarySignatorySignatureUrl?: string | null;
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
  className?: string;
  showActions?: boolean;
}

export function CertificateCard({
  recipientName,
  recipientRole,
  surveyTitle,
  issuedAt,
  certificateCode,
  qrDataUrl,
  themeColor = "gold",
  capstoneLogoUrl,
  capstoneOrgName = "HITOVIS",
  signatories,
  signatoryName = RECOGNIZED_BY_NAME,
  signatoryTitle = RECOGNIZED_BY_TITLE,
  signatoryOrganization = "",
  signatorySignatureUrl = JARIB_SIGNATURE_BASE64,
  secondarySignatoryName,
  secondarySignatoryTitle,
  secondarySignatoryOrganization,
  secondarySignatorySignatureUrl,
  onDownloadPdf,
  isDownloading = false,
  className = "",
  showActions = true,
}: CertificateCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [isInternalDownloadingPdf, setIsInternalDownloadingPdf] = useState(false);

  // Render certificate onto canvas and produce high-res data URL
  const renderCertificate = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    try {
      const dataUrl = await renderCertificateToCanvas(canvasRef.current, {
        recipientName,
        recipientRole,
        surveyTitle,
        certificateCode,
        issuedAt,
        capstoneLogoUrl,
        capstoneOrgName,
        signatories,
        signatoryName,
        signatoryTitle,
        signatoryOrganization,
        signatorySignatureUrl,
        secondarySignatoryName,
        secondarySignatoryTitle,
        secondarySignatoryOrganization,
        secondarySignatorySignatureUrl,
        qrDataUrl,
        themeColor,
      });
      setImageUrl(dataUrl);
    } catch (e) {
      console.error("Failed to render certificate to canvas:", e);
    } finally {
      setIsRendering(false);
    }
  }, [
    recipientName,
    recipientRole,
    surveyTitle,
    certificateCode,
    issuedAt,
    capstoneLogoUrl,
    capstoneOrgName,
    signatories,
    signatoryName,
    signatoryTitle,
    signatoryOrganization,
    signatorySignatureUrl,
    secondarySignatoryName,
    secondarySignatoryTitle,
    secondarySignatoryOrganization,
    secondarySignatorySignatureUrl,
    qrDataUrl,
    themeColor,
  ]);

  useEffect(() => {
    renderCertificate();
  }, [renderCertificate]);

  // Instant High-Res PNG Download
  const handleDownloadPng = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${certificateCode || "Certificate"}_Completion.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // High-Res Landscape A4 PDF Download
  const handleDownloadPdf = async () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }

    if (!imageUrl) return;
    setIsInternalDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      // A4 Landscape: 297mm x 210mm
      doc.addImage(imageUrl, "PNG", 0, 0, 297, 210, undefined, "FAST");
      doc.save(`${certificateCode || "Certificate"}_Completion.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. You can also download the high-resolution PNG.");
    } finally {
      setIsInternalDownloadingPdf(false);
    }
  };

  const downloading = isDownloading || isInternalDownloadingPdf;

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {/* Hidden off-screen Canvas for High-Resolution 2400x1700 Rasterization */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Responsive Certificate Card Preview Container */}
      <div className="relative w-full border-2 border-border/80 bg-card rounded-none shadow-xl overflow-hidden group">
        {isRendering ? (
          <div className="w-full aspect-[1.414/1] flex flex-col items-center justify-center bg-zinc-950/20 text-muted-foreground font-mono text-xs gap-3 p-6">
            <div className="size-8 border-2 border-primary border-t-transparent animate-spin" />
            <p className="uppercase tracking-widest text-[11px]">Rendering High-Resolution Certificate...</p>
          </div>
        ) : imageUrl ? (
          <div
            className="relative cursor-pointer overflow-hidden bg-white select-none"
            onClick={() => setIsFullscreenOpen(true)}
            title="Click to view fullscreen certificate"
          >
            {/* 100% Responsive Image (Scales perfectly on all mobile & desktop viewports without clipping or stretching) */}
            <img
              src={imageUrl}
              alt={`Certificate of Appreciation for ${recipientName || "Evaluator"}`}
              className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.006]"
            />

            {/* Click to Zoom Overlay Hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs uppercase tracking-wider backdrop-blur-[1px]">
              <Maximize2 className="size-4 text-white" />
              <span>Click to view full size</span>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[1.414/1] flex items-center justify-center bg-zinc-950/20 text-destructive font-mono text-xs p-6">
            Failed to render certificate. Please refresh.
          </div>
        )}
      </div>

      {/* Action Toolbar: Download PDF and Download PNG */}
      {showActions && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border border-border/80 rounded-none">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span className="truncate">
              Authentic Certificate · Responsive High-Res Image & Vector PDF
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download PNG Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPng}
              disabled={isRendering || !imageUrl}
              className="rounded-none font-mono text-xs gap-1.5 flex-1 sm:flex-initial"
              title="Download 2400x1700 High-Resolution PNG"
            >
              <ImageIcon className="size-3.5 text-primary" />
              <span>Download Image (PNG)</span>
            </Button>

            {/* Download PDF Button */}
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloading || isRendering || !imageUrl}
              className="rounded-none font-mono text-xs font-bold gap-1.5 flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-primary/90"
              title="Download Landscape A4 PDF Document"
            >
              <Download className="size-3.5" />
              <span>{downloading ? "Preparing PDF..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[96vw] max-h-[96vh] w-auto h-auto p-2 sm:p-4 rounded-none bg-background/95 backdrop-blur-md border border-border/80 flex flex-col justify-between">
          <DialogHeader className="p-2 border-b border-border/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                <CheckCircle2 className="size-3 mr-1" /> Verified Credential
              </Badge>
              <DialogTitle className="font-heading text-sm uppercase tracking-wider text-foreground">
                Certificate Preview · {certificateCode}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                className="rounded-none font-mono text-xs gap-1 h-7"
              >
                <ImageIcon className="size-3 text-primary" />
                <span>PNG</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="rounded-none font-mono text-xs gap-1 h-7 bg-primary text-primary-foreground"
              >
                <Download className="size-3" />
                <span>PDF</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Modal Image Box */}
          <div className="overflow-auto max-h-[80vh] flex items-center justify-center p-2 bg-neutral-900/50">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Fullscreen Certificate"
                className="max-w-full max-h-[78vh] object-contain shadow-2xl border border-neutral-700 select-none"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
