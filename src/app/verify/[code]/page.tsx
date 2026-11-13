"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  certificateService,
  SurveyCertificate,
} from "@/features/certificates/services/certificateService";
import { CertificateCard } from "@/features/certificates/components/CertificateCard";
import {
  RECOGNIZED_BY_NAME,
  RECOGNIZED_BY_TITLE,
} from "@/features/certificates/jaribSignatureBase64";
import {
  CheckCircle2,
  FileText,
  Download,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Award,
  Layers,
} from "lucide-react";
import Image from "next/image";

export default function CertificateVerificationPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [cert, setCert] = useState<SurveyCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    async function fetchCert() {
      if (!code) return;
      setIsLoading(true);
      try {
        const found = await certificateService.getCertificateByCode(code);
        if (found) {
          setCert(found);
          const qr = await certificateService.generateQrCodeDataUrl(window.location.href);
          setQrDataUrl(qr);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCert();
  }, [code]);

  const handleDownload = async () => {
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground efferd-grid">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo size="md" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/surveys">
              <Button variant="outline" size="sm" className="rounded-none font-mono text-xs">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow max-w-4xl mx-auto w-full py-12 px-4 sm:px-6">
        {isLoading ? (
          <div className="text-center py-24 space-y-3 font-mono text-xs text-muted-foreground">
            <div className="size-6 border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p>VERIFYING CERTIFICATE RECORD...</p>
          </div>
        ) : !cert ? (
          <Card className="border-destructive/60 bg-card p-8 text-center rounded-none shadow-xl max-w-lg mx-auto space-y-4">
            <div className="size-12 rounded-none bg-destructive/10 border border-destructive/30 text-destructive mx-auto flex items-center justify-center">
              <AlertTriangle className="size-6" />
            </div>
            <h2 className="text-lg font-bold font-heading text-foreground uppercase">
              Certificate Not Found
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No matching evaluation certificate was found for identifier{" "}
              <code className="text-foreground font-mono bg-secondary px-1.5 py-0.5">{code}</code>.
              Please verify the QR code URL or check the certificate number.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button size="sm" className="rounded-none font-mono text-xs">
                  Return to Home
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Verification Status Header */}
            <div className="text-center space-y-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-xs rounded-none px-3 py-1 uppercase tracking-widest gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Official Authentic Credential
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
                Certificate of Recognition
              </h1>
              <p className="text-xs font-mono text-muted-foreground">
                VERIFICATION ID: <span className="text-foreground font-bold">{cert.certificate_code}</span>
              </p>
            </div>

            {/* Professional Certificate of Appreciation (Fixed landscape box) */}
            <div className="overflow-x-auto w-full pb-4 flex justify-start lg:justify-center">
              <div className="w-[840px] shrink-0">
                <CertificateCard
                  recipientName={cert.recipient_name}
                  recipientRole={cert.recipient_role}
                  surveyTitle={cert.survey_title}
                  certificateCode={cert.certificate_code}
                  qrDataUrl={qrDataUrl}
                  themeColor={cert.certificate_theme_color || "gold"}
                  capstoneLogoUrl={cert.capstone_logo_url}
                  capstoneOrgName={cert.signatory_organization}
                  signatories={cert.signatories || cert.metadata?.signatories}
                  signatoryName={cert.signatory_name}
                  signatoryTitle={cert.signatory_title}
                  signatoryOrganization={cert.signatory_organization}
                  signatorySignatureUrl={cert.signatory_signature_url}
                  secondarySignatoryName={cert.secondary_signatory_name}
                  secondarySignatoryTitle={cert.secondary_signatory_title}
                  secondarySignatoryOrganization={cert.secondary_signatory_organization}
                  secondarySignatorySignatureUrl={cert.secondary_signatory_signature_url}
                  onDownloadPdf={handleDownload}
                  isDownloading={isDownloading}
                  showActions={true}
                />
              </div>
            </div>

            {/* Back link */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={`/s/${cert.survey_id}`}>
                <Button variant="outline" className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider">
                  <ExternalLink className="size-3.5" />
                  <span>View Public Survey</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
