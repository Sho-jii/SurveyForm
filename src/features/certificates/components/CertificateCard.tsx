"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ShieldCheck, Award, QrCode } from "lucide-react";
import { SurveySignatory } from "@/features/surveys/types";
import { CERTIFICATE_THEMES, CertificateTheme } from "../services/certificateService";
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
  // Customization
  themeColor?: string;
  capstoneLogoUrl?: string | null;
  capstoneOrgName?: string | null;
  // Dynamic Signatories (1, 2, 3, 4+ researchers)
  signatories?: SurveySignatory[] | null;
  // Backwards compatibility fallbacks
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  signatoryOrganization?: string | null;
  signatorySignatureUrl?: string | null;
  secondarySignatoryName?: string | null;
  secondarySignatoryTitle?: string | null;
  secondarySignatoryOrganization?: string | null;
  secondarySignatorySignatureUrl?: string | null;
  // Actions
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
  capstoneOrgName = "HITOVIS RESEARCH PROJECT",
  signatories,
  signatoryName = RECOGNIZED_BY_NAME,
  signatoryTitle = RECOGNIZED_BY_TITLE,
  signatoryOrganization = "HITOVIS Research Project",
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
  // Always use current date
  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentYear = now.getFullYear().toString();

  const theme: CertificateTheme =
    CERTIFICATE_THEMES[themeColor] || CERTIFICATE_THEMES.gold;

  // Resolve signatories list
  let activeSignatories: SurveySignatory[] = [];
  if (signatories && signatories.length > 0) {
    activeSignatories = signatories;
  } else {
    // Default fallback to at least Jarib
    activeSignatories = [
      {
        id: "sig-1",
        name: signatoryName || RECOGNIZED_BY_NAME,
        title: signatoryTitle || RECOGNIZED_BY_TITLE,
        organization: signatoryOrganization || "HITOVIS Research Project",
        signatureUrl: signatorySignatureUrl || JARIB_SIGNATURE_BASE64,
      },
    ];
    if (secondarySignatoryName) {
      activeSignatories.push({
        id: "sig-2",
        name: secondarySignatoryName,
        title: secondarySignatoryTitle || "Co-Researcher & Project Lead",
        organization: secondarySignatoryOrganization || "Mindoro State University",
        signatureUrl: secondarySignatorySignatureUrl || undefined,
      });
    }
  }

  const displayRecipient = (recipientName || "Hugo Smith").trim();

  // Dynamic grid columns for signatories
  const sigCount = activeSignatories.length;
  let gridColsClass = "grid-cols-1";
  if (sigCount === 2) gridColsClass = "grid-cols-1 sm:grid-cols-2";
  else if (sigCount === 3) gridColsClass = "grid-cols-1 sm:grid-cols-3";
  else if (sigCount >= 4) gridColsClass = "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Outer Certificate Frame: Clean, Classic, Dignified */}
      <div
        style={
          {
            "--cert-primary": theme.primary,
            "--cert-secondary": theme.secondary,
            "--cert-accent-light": theme.accentLight,
            "--cert-text-accent": theme.textAccent,
          } as React.CSSProperties
        }
        className="relative bg-white text-zinc-900 rounded-none p-4 sm:p-8 md:p-12 shadow-2xl border-2 border-zinc-800 transition-all duration-300 select-none overflow-hidden"
      >
        {/* Double Elegant Border */}
        <div className="border-4 border-zinc-900 p-4 sm:p-6 md:p-8 relative">
          {/* Inner Accent Hairline */}
          <div
            style={{ borderColor: theme.primary }}
            className="border-2 border-dashed p-4 sm:p-6 md:p-8 flex flex-col justify-between space-y-8 min-h-[580px] bg-gradient-to-b from-white via-zinc-50/50 to-white"
          >
            {/* Top Header: Logo + Institution Header + Certificate Title */}
            <div className="text-center space-y-3">
              {/* Capstone Logo */}
              <div className="flex items-center justify-center gap-3">
                {capstoneLogoUrl ? (
                  <img
                    src={capstoneLogoUrl}
                    alt="Capstone Logo"
                    className="h-12 sm:h-16 w-auto max-w-[180px] object-contain"
                  />
                ) : (
                  <div
                    style={{ borderColor: theme.primary, color: theme.primary }}
                    className="size-12 rounded-full border-2 flex items-center justify-center bg-zinc-50"
                  >
                    <Award className="size-6" />
                  </div>
                )}
              </div>

              {/* Institution / Project Name */}
              <div className="space-y-0.5">
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.25em] text-zinc-600 block">
                  {capstoneOrgName || "HITOVIS RESEARCH & EVALUATION PLATFORM"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 block tracking-widest uppercase">
                  ACADEMIC RESEARCH · ISO/IEC 25010 & UTAUT FRAMEWORK
                </span>
              </div>

              {/* Main Certificate Title */}
              <div className="pt-2">
                <h1
                  style={{ color: theme.primary }}
                  className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-wider uppercase leading-none drop-shadow-sm"
                >
                  Certificate of Appreciation
                </h1>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="h-0.5 w-16 sm:w-28 bg-zinc-800" />
                  <span
                    style={{ backgroundColor: theme.primary }}
                    className="size-2 rotate-45 inline-block"
                  />
                  <div className="h-0.5 w-16 sm:w-28 bg-zinc-800" />
                </div>
              </div>
            </div>

            {/* Recipient Section */}
            <div className="text-center space-y-2 py-2">
              <span className="text-xs sm:text-sm font-sans uppercase tracking-[0.2em] text-zinc-500 font-semibold block">
                THIS CERTIFICATE IS PROUDLY PRESENTED TO
              </span>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-zinc-950 tracking-tight pt-1 pb-2 break-words">
                {displayRecipient}
              </h2>

              {recipientRole && (
                <div className="inline-block px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border border-zinc-300 bg-zinc-100 text-zinc-800">
                  Evaluator Role: {recipientRole}
                </div>
              )}
            </div>

            {/* Body Citation */}
            <div className="max-w-2xl mx-auto text-center space-y-2.5 text-zinc-700">
              <p className="text-xs sm:text-sm leading-relaxed font-sans">
                in grateful recognition and appreciation for actively completing the comprehensive survey
                evaluation and contributing rigorous expert assessment for the research capstone project:
              </p>
              <p className="text-sm sm:text-base md:text-lg font-bold font-serif text-zinc-950 border-y border-zinc-200 py-2 px-4 bg-zinc-50/60">
                &ldquo;{surveyTitle || "Evaluation Questionnaire"}&rdquo;
              </p>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono tracking-wide">
                Evaluated in accordance with ISO/IEC 25010:2011 Software Quality Requirements and UTAUT Technology Acceptance Criteria.
              </p>
            </div>

            {/* Verification Bar: Current Date & Live QR Seal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Verification QR"
                    className="size-14 sm:size-16 object-contain border border-zinc-300 p-1 bg-white"
                  />
                ) : (
                  <div className="size-14 border border-dashed border-zinc-300 flex items-center justify-center bg-white">
                    <QrCode className="size-6 text-zinc-400" />
                  </div>
                )}
                <div className="text-left space-y-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                    AUTHENTIC RESEARCH CREDENTIAL
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-950 block">
                    {certificateCode}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 block">
                    Scan QR code or visit <span className="underline">/verify/{certificateCode}</span>
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-right font-mono">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block font-semibold">
                  DATE OF ISSUANCE
                </span>
                <span className="text-sm font-bold text-zinc-950 block">
                  {currentDateStr}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  Academic Year {currentYear}
                </span>
              </div>
            </div>

            {/* Bottom Row: Dynamic Signatories (1, 2, 3, or more researchers) */}
            <div className="pt-4 border-t border-zinc-300">
              <div className={`grid ${gridColsClass} gap-6 sm:gap-8 items-end`}>
                {activeSignatories.map((sig, idx) => (
                  <div key={sig.id || `sig-${idx}`} className="text-center space-y-1">
                    {/* Handwritten Signature Ink Image */}
                    <div className="h-14 sm:h-16 flex items-end justify-center">
                      {sig.signatureUrl ? (
                        <img
                          src={sig.signatureUrl}
                          alt={sig.name}
                          className="max-h-14 sm:max-h-16 w-auto max-w-[180px] object-contain"
                        />
                      ) : (
                        <span className="font-serif italic text-xl text-zinc-700 select-none pb-1">
                          {sig.name}
                        </span>
                      )}
                    </div>

                    {/* Underline Rule */}
                    <div className="w-full max-w-[220px] mx-auto border-b-2 border-zinc-900" />

                    {/* Printed Name & Credentials */}
                    <p className="text-xs sm:text-sm font-bold text-zinc-950 font-sans tracking-tight pt-1 uppercase">
                      {sig.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-zinc-600 font-sans font-medium">
                      {sig.title}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">
                      {sig.organization}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      {showActions && onDownloadPdf && (
        <div className="flex items-center justify-between gap-3 p-3 bg-card border border-border">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>Landscape A4 High-Resolution Vector PDF with {activeSignatories.length} Signatories</span>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="rounded-none font-mono text-xs font-bold gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-3.5" />
            <span>{isDownloading ? "Generating PDF..." : "Download Certificate PDF"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
