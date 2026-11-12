"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusChip } from "@/components/common/StatusChip";
import { LoadingState } from "@/components/common/LoadingState";
import { Survey, SurveyResponse } from "../types";
import { surveyService } from "../services/surveyService";
import { SurveyAnalyticsDashboard } from "@/features/analytics/components/SurveyAnalyticsDashboard";
import { JamoviAnalysisView } from "@/features/analytics/components/JamoviAnalysisView";
import { ResponsesTable } from "@/features/responses/components/ResponsesTable";
import { SurveyFormBuilder } from "./SurveyFormBuilder";
import { ShareModal } from "./ShareModal";
import { SignatorySettingsCard, SignatoryData } from "@/features/certificates/components/SignatorySettingsCard";
import { deviceSessionService } from "@/services/session/deviceSessionService";
import { cn } from "@/lib/utils";
import {
  Share2,
  BarChart3,
  ListOrdered,
  FileEdit,
  ExternalLink,
  ArrowLeft,
  Award,
  Calculator,
  ShieldAlert,
} from "lucide-react";

export function SurveyDetailView({ id }: { id: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [isSavingSignatory, setIsSavingSignatory] = useState(false);
  const [isOwner, setIsOwner] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const s = await surveyService.getSurveyById(id);
      if (s) {
        setSurvey(s);
        const creatorId = s.schema?.settings?.creatorDeviceId || s.creator_device_id;
        const owns = deviceSessionService.isOwner(s.id, creatorId);
        setIsOwner(owns);
        const r = await surveyService.getSurveyResponses(s.id);
        setResponses(r);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading || !survey) {
    return <LoadingState message="Loading survey analytics & responses..." />;
  }

  if (!isOwner && survey) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="size-14 border border-destructive/40 bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          <ShieldAlert className="size-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-foreground uppercase tracking-tight">
            Survey Management Restricted
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This survey was created by another device or researcher session. To protect research integrity and prevent unauthorized modifications, editing and administration are restricted to the creator&apos;s device.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href={`/s/${survey.id}`}>
            <Button size="default" className="rounded-none font-mono text-xs uppercase tracking-wider gap-2">
              <ExternalLink className="size-3.5" />
              <span>Answer Public Form</span>
            </Button>
          </Link>
          <Link href="/surveys">
            <Button variant="outline" size="default" className="rounded-none font-mono text-xs uppercase tracking-wider">
              Return to My Surveys
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleResponseUpdated = (updated: SurveyResponse) => {
    setResponses((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleResponseDeleted = (deletedId: string) => {
    setResponses((prev) => prev.filter((r) => r.id !== deletedId));
  };

  const handleSaveSignatory = async (data: SignatoryData) => {
    if (!survey) return;
    setIsSavingSignatory(true);
    try {
      const updated = await surveyService.updateSurvey(survey.id, {
        signatories: data.signatories,
        signatory_name: data.signatoryName,
        signatory_title: data.signatoryTitle,
        signatory_organization: data.signatoryOrganization,
        signatory_signature_url: data.signatorySignatureUrl,
        secondary_signatory_name: data.secondarySignatoryName,
        secondary_signatory_title: data.secondarySignatoryTitle,
        secondary_signatory_organization: data.secondarySignatoryOrganization,
        secondary_signatory_signature_url: data.secondarySignatorySignatureUrl,
        capstone_logo_url: data.capstoneLogoUrl,
        certificate_theme_color: data.certificateThemeColor,
        schema: {
          ...survey.schema,
          settings: {
            ...survey.schema.settings,
            signatories: data.signatories,
            signatoryName: data.signatoryName,
            signatoryTitle: data.signatoryTitle,
            signatoryOrganization: data.signatoryOrganization,
            signatorySignatureUrl: data.signatorySignatureUrl,
            secondarySignatoryName: data.secondarySignatoryName,
            secondarySignatoryTitle: data.secondarySignatoryTitle,
            secondarySignatoryOrganization: data.secondarySignatoryOrganization,
            secondarySignatorySignatureUrl: data.secondarySignatorySignatureUrl,
            capstoneLogoUrl: data.capstoneLogoUrl,
            certificateThemeColor: data.certificateThemeColor,
          },
        },
      });
      if (updated) {
        setSurvey(updated);
      }
      alert("Certificate configuration and research signatories saved successfully!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to save signatory settings.");
    } finally {
      setIsSavingSignatory(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Back Link */}
      <div>
        <Link
          href="/surveys"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Surveys</span>
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title={survey.title}
        description={survey.description || "Manage responses, view Likert analytics, and edit survey schema."}
        badge={<StatusChip status={survey.status} />}
      >
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="gap-1.5 rounded-none font-mono text-xs flex-1 sm:flex-initial"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>Share Link</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.open(`/s/${survey.slug}`, "_blank")}
            className="gap-1.5 rounded-none font-mono text-xs flex-1 sm:flex-initial"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Form</span>
          </Button>
        </div>
      </PageHeader>

      {/* Main Feature Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full max-w-full min-w-0">
        {/* Responsive Horizontal Scroll Container for Tabs */}
        <div className="w-full max-w-full overflow-x-auto pb-1.5 scrollbar-none border-b border-border/80 min-w-0">
          <TabsList className="inline-flex items-center justify-start gap-1.5 bg-transparent p-0 w-max h-auto rounded-none whitespace-nowrap border-0">
            {[
              {
                id: "analytics",
                label: "Analytics",
                icon: BarChart3,
              },
              {
                id: "jamovi",
                label: "Jamovi Regression & Moderation",
                icon: Calculator,
              },
              {
                id: "responses",
                label: `Responses (${responses.length})`,
                icon: ListOrdered,
              },
              {
                id: "editor",
                label: "Edit Form",
                icon: FileEdit,
              },
              {
                id: "certificate",
                label: "Certificate & Signatory",
                icon: Award,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-none font-mono text-xs uppercase tracking-wider px-3.5 sm:px-4 py-2 transition-all cursor-pointer shrink-0 select-none border",
                    isActive
                      ? "bg-foreground text-background font-bold border-foreground shadow-sm"
                      : "bg-card/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-border/60",
                    "data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:font-bold data-[state=active]:border-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-background" : "text-muted-foreground/70",
                      "group-data-[state=active]:text-background"
                    )}
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="size-1.5 rounded-none bg-background shrink-0 ml-0.5" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab 1: Analytics & Metrics */}
        <TabsContent value="analytics" className="space-y-6 pt-2 w-full max-w-full min-w-0">
          <SurveyAnalyticsDashboard survey={survey} responses={responses} />
        </TabsContent>

        {/* Tab 2: Jamovi Statistical Engine (SOP 1, 2, 3 & 4) */}
        <TabsContent value="jamovi" className="space-y-6 pt-2 w-full max-w-full min-w-0">
          <JamoviAnalysisView survey={survey} responses={responses} />
        </TabsContent>

        {/* Tab 3: Response Submissions & Editing */}
        <TabsContent value="responses" className="space-y-6 pt-2 w-full max-w-full min-w-0">
          <ResponsesTable
            survey={survey}
            responses={responses}
            onResponseUpdated={handleResponseUpdated}
            onResponseDeleted={handleResponseDeleted}
          />
        </TabsContent>

        {/* Tab 4: Survey Form Builder & Schema Editor */}
        <TabsContent value="editor" className="space-y-6 pt-2 w-full max-w-full min-w-0">
          <SurveyFormBuilder
            surveyId={survey.id}
            initialData={{
              title: survey.title,
              description: survey.description || "",
              instructions: survey.instructions || "",
              schema: survey.schema,
            }}
            onSaveSuccess={(updated) => setSurvey(updated)}
          />
        </TabsContent>

        {/* Tab 4: Certificate Authority & Custom Signatory */}
        <TabsContent value="certificate" className="space-y-6 pt-2 w-full max-w-full min-w-0">
          <SignatorySettingsCard
            surveyTitle={survey.title}
            initialData={{
              signatories: (survey.schema?.settings?.signatories || survey.signatories) ?? undefined,
              signatoryName: survey.signatory_name || survey.schema?.settings?.signatoryName,
              signatoryTitle: survey.signatory_title || survey.schema?.settings?.signatoryTitle,
              signatoryOrganization:
                survey.signatory_organization || survey.schema?.settings?.signatoryOrganization,
              signatorySignatureUrl:
                survey.signatory_signature_url || survey.schema?.settings?.signatorySignatureUrl,
              secondarySignatoryName:
                survey.secondary_signatory_name || survey.schema?.settings?.secondarySignatoryName,
              secondarySignatoryTitle:
                survey.secondary_signatory_title || survey.schema?.settings?.secondarySignatoryTitle,
              secondarySignatoryOrganization:
                survey.secondary_signatory_organization ||
                survey.schema?.settings?.secondarySignatoryOrganization,
              secondarySignatorySignatureUrl:
                survey.secondary_signatory_signature_url ||
                survey.schema?.settings?.secondarySignatorySignatureUrl,
              capstoneLogoUrl: survey.capstone_logo_url || survey.schema?.settings?.capstoneLogoUrl,
              certificateThemeColor:
                survey.certificate_theme_color || survey.schema?.settings?.certificateThemeColor,
            }}
            onSave={handleSaveSignatory}
            isSaving={isSavingSignatory}
          />
        </TabsContent>
      </Tabs>

      {/* Share Modal */}
      <ShareModal survey={survey} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
}
