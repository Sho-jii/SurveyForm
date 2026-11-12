"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SignatureCanvas } from "@/components/common/SignatureCanvas";
import { Survey, SurveyResponse } from "@/features/surveys/types";
import { surveyService } from "@/features/surveys/services/surveyService";
import {
  certificateService,
  SurveyCertificate,
} from "@/features/certificates/services/certificateService";
import { CertificateCard } from "@/features/certificates/components/CertificateCard";
import {
  RECOGNIZED_BY_NAME,
  RECOGNIZED_BY_TITLE,
} from "@/features/certificates/jaribSignatureBase64";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Send,
  FileCheck,
  ShieldCheck,
  Download,
  ExternalLink,
  Award,
  PenTool,
  User,
  Briefcase,
  Save,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicSurveyViewerProps {
  survey: Survey;
  initialResponse?: SurveyResponse | null;
}

export function PublicSurveyViewer({ survey, initialResponse }: PublicSurveyViewerProps) {
  const isEditMode = !!initialResponse;

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    if (initialResponse) {
      const merged = { ...(initialResponse.answers || {}) };
      if (initialResponse.respondent_name && !merged.respondent_name) {
        merged.respondent_name = initialResponse.respondent_name;
      }
      if (initialResponse.respondent_name && !merged.demographic_name) {
        merged.demographic_name = initialResponse.respondent_name;
      }
      if (initialResponse.respondent_role && !merged.respondent_role) {
        merged.respondent_role = initialResponse.respondent_role;
      }
      if (initialResponse.respondent_role && !merged.demographic_role) {
        merged.demographic_role = initialResponse.respondent_role;
      }
      return merged;
    }
    return {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [issuedCert, setIssuedCert] = useState<SurveyCertificate | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Default scale labels
  const defaultScaleLabels: Record<number, string> = {
    5: "Strongly Agree",
    4: "Agree",
    3: "Moderately Agree",
    2: "Disagree",
    1: "Strongly Disagree",
  };

  const handleTextAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleLikertAnswer = (itemId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: rating }));
  };

  // Calculate completion progress
  let totalRequiredItems = 0;
  let completedRequiredItems = 0;

  survey.schema.questions.forEach((q) => {
    if (q.type === "likert_matrix" && q.matrixRows) {
      q.matrixRows.forEach((row) => {
        if (q.required) {
          totalRequiredItems++;
          if (answers[row.id] !== undefined) completedRequiredItems++;
        }
      });
    } else {
      if (q.required) {
        totalRequiredItems++;
        if (answers[q.id] && String(answers[q.id]).trim().length > 0) {
          completedRequiredItems++;
        }
      }
    }
  });

  const progressPercent = totalRequiredItems > 0
    ? Math.min(100, Math.round((completedRequiredItems / totalRequiredItems) * 100))
    : 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Check required fields
    survey.schema.questions.forEach((q) => {
      if (q.required) {
        if (q.type === "likert_matrix" && q.matrixRows) {
          const missing = q.matrixRows.filter((row) => answers[row.id] === undefined);
          if (missing.length > 0) {
            errors.push(`Please rate all items under "${q.title}" (${missing.length} unrated).`);
          }
        } else if (q.type === "signature") {
          const sig = answers[q.id] || answers.signature_confirmation || answers.respondent_signature;
          if (!sig || String(sig).trim().length === 0) {
            errors.push(`"${q.title}" digital signature is required.`);
          }
        } else {
          if (!answers[q.id] || String(answers[q.id]).trim().length === 0) {
            errors.push(`"${q.title}" is required.`);
          }
        }
      }
    });

    // Check participant name for certificate
    const resolvedName =
      (answers.respondent_name && String(answers.respondent_name).trim()) ||
      (answers.demographic_name && String(answers.demographic_name).trim()) ||
      (answers.participant_name && String(answers.participant_name).trim()) ||
      null;

    if (!resolvedName) {
      errors.push("Please provide your Full Name to be inscribed on the Certificate of Recognition.");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 150, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
      const respondentName = resolvedName;
      const respondentRole =
        (answers.respondent_role && String(answers.respondent_role).trim()) ||
        (answers.demographic_role && String(answers.demographic_role).trim()) ||
        null;
      const respondentSignature =
        answers.signature_confirmation ||
        answers.respondent_signature ||
        answers.signature ||
        null;

      // 1. Save or Submit response
      let responseRecordId = initialResponse?.id || "";
      if (initialResponse) {
        await surveyService.updateSurveyResponse(initialResponse.id, {
          respondent_name: respondentName,
          respondent_role: respondentRole,
          answers,
          completion_status: "completed",
        });
      } else {
        const created = await surveyService.submitResponse(survey.id, {
          respondent_name: respondentName,
          respondent_role: respondentRole,
          answers,
        });
        responseRecordId = created?.id || "";
      }

      // 2. Issue or Refresh Recognition Certificate
      const certCode = certificateService.generateCode();
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3020";
      const verificationUrl = `${origin}/verify/${certCode}`;

      const signatoryName = survey.signatory_name || survey.schema.settings?.signatoryName || null;
      const signatoryTitle = survey.signatory_title || survey.schema.settings?.signatoryTitle || null;
      const signatoryOrg = survey.signatory_organization || survey.schema.settings?.signatoryOrganization || null;
      const signatorySigUrl = survey.signatory_signature_url || survey.schema.settings?.signatorySignatureUrl || null;
      const secondarySignatoryName = survey.secondary_signatory_name || survey.schema.settings?.secondarySignatoryName || null;
      const secondarySignatoryTitle = survey.secondary_signatory_title || survey.schema.settings?.secondarySignatoryTitle || null;
      const secondarySignatoryOrg = survey.secondary_signatory_organization || survey.schema.settings?.secondarySignatoryOrganization || null;
      const secondarySignatorySigUrl = survey.secondary_signatory_signature_url || survey.schema.settings?.secondarySignatorySignatureUrl || null;
      const capstoneLogoUrl = survey.capstone_logo_url || survey.schema.settings?.capstoneLogoUrl || null;
      const certificateThemeColor = survey.certificate_theme_color || survey.schema.settings?.certificateThemeColor || "gold";

      const certificate = await certificateService.issueCertificate({
        certificate_code: certCode,
        response_id: responseRecordId || certCode,
        survey_id: survey.id,
        recipient_name: respondentName || "Valued Research Participant",
        recipient_role: respondentRole,
        survey_title: survey.title,
        issued_at: new Date().toISOString(),
        signatories: survey.schema.settings?.signatories || survey.signatories || null,
        signatory_name: signatoryName,
        signatory_title: signatoryTitle,
        signatory_organization: signatoryOrg,
        signatory_signature_url: signatorySigUrl,
        secondary_signatory_name: secondarySignatoryName,
        secondary_signatory_title: secondarySignatoryTitle,
        secondary_signatory_organization: secondarySignatoryOrg,
        secondary_signatory_signature_url: secondarySignatorySigUrl,
        capstone_logo_url: capstoneLogoUrl,
        certificate_theme_color: certificateThemeColor,
        metadata: {
          respondent_signature: respondentSignature,
          signatories: survey.schema.settings?.signatories || survey.signatories || null,
        },
      });

      setIssuedCert(certificate);

      // Generate verification QR code
      const qr = await certificateService.generateQrCodeDataUrl(verificationUrl);
      setQrDataUrl(qr);

      setIsSubmitted(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!issuedCert) return;
    setIsDownloadingCert(true);
    try {
      await certificateService.downloadCertificatePdf(issuedCert);
    } catch (e) {
      console.error(e);
      alert("Failed to download certificate PDF.");
    } finally {
      setIsDownloadingCert(false);
    }
  };

  // Has schema explicit signature?
  const hasSchemaSignature = survey.schema.questions.some((q) => q.type === "signature");

  if (isSubmitted && issuedCert) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-8">
        {/* Top Confirmation Alert */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-xs rounded-none px-3 py-1 uppercase tracking-widest gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Evaluation Successfully Recorded
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
            Thank You for Your Evaluation
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            {survey.schema.settings.confirmationMessage ||
              "Your answers have been securely recorded. Below is your official Certificate of Recognition with live QR verification."}
          </p>
        </div>

        {/* Professional Certificate of Appreciation (Horizontal scroll wrapper prevents mobile squishing) */}
        <div className="overflow-x-auto w-full pb-2">
          <div className="min-w-[680px] sm:min-w-full">
            <CertificateCard
              recipientName={issuedCert.recipient_name}
              recipientRole={issuedCert.recipient_role}
              surveyTitle={issuedCert.survey_title}
              certificateCode={issuedCert.certificate_code}
              qrDataUrl={qrDataUrl}
              themeColor={issuedCert.certificate_theme_color || "gold"}
              capstoneLogoUrl={issuedCert.capstone_logo_url}
              capstoneOrgName={issuedCert.signatory_organization}
              signatories={
                issuedCert.signatories ||
                issuedCert.metadata?.signatories ||
                survey.schema.settings?.signatories
              }
              signatoryName={issuedCert.signatory_name}
              signatoryTitle={issuedCert.signatory_title}
              signatoryOrganization={issuedCert.signatory_organization}
              signatorySignatureUrl={issuedCert.signatory_signature_url}
              secondarySignatoryName={issuedCert.secondary_signatory_name}
              secondarySignatoryTitle={issuedCert.secondary_signatory_title}
              secondarySignatoryOrganization={issuedCert.secondary_signatory_organization}
              secondarySignatorySignatureUrl={issuedCert.secondary_signatory_signature_url}
              onDownloadPdf={handleDownloadCertificate}
              isDownloading={isDownloadingCert}
              showActions={true}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleDownloadCertificate}
            disabled={isDownloadingCert}
            className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider"
          >
            <Download className="size-4" />
            <span>{isDownloadingCert ? "Generating PDF..." : "Download Certificate (PDF)"}</span>
          </Button>

          <Link href={`/verify/${issuedCert.certificate_code}`} target="_blank">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider"
            >
              <ExternalLink className="size-3.5" />
              <span>Verify Online</span>
            </Button>
          </Link>

          <Link href={`/surveys/${survey.id}`}>
            <Button
              variant="default"
              size="lg"
              className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider bg-primary text-primary-foreground font-bold"
            >
              <CheckCircle2 className="size-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>

          {!isEditMode && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                setAnswers({});
                setIsSubmitted(false);
                setIssuedCert(null);
              }}
              className="rounded-none font-mono text-xs uppercase tracking-wider"
            >
              Submit Another Response
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Sticky Progress Bar & Theme Toggle */}
      <div className="sticky top-2 z-30 bg-background/95 backdrop-blur-md p-3 rounded-none border border-border/80 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground uppercase">
          <FileCheck className="w-4 h-4 text-primary" />
          <span>Progress</span>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Progress value={progressPercent} className="h-1.5 rounded-none flex-1" />
          <span className="text-xs font-mono font-semibold text-foreground">{progressPercent}%</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Edit Mode Notification Banner */}
      {isEditMode && initialResponse && (
        <Card className="border-2 border-primary bg-primary/10 rounded-none p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-none bg-primary animate-pulse" />
                <span className="font-bold text-primary uppercase tracking-wider">
                  EDIT MODE: Updating Recorded Submission
                </span>
                <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase rounded-none">
                  {initialResponse.id.slice(0, 8)}
                </Badge>
              </div>
              <p className="text-foreground font-sans text-xs">
                You are revising evaluation answers for{" "}
                <strong className="text-primary font-bold">
                  {initialResponse.respondent_name || "Participant"}
                </strong>
                {initialResponse.respondent_role && (
                  <span className="text-muted-foreground"> ({initialResponse.respondent_role})</span>
                )}
                . Any edits will directly update this submission in the database and analytics.
              </p>
            </div>
            <Link href={`/surveys/${survey.id}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none font-mono text-xs uppercase tracking-wider shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Survey Title & Header Card */}
      <Card className="relative overflow-hidden bg-card/80 border-border shadow-xl rounded-none">
        <DecorIcon position="top-left" />
        <DecorIcon position="top-right" />
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 rounded-none font-mono text-[10px]">
              Survey Form
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono rounded-none">
              ISO/IEC 25010 & UTAUT
            </Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-foreground">
            {survey.title}
          </CardTitle>
          {survey.description && (
            <CardDescription className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {survey.description}
            </CardDescription>
          )}
          {survey.instructions && (
            <div className="p-3.5 rounded-none bg-secondary/50 border border-border/60 text-xs text-muted-foreground leading-relaxed font-mono">
              <strong className="text-foreground block mb-1 uppercase tracking-wider">Instructions:</strong>
              {survey.instructions}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Validation Alert */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10 text-destructive p-4 rounded-none">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase font-mono tracking-wider">Please complete required fields:</p>
              <ul className="text-xs list-disc pl-4 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {survey.schema.questions.map((question, qIdx) => {
          // 1. Likert Matrix Question
          if (question.type === "likert_matrix" && question.matrixRows) {
            const scaleObj = question.scale?.labels || defaultScaleLabels;
            const scaleValues = [5, 4, 3, 2, 1];

            return (
              <Card key={question.id} className="relative bg-card/70 border-border rounded-none shadow-sm">
                <DecorIcon position="top-right" className="opacity-40" />
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-primary uppercase">
                      Section {qIdx + 1}
                    </span>
                    {question.required ? (
                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary rounded-none font-mono">
                        REQUIRED
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">OPTIONAL</span>
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold font-heading text-foreground">
                    {question.title}
                  </CardTitle>
                  {question.description && (
                    <CardDescription className="text-xs text-muted-foreground">
                      {question.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  {question.matrixRows.map((row) => {
                    const selectedVal = answers[row.id];

                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "p-3 rounded-none border transition-all space-y-3",
                          selectedVal !== undefined
                            ? "border-border/80 bg-background/60"
                            : "border-border/40 bg-background/20"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div className="flex-1">
                            {row.code && (
                              <span className="font-mono text-xs font-bold text-primary mr-1.5">
                                [{row.code}]
                              </span>
                            )}
                            <span className="text-xs md:text-sm font-medium text-foreground">
                              {row.label}
                            </span>
                            {row.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {row.description}
                              </p>
                            )}
                          </div>
                          {selectedVal !== undefined && (
                            <span className="text-[11px] font-mono text-emerald-400 shrink-0 font-medium">
                              Selected: {selectedVal} ({scaleObj[selectedVal] || defaultScaleLabels[selectedVal]})
                            </span>
                          )}
                        </div>

                        {/* Interactive 5-point choice buttons with BOTH number & name */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {scaleValues.map((val) => {
                            const isSelected = selectedVal === val;
                            const labelName = scaleObj[val] || defaultScaleLabels[val] || `Rating ${val}`;

                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleLikertAnswer(row.id, val)}
                                className={cn(
                                  "p-2 rounded-none border text-center transition-all cursor-pointer flex sm:flex-col items-center justify-between sm:justify-center gap-1 min-h-[52px]",
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-md"
                                    : "bg-secondary/40 hover:bg-secondary border-border/80 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                )}
                              >
                                <span className="font-mono text-sm md:text-base font-bold leading-none">
                                  {val}
                                </span>
                                <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-tight text-right sm:text-center leading-tight">
                                  {labelName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          }

          // 2. Single Choice (Radio)
          if (question.type === "single_choice" && question.options) {
            return (
              <Card key={question.id} className="relative bg-card/70 border-border rounded-none shadow-sm">
                <DecorIcon position="top-right" className="opacity-30" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-primary uppercase">
                      Question {qIdx + 1}
                    </span>
                    {question.required ? (
                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary rounded-none font-mono">
                        REQUIRED
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">OPTIONAL</span>
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold font-heading text-foreground">
                    {question.title}
                  </CardTitle>
                  {question.description && (
                    <CardDescription className="text-xs text-muted-foreground">
                      {question.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(val) => handleTextAnswer(question.id, val)}
                    className="grid sm:grid-cols-2 gap-2.5"
                  >
                    {question.options.map((opt) => (
                      <label
                        key={opt}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-none border cursor-pointer transition-all",
                          answers[question.id] === opt
                            ? "bg-primary/10 border-primary text-foreground font-medium"
                            : "bg-background/40 border-border/60 text-muted-foreground hover:bg-secondary/40"
                        )}
                      >
                        <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
                        <span className="text-xs md:text-sm">{opt}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            );
          }

          // 3. Text Input (e.g. Name)
          if (question.type === "text") {
            const isName = question.id.toLowerCase().includes("name");
            return (
              <Card key={question.id} className="relative bg-card/70 border-border rounded-none shadow-sm">
                <DecorIcon position="top-right" className="opacity-30" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-primary uppercase">
                      {isName ? "Respondent Information" : `Question ${qIdx + 1}`}
                    </span>
                    {question.required ? (
                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary rounded-none font-mono">
                        REQUIRED
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] text-muted-foreground rounded-none font-mono">
                        OPTIONAL
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold font-heading text-foreground">
                    {question.title}
                  </CardTitle>
                  {question.description && (
                    <CardDescription className="text-xs text-muted-foreground">
                      {question.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Input
                    value={
                      isName
                        ? (answers[question.id] || answers.respondent_name || answers.demographic_name || "")
                        : (answers[question.id] || "")
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      handleTextAnswer(question.id, val);
                      if (isName) {
                        setAnswers((prev) => ({
                          ...prev,
                          respondent_name: val,
                          demographic_name: val,
                          participant_name: val,
                        }));
                      }
                    }}
                    placeholder={question.placeholder || "Enter your response..."}
                    className="bg-background/60 rounded-none"
                  />
                </CardContent>
              </Card>
            );
          }

          // 4. Textarea
          if (question.type === "textarea") {
            return (
              <Card key={question.id} className="relative bg-card/70 border-border rounded-none shadow-sm">
                <DecorIcon position="top-right" className="opacity-30" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-primary uppercase">
                      Feedback & Remarks
                    </span>
                    {question.required ? (
                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary rounded-none font-mono">
                        REQUIRED
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">OPTIONAL</span>
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold font-heading text-foreground">
                    {question.title}
                  </CardTitle>
                  {question.description && (
                    <CardDescription className="text-xs text-muted-foreground">
                      {question.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                    rows={4}
                    placeholder={question.placeholder || "Write your feedback here..."}
                    className="bg-background/60 rounded-none"
                  />
                </CardContent>
              </Card>
            );
          }

          // 5. Signature Question (Drawing Pad + Participant Name for Certificate)
          if (question.type === "signature") {
            return (
              <Card key={question.id} className="relative bg-card/70 border-border rounded-none shadow-sm">
                <DecorIcon position="top-right" className="opacity-30" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-primary uppercase">
                      Participant Confirmation
                    </span>
                    {question.required ? (
                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary rounded-none font-mono">
                        REQUIRED
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">OPTIONAL</span>
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold font-heading text-foreground">
                    {question.title}
                  </CardTitle>
                  {question.description && (
                    <CardDescription className="text-xs text-muted-foreground">
                      {question.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {/* Name Input for Certificate */}
                  <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/70">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="size-3.5 text-primary" />
                        Full Name (to appear on Certificate of Recognition)
                      </label>
                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary bg-primary/10 rounded-none font-mono">
                        REQUIRED FOR CERTIFICATE
                      </Badge>
                    </div>
                    <Input
                      value={answers.respondent_name || answers.demographic_name || answers.participant_name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswers((prev) => ({
                          ...prev,
                          respondent_name: val,
                          demographic_name: val,
                          participant_name: val,
                        }));
                      }}
                      placeholder="e.g. Engr. Jarib M. Sioco / Dr. Juan Dela Cruz"
                      className="bg-card rounded-none border-border focus:border-primary font-sans text-sm h-10"
                    />
                    <p className="text-[11px] text-muted-foreground font-sans">
                      This name will be formally inscribed on your verified Certificate of Recognition and verified via QR code.
                    </p>
                  </div>

                  {/* Optional Designation / Affiliation */}
                  <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/70">
                    <label className="text-xs font-mono font-medium text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-muted-foreground" />
                      Designation / Stakeholder Group (Optional)
                    </label>
                    <Input
                      value={answers.respondent_role || answers.demographic_role || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswers((prev) => ({
                          ...prev,
                          respondent_role: val,
                          demographic_role: val,
                        }));
                      }}
                      placeholder="e.g. Evaluator / IT Expert / Faculty / Fisherman Stakeholder"
                      className="bg-card rounded-none border-border focus:border-primary font-sans text-sm h-10"
                    />
                  </div>

                  {/* Signature Canvas */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <PenTool className="size-3.5 text-primary" />
                        Interactive Digital Signature
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        USE MOUSE OR TOUCH TO DRAW
                      </span>
                    </div>
                    <SignatureCanvas
                      value={answers[question.id] || answers.signature_confirmation || answers.respondent_signature || ""}
                      onChange={(dataUrl) => {
                        handleTextAnswer(question.id, dataUrl);
                        handleTextAnswer("signature_confirmation", dataUrl);
                        handleTextAnswer("respondent_signature", dataUrl);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          }

          return null;
        })}

        {/* If no signature question was in the schema, provide the interactive signature paint pad */}
        {!hasSchemaSignature && (
          <Card className="relative bg-card/70 border-border rounded-none shadow-sm">
            <DecorIcon position="top-right" className="opacity-30" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-primary uppercase flex items-center gap-1.5">
                  <PenTool className="size-3.5" />
                  Participant Digital Signature & Certificate
                </span>
                <span className="text-xs font-mono text-muted-foreground">OPTIONAL</span>
              </div>
              <CardTitle className="text-sm md:text-base font-semibold font-heading text-foreground">
                Participant Confirmation / Signature
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Your full name and signature will be included on your downloadable Certificate of Recognition.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Name Input for Certificate */}
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    Full Name (to appear on Certificate of Recognition)
                  </label>
                  <Badge variant="outline" className="text-[9px] border-primary/40 text-primary bg-primary/10 rounded-none font-mono">
                    REQUIRED FOR CERTIFICATE
                  </Badge>
                </div>
                <Input
                  value={answers.respondent_name || answers.demographic_name || answers.participant_name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAnswers((prev) => ({
                      ...prev,
                      respondent_name: val,
                      demographic_name: val,
                      participant_name: val,
                    }));
                  }}
                  placeholder="e.g. Engr. Jarib M. Sioco / Dr. Juan Dela Cruz"
                  className="bg-card rounded-none border-border focus:border-primary font-sans text-sm h-10"
                />
                <p className="text-[11px] text-muted-foreground font-sans">
                  This name will be formally inscribed on your verified Certificate of Recognition and verified via QR code.
                </p>
              </div>

              {/* Optional Designation / Affiliation */}
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/70">
                <label className="text-xs font-mono font-medium text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-muted-foreground" />
                  Designation / Stakeholder Group (Optional)
                </label>
                <Input
                  value={answers.respondent_role || answers.demographic_role || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAnswers((prev) => ({
                      ...prev,
                      respondent_role: val,
                      demographic_role: val,
                    }));
                  }}
                  placeholder="e.g. Evaluator / IT Expert / Faculty / Fisherman Stakeholder"
                  className="bg-card rounded-none border-border focus:border-primary font-sans text-sm h-10"
                />
              </div>

              {/* Signature Canvas */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool className="size-3.5 text-primary" />
                    Interactive Digital Signature
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    USE MOUSE OR TOUCH TO DRAW
                  </span>
                </div>
                <SignatureCanvas
                  value={answers.respondent_signature || ""}
                  onChange={(dataUrl) => handleTextAnswer("respondent_signature", dataUrl)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit / Update Button */}
      <div className="p-5 rounded-none bg-card/85 border border-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground font-heading uppercase tracking-wide">
            {isEditMode ? "Save & Update Evaluation" : "Submit Evaluation"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? "All modifications to scores, comments, or demographic data will directly update the official response."
              : "A verified Certificate of Recognition with live QR verification will be issued immediately upon submission."}
          </p>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto rounded-none gap-2 text-xs md:text-sm font-semibold uppercase tracking-wider px-8 font-mono bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
        >
          {isEditMode ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          <span>
            {isSubmitting
              ? isEditMode
                ? "Saving Changes..."
                : "Submitting..."
              : isEditMode
              ? "Save & Update Submission"
              : survey.schema.settings.submitButtonText || "Submit Survey Evaluation"}
          </span>
        </Button>
      </div>
    </form>
  );
}
