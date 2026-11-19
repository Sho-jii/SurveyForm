"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Survey, SurveyResponse } from "@/features/surveys/types";
import {
  certificateService,
  SurveyCertificate,
} from "../services/certificateService";
import { CertificateCard } from "./CertificateCard";
import {
  ExternalLink,
  ShieldCheck,
  Loader2,
  Download,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey;
  response: SurveyResponse | null;
}

export function CertificatePreviewModal({
  isOpen,
  onClose,
  survey,
  response,
}: CertificatePreviewModalProps) {
  const [cert, setCert] = useState<SurveyCertificate | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [certImageUrl, setCertImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [fitView, setFitView] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    if (isOpen && response) {
      setIsLoading(true);
      certificateService
        .getCertificateForResponse(response, survey)
        .then(({ cert, qrDataUrl }) => {
          if (mounted) {
            setCert(cert);
            setQrDataUrl(qrDataUrl);
            setIsLoading(false);
          }
        })
        .catch((e) => {
          console.error("Failed to load certificate:", e);
          if (mounted) setIsLoading(false);
        });
    } else {
      setCert(null);
      setQrDataUrl("");
      setCertImageUrl("");
    }

    return () => {
      mounted = false;
    };
  }, [isOpen, response, survey]);

  const handleDownloadPdf = async () => {
    if (!cert) return;
    setIsDownloading(true);
    try {
      await certificateService.downloadCertificatePdf(cert);
    } catch (e) {
      console.error(e);
      alert("Failed to download certificate PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPng = () => {
    if (!certImageUrl) return;
    const a = document.createElement("a");
    a.href = certImageUrl;
    a.download = `${cert?.certificate_code || "Certificate"}_Completion.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!response) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[96vw] sm:w-[92vw] md:w-[88vw] lg:w-[880px] max-h-[88dvh] sm:max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden rounded-none border border-border bg-background shadow-2xl">
        {/* 1. STICKY TOP HEADER: Never pushed off-screen */}
        <div className="shrink-0 p-4 sm:px-6 sm:py-3.5 border-b border-border/70 bg-card/90 backdrop-blur-md space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[10px] rounded-none uppercase tracking-widest gap-1"
              >
                <ShieldCheck className="size-3" />
                <span>Official Evaluation Credential</span>
              </Badge>
              {cert?.certificate_code && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  ID: <code className="text-foreground font-bold">{cert.certificate_code}</code>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Fit View vs Full Width Scrollable View */}
              <Button
                variant="outline"
                size="xs"
                onClick={() => setFitView(!fitView)}
                className="gap-1.5 rounded-none font-mono text-xs hover:bg-secondary text-foreground"
                title={fitView ? "Switch to detailed scrollable view" : "Fit entire certificate on screen"}
              >
                {fitView ? (
                  <>
                    <Maximize2 className="size-3 text-primary" />
                    <span>Detailed View</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="size-3 text-primary" />
                    <span>Fit on Screen</span>
                  </>
                )}
              </Button>

              {cert?.certificate_code && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => window.open(`/verify/${cert.certificate_code}`, "_blank")}
                  className="gap-1.5 rounded-none font-mono text-xs hover:bg-primary/20 text-foreground"
                  title="Open public verification page in new tab"
                >
                  <ExternalLink className="size-3 text-primary" />
                  <span className="hidden sm:inline">Verification Page</span>
                </Button>
              )}
            </div>
          </div>

          <div>
            <DialogTitle className="text-base sm:text-lg font-bold font-heading text-foreground truncate">
              Certificate of Appreciation — {response.respondent_name || "Respondent"}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground font-mono flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
              <span>ROLE: {response.respondent_role || "PARTICIPANT"}</span>
              <span>•</span>
              <span>SUBMITTED: {formatDate(response.created_at)}</span>
              <span>•</span>
              <span className="truncate max-w-[260px] sm:max-w-none">SURVEY: {survey.title}</span>
            </DialogDescription>
          </div>
        </div>

        {/* 2. SCROLLABLE MIDDLE CONTAINER: Guaranteed smooth vertical scrolling */}
        <div
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 efferd-grid overscroll-contain"
          style={{ scrollbarGutter: "stable" }}
        >
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground font-mono text-xs">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p>LOADING CERTIFICATE DATA...</p>
            </div>
          ) : cert ? (
            <div className="w-full flex flex-col items-center">
              <CertificateCard
                recipientName={cert.recipient_name}
                recipientRole={cert.recipient_role}
                surveyTitle={cert.survey_title}
                certificateCode={cert.certificate_code}
                qrDataUrl={qrDataUrl}
                themeColor={cert.certificate_theme_color || "gold"}
                capstoneLogoUrl={cert.capstone_logo_url}
                capstoneOrgName="HITOVIS"
                signatories={cert.signatories || cert.metadata?.signatories}
                signatoryName={cert.signatory_name}
                signatoryTitle={cert.signatory_title}
                signatoryOrganization={cert.signatory_organization}
                signatorySignatureUrl={cert.signatory_signature_url}
                secondarySignatoryName={cert.secondary_signatory_name}
                secondarySignatoryTitle={cert.secondary_signatory_title}
                secondarySignatoryOrganization={cert.secondary_signatory_organization}
                secondarySignatorySignatureUrl={cert.secondary_signatory_signature_url}
                onDownloadPdf={handleDownloadPdf}
                isDownloading={isDownloading}
                showActions={false}
                fitHeight={fitView}
                onImageReady={setCertImageUrl}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-destructive text-xs font-mono">
              Failed to load certificate for this respondent.
            </div>
          )}
        </div>

        {/* 3. STICKY BOTTOM TOOLBAR: Always visible without scrolling */}
        <div className="shrink-0 p-3 sm:px-6 sm:py-3 border-t border-border/70 bg-card/95 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Scroll inside to inspect signatures · Click image to expand
          </span>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            {cert && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPng}
                  disabled={!certImageUrl}
                  className="rounded-none font-mono text-xs gap-1.5 hover:bg-secondary text-foreground"
                  title="Download High-Resolution PNG Image"
                >
                  <ImageIcon className="size-3.5 text-primary" />
                  <span>Download PNG</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="rounded-none font-mono text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  title="Download Landscape A4 PDF Document"
                >
                  <Download className="size-3.5" />
                  <span>{isDownloading ? "Generating PDF..." : "Download PDF"}</span>
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="rounded-none font-mono text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
