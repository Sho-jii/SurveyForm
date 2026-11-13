"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SignatureCanvas } from "@/components/common/SignatureCanvas";
import { CertificateCard } from "./CertificateCard";
import { SurveySignatory } from "@/features/surveys/types";
import {
  certificateService,
  CERTIFICATE_THEMES,
} from "../services/certificateService";
import {
  signatureStorageService,
  checkImageTransparency,
} from "../services/signatureStorageService";
import {
  JARIB_SIGNATURE_BASE64,
  RECOGNIZED_BY_NAME,
  RECOGNIZED_BY_TITLE,
} from "../jaribSignatureBase64";
import {
  Upload,
  RotateCcw,
  Save,
  Palette,
  Image as ImageIcon,
  UserCheck,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Download,
  Award,
} from "lucide-react";

export interface SignatoryData {
  signatories?: SurveySignatory[];
  signatoryName: string;
  signatoryTitle: string;
  signatoryOrganization: string;
  signatorySignatureUrl: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  secondarySignatoryOrganization?: string;
  secondarySignatorySignatureUrl?: string;
  capstoneLogoUrl?: string;
  certificateThemeColor?: string;
}

interface SignatorySettingsCardProps {
  initialData?: Partial<SignatoryData>;
  surveyTitle?: string;
  onSave: (data: SignatoryData) => Promise<void> | void;
  isSaving?: boolean;
}

// Default 3 Researchers for HITOVIS Capstone Group
const DEFAULT_HITOVIS_SIGNATORIES: SurveySignatory[] = [
  {
    id: "sig-1",
    name: RECOGNIZED_BY_NAME,
    title: RECOGNIZED_BY_TITLE,
    organization: "Mindoro State University",
    signatureUrl: JARIB_SIGNATURE_BASE64,
  },
  {
    id: "sig-2",
    name: "GRACE MELODY R. MANALO",
    title: "Co-Researcher & Project Lead",
    organization: "Mindoro State University",
    signatureUrl: "",
  },
  {
    id: "sig-3",
    name: "RALF CARLO C. LEGASPI",
    title: "Co-Researcher & Hardware Specialist",
    organization: "Mindoro State University",
    signatureUrl: "",
  },
];

export function SignatorySettingsCard({
  initialData,
  surveyTitle = "HITOVIS: Smart IoT-Based Catfish Aquaculture Management System",
  onSave,
  isSaving = false,
}: SignatorySettingsCardProps) {
  // Theme Color
  const [themeColor, setThemeColor] = useState<string>(
    initialData?.certificateThemeColor || "gold"
  );

  // Capstone Logo
  const [capstoneLogoUrl, setCapstoneLogoUrl] = useState<string>(
    initialData?.capstoneLogoUrl || "/icons/HITOVIS_LOGO.png"
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Signatories List (Add / Reduce)
  const [signatories, setSignatories] = useState<SurveySignatory[]>(() => {
    if (initialData?.signatories && initialData.signatories.length > 0) {
      return initialData.signatories;
    }
    if (initialData?.signatoryName) {
      const list: SurveySignatory[] = [
        {
          id: "sig-1",
          name: initialData.signatoryName,
          title: initialData.signatoryTitle || RECOGNIZED_BY_TITLE,
          organization: initialData.signatoryOrganization || "Mindoro State University",
          signatureUrl: initialData.signatorySignatureUrl || JARIB_SIGNATURE_BASE64,
        },
      ];
      if (initialData.secondarySignatoryName) {
        list.push({
          id: "sig-2",
          name: initialData.secondarySignatoryName,
          title: initialData.secondarySignatoryTitle || "Co-Researcher & Project Lead",
          organization: initialData.secondarySignatoryOrganization || "Mindoro State University",
          signatureUrl: initialData.secondarySignatorySignatureUrl || "",
        });
      }
      return list;
    }
    return DEFAULT_HITOVIS_SIGNATORIES;
  });

  // Track upload / drawing states for each signatory
  const [activeDrawId, setActiveDrawId] = useState<string | null>(null);
  const [uploadingSigId, setUploadingSigId] = useState<string | null>(null);
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadSigId, setTargetUploadSigId] = useState<string | null>(null);

  // Popup Dialog Preview State (No real-time inline shifting)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [sampleQrUrl, setSampleQrUrl] = useState<string>("");
  const [isTestingPdf, setIsTestingPdf] = useState(false);

  useEffect(() => {
    async function initSampleQr() {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3020";
      const qr = await certificateService.generateQrCodeDataUrl(`${origin}/verify/CERT-SAMPLE-2026`);
      setSampleQrUrl(qr);
    }
    initSampleQr();
  }, []);

  // Sync initialData changes
  useEffect(() => {
    if (initialData?.certificateThemeColor) setThemeColor(initialData.certificateThemeColor);
    if (initialData?.capstoneLogoUrl) setCapstoneLogoUrl(initialData.capstoneLogoUrl);
    if (initialData?.signatories && initialData.signatories.length > 0) {
      setSignatories(initialData.signatories);
    } else if (initialData?.signatoryName) {
      const list: SurveySignatory[] = [
        {
          id: "sig-1",
          name: initialData.signatoryName,
          title: initialData.signatoryTitle || RECOGNIZED_BY_TITLE,
          organization: initialData.signatoryOrganization || "Mindoro State University",
          signatureUrl: initialData.signatorySignatureUrl || JARIB_SIGNATURE_BASE64,
        },
      ];
      if (initialData.secondarySignatoryName) {
        list.push({
          id: "sig-2",
          name: initialData.secondarySignatoryName,
          title: initialData.secondarySignatoryTitle || "Co-Researcher & Project Lead",
          organization: initialData.secondarySignatoryOrganization || "Mindoro State University",
          signatureUrl: initialData.secondarySignatorySignatureUrl || "",
        });
      }
      setSignatories(list);
    }
  }, [initialData]);

  // Add Signatory
  const handleAddSignatory = () => {
    const newId = `sig-${Date.now()}`;
    const newMemberNumber = signatories.length + 1;
    setSignatories((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        title: `Co-Researcher ${newMemberNumber}`,
        organization: signatories[0]?.organization || "Mindoro State University",
        signatureUrl: "",
      },
    ]);
  };

  // Remove Signatory
  const handleRemoveSignatory = (id: string) => {
    if (signatories.length <= 1) {
      alert("At least one signatory is required on the certificate.");
      return;
    }
    setSignatories((prev) => prev.filter((s) => s.id !== id));
  };

  // Update Signatory Field
  const handleUpdateSignatory = (
    id: string,
    field: keyof SurveySignatory,
    value: string
  ) => {
    setSignatories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Capstone Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/webp", "image/svg+xml", "image/jpeg"].includes(file.type)) {
      alert("Please upload a PNG, WebP, SVG, or JPG logo file.");
      return;
    }

    setIsUploadingLogo(true);
    setLogoStatus("Uploading Capstone Logo...");

    try {
      const result = await signatureStorageService.uploadSignature(file, "capstone-logo");
      if (result.url) {
        setCapstoneLogoUrl(result.url);
        setLogoStatus("Capstone Logo updated successfully!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload Capstone Logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Signature File Upload for a specific signatory
  const triggerSigUpload = (sigId: string) => {
    setTargetUploadSigId(sigId);
    sigFileInputRef.current?.click();
  };

  const handleSigFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const sigId = targetUploadSigId;
    if (!file || !sigId) return;

    if (!["image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      alert("Please upload a PNG, WebP, or SVG file with a transparent background.");
      return;
    }

    setUploadingSigId(sigId);
    try {
      const result = await signatureStorageService.uploadSignature(file, `sig-${sigId}`);
      if (result.url) {
        handleUpdateSignatory(sigId, "signatureUrl", result.url);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to process signature image.");
    } finally {
      setUploadingSigId(null);
      setTargetUploadSigId(null);
      if (sigFileInputRef.current) sigFileInputRef.current.value = "";
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    setThemeColor("gold");
    setCapstoneLogoUrl("/icons/HITOVIS_LOGO.png");
    setSignatories(DEFAULT_HITOVIS_SIGNATORIES);
  };

  // Save All
  const handleSave = () => {
    const primary = signatories[0] || {
      name: RECOGNIZED_BY_NAME,
      title: RECOGNIZED_BY_TITLE,
      organization: "Mindoro State University",
      signatureUrl: JARIB_SIGNATURE_BASE64,
    };
    const secondary = signatories[1];

    onSave({
      signatories,
      signatoryName: primary.name,
      signatoryTitle: primary.title,
      signatoryOrganization: primary.organization,
      signatorySignatureUrl: primary.signatureUrl || "",
      secondarySignatoryName: secondary?.name || "",
      secondarySignatoryTitle: secondary?.title || "",
      secondarySignatoryOrganization: secondary?.organization || "",
      secondarySignatorySignatureUrl: secondary?.signatureUrl || "",
      capstoneLogoUrl,
      certificateThemeColor: themeColor,
    });
  };

  // Test Download PDF
  const handleDownloadTestPdf = async () => {
    setIsTestingPdf(true);
    try {
      await certificateService.downloadCertificatePdf({
        certificate_code: "CERT-SAMPLE-2026",
        response_id: "preview",
        survey_id: "preview",
        recipient_name: "Hugo Smith (Sample Evaluator)",
        recipient_role: "IT Specialist / Systems Auditor",
        survey_title: surveyTitle,
        issued_at: new Date().toISOString(),
        signatories,
        signatory_name: signatories[0]?.name,
        signatory_title: signatories[0]?.title,
        signatory_organization: signatories[0]?.organization,
        signatory_signature_url: signatories[0]?.signatureUrl,
        capstone_logo_url: capstoneLogoUrl,
        certificate_theme_color: themeColor,
      });
    } catch (e) {
      console.error(e);
      alert("Failed to generate test PDF.");
    } finally {
      setIsTestingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for signatory signature uploads */}
      <input
        type="file"
        ref={sigFileInputRef}
        onChange={handleSigFileUpload}
        accept="image/png,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* 1. TOP ACTIONS & PREVIEW BAR (Opens in Popup Dialog, NO inline alteration) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card border border-border">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 rounded-none font-mono text-[10px] uppercase"
          >
            Certificate & Signatories
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {signatories.length} Active Signator{signatories.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* POPUP DIALOG PREVIEW BUTTON */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewModalOpen(true)}
            className="rounded-none font-mono text-xs gap-1.5 border-primary/50 text-primary hover:bg-primary/10 font-bold"
          >
            <Eye className="size-3.5" />
            <span>Preview Certificate (Popup Dialog)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="rounded-none font-mono text-xs gap-1.5"
            title="Reset to 3 default researchers"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset 3 Members</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isUploadingLogo}
            className="rounded-none font-mono text-xs gap-1.5 font-bold bg-primary text-primary-foreground"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </Button>
        </div>
      </div>

      {/* 2. DYNAMIC RESEARCH TEAM SIGNATORIES (ADD OR REDUCE) */}
      <Card className="bg-card border border-border rounded-none shadow-sm overflow-hidden">
        <DecorIcon position="top-right" className="opacity-40" />
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold font-heading text-foreground">
                Signing Signatories ({signatories.length} Members)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Add or reduce researchers to match your team size. Each member receives a dedicated signature line.
              </CardDescription>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleAddSignatory}
              className="rounded-none font-mono text-xs gap-1.5 shrink-0 bg-primary text-primary-foreground"
            >
              <Plus className="size-3.5" />
              <span>Add Signatory / Member</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {signatories.map((sig, idx) => (
              <div
                key={sig.id}
                className="p-5 border border-border/80 bg-muted/10 relative space-y-4 rounded-none transition-all"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="size-6 bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-mono text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold uppercase text-foreground">
                      Signatory #{idx + 1}
                    </span>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary rounded-none">
                        Lead Researcher
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSignatory(sig.id)}
                    disabled={signatories.length <= 1}
                    className="h-7 px-2 text-destructive hover:bg-destructive/10 rounded-none font-mono text-xs gap-1"
                    title="Remove this signatory"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remove</span>
                  </Button>
                </div>

                {/* Input Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-mono uppercase text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      value={sig.name}
                      onChange={(e) => handleUpdateSignatory(sig.id, "name", e.target.value)}
                      placeholder="e.g. JARIB M. SIOCO"
                      className="rounded-none text-xs font-sans h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-mono uppercase text-muted-foreground">
                      Role / Position Title
                    </Label>
                    <Input
                      value={sig.title}
                      onChange={(e) => handleUpdateSignatory(sig.id, "title", e.target.value)}
                      placeholder="e.g. Lead Researcher & Platform Architect"
                      className="rounded-none text-xs font-sans h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-mono uppercase text-muted-foreground">
                      Organization / University
                    </Label>
                    <Input
                      value={sig.organization}
                      onChange={(e) => handleUpdateSignatory(sig.id, "organization", e.target.value)}
                      placeholder="e.g. Mindoro State University"
                      className="rounded-none text-xs font-sans h-9"
                    />
                  </div>
                </div>

                {/* Signature Row */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                      Digital Signature
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerSigUpload(sig.id)}
                        disabled={uploadingSigId === sig.id}
                        className="rounded-none font-mono text-[10px] h-7 px-2.5 gap-1.5"
                      >
                        <Upload className="size-3" />
                        <span>{uploadingSigId === sig.id ? "Uploading..." : "Upload PNG Signature"}</span>
                      </Button>
                      <Button
                        variant={activeDrawId === sig.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveDrawId(activeDrawId === sig.id ? null : sig.id)}
                        className="rounded-none font-mono text-[10px] h-7 px-2.5"
                      >
                        {activeDrawId === sig.id ? "Close Pad" : "Draw on Pad"}
                      </Button>
                      {sig.signatureUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateSignatory(sig.id, "signatureUrl", "")}
                          className="rounded-none font-mono text-[10px] h-7 px-2 text-muted-foreground hover:text-destructive"
                        >
                          Clear Ink
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Draw Signature Pad */}
                  {activeDrawId === sig.id && (
                    <div className="p-3 bg-background border border-border mt-2 space-y-2">
                      <span className="text-[10px] font-mono text-muted-foreground block">
                        Sign below using mouse, stylus, or touch:
                      </span>
                      <SignatureCanvas
                        value={sig.signatureUrl}
                        onChange={(dataUrl: string) => {
                          handleUpdateSignatory(sig.id, "signatureUrl", dataUrl);
                          setActiveDrawId(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Signature Preview */}
                  {sig.signatureUrl ? (
                    <div className="p-2 bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400">Recorded Signature Ink:</span>
                      <img
                        src={sig.signatureUrl}
                        alt={sig.name || "Signature"}
                        className="h-9 w-auto max-w-[150px] object-contain invert"
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-muted-foreground">
                      No signature image uploaded. Will render clean formal script font on certificate.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSignatory}
              className="rounded-none font-mono text-xs gap-1.5 border-dashed"
            >
              <Plus className="size-3.5" />
              <span>+ Add Another Signatory ({signatories.length} active)</span>
            </Button>

            <span className="text-xs font-mono text-muted-foreground">
              Signatures automatically space out across the bottom row.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. CAPSTONE LOGO & ACCENT COLOR */}
      <Card className="bg-card border border-border rounded-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 rounded-none font-mono text-[10px]">
              <Palette className="size-3 mr-1" />
              Styling & Logo
            </Badge>
          </div>
          <CardTitle className="text-base sm:text-lg font-bold font-heading text-foreground mt-1">
            Capstone Logo & Accent Color
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border bg-muted/10">
            <div className="flex items-center gap-4">
              {capstoneLogoUrl ? (
                <div className="size-14 p-1 bg-white border border-border flex items-center justify-center shrink-0">
                  <img
                    src={capstoneLogoUrl}
                    alt="Capstone Logo"
                    className="max-h-12 max-w-12 object-contain"
                  />
                </div>
              ) : (
                <div className="size-14 border border-dashed border-border flex items-center justify-center shrink-0">
                  <ImageIcon className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-foreground block">
                  Capstone Research Logo
                </span>
                <span className="text-[11px] font-mono text-muted-foreground block">
                  {capstoneLogoUrl || "Default HITOVIS logo"}
                </span>
                {logoStatus && (
                  <span className="text-[10px] font-mono text-emerald-500 font-semibold block">
                    ✓ {logoStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="rounded-none font-mono text-xs gap-1.5"
              >
                <Upload className="size-3.5" />
                <span>{isUploadingLogo ? "Uploading..." : "Upload Logo"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCapstoneLogoUrl("/icons/HITOVIS_LOGO.png");
                  setLogoStatus("Restored default HITOVIS logo.");
                }}
                className="rounded-none font-mono text-xs text-muted-foreground"
              >
                Reset Default
              </Button>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/webp,image/svg+xml,image/jpeg"
                className="hidden"
              />
            </div>
          </div>

          {/* Color Palettes */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Accent Color Palette
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(CERTIFICATE_THEMES).map(([key, t]) => {
                const isActive = themeColor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeColor(key)}
                    className={`p-3 rounded-none border-2 text-left transition-all duration-200 flex flex-col justify-between h-20 ${
                      isActive
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border/70 hover:border-border bg-card/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        style={{ backgroundColor: t.primary }}
                        className="size-5 rounded-full border border-black/20"
                      />
                      {isActive && <CheckCircle2 className="size-3.5 text-primary" />}
                    </div>
                    <span className="text-xs font-bold text-foreground block font-sans">
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Bar */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              className="rounded-none font-mono text-xs gap-1.5"
            >
              <Eye className="size-3.5" />
              <span>Preview Certificate</span>
            </Button>

            <Button
              variant="default"
              size="default"
              onClick={handleSave}
              disabled={isSaving || isUploadingLogo}
              className="rounded-none font-mono text-xs font-bold gap-2 bg-primary text-primary-foreground px-6"
            >
              <Save className="size-4" />
              <span>{isSaving ? "Saving..." : "Save All Signatory Settings"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. POPUP DIALOG FOR PREVIEW (Zero inline page distortion, preserves landscape ratio) */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-none bg-card border-border">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold font-heading text-foreground flex items-center gap-2">
                  <Award className="size-5 text-primary" />
                  Certificate of Appreciation Preview
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Displays {signatories.length} balanced signatories, capstone logo, and current date.
                </DialogDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadTestPdf}
                disabled={isTestingPdf}
                className="rounded-none font-mono text-xs font-bold gap-2 bg-primary text-primary-foreground shrink-0"
              >
                <Download className="size-3.5" />
                <span>{isTestingPdf ? "Generating PDF..." : "Download Test PDF"}</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Fixed Box Container: Locked landscape proportions (aspect 1.414 / 1), horizontal scroll on mobile */}
          <div className="overflow-x-auto w-full py-4 bg-zinc-950/20 border border-border flex justify-start lg:justify-center">
            <div className="w-[840px] shrink-0 p-2">
              <CertificateCard
                recipientName="Hugo Smith"
                recipientRole="IT Specialist / Aquaculture Evaluator"
                surveyTitle={surveyTitle}
                certificateCode="CERT-SAMPLE-2026"
                qrDataUrl={sampleQrUrl}
                themeColor={themeColor}
                capstoneLogoUrl={capstoneLogoUrl}
                capstoneOrgName={signatories[0]?.organization || "HITOVIS RESEARCH PROJECT"}
                signatories={signatories}
                showActions={false}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
