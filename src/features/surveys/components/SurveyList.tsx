"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { StatusChip } from "@/components/common/StatusChip";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { ShareModal } from "./ShareModal";
import { Survey } from "../types";
import { surveyService } from "../services/surveyService";
import {
  Share2,
  FileText,
  BarChart2,
  Trash2,
  Users,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShareSurvey, setSelectedShareSurvey] = useState<Survey | null>(null);

  const loadSurveys = async () => {
    setIsLoading(true);
    try {
      const data = await surveyService.getMySurveys();
      setSurveys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this survey and all its responses?")) return;
    try {
      await surveyService.deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete survey.");
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your survey campaigns..." />;
  }

  const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Survey Management"
        description="Manage surveys created on this device. Device sessions are preserved locally even across device restarts."
        badge={
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[10px] rounded-none gap-1">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Saved Device Session
          </Badge>
        }
      >
        <Link href="/surveys/new">
          <Button size="default" className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Import Survey PDF</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Surveys"
          value={surveys.length}
          subtitle="Ready for distribution"
          icon={<FileText className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Total Responses"
          value={totalResponses}
          subtitle="Completed evaluations"
          icon={<Users className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          title="Engine Status"
          value="Operational"
          subtitle="Supabase & JSON Schema"
          icon={<CheckCircle2 className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* Surveys List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h2 className="text-base font-semibold font-heading uppercase tracking-wider text-foreground">Your Surveys</h2>
          <span className="text-xs text-muted-foreground font-mono">{surveys.length} CAMPAIGNS</span>
        </div>

        {surveys.length === 0 ? (
          <EmptyState
            title="No surveys created on this device"
            description="Surveys you create on this computer or phone are saved to this device's persistent session. You haven't created any surveys from this browser yet."
            actionText="Import Survey PDF"
            onAction={() => (window.location.href = "/surveys/new")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                className="relative bg-card/70 hover:bg-card/95 border-border/80 hover:border-foreground/40 transition-all group overflow-hidden rounded-none shadow-none"
              >
                <DecorIcon position="top-right" className="opacity-30 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StatusChip status={survey.status} />
                        <span className="text-xs text-muted-foreground font-mono">
                          /{survey.slug}
                        </span>
                        <Badge variant="secondary" className="text-xs gap-1 rounded-none font-mono">
                          <Users className="w-3 h-3 text-primary" />
                          <span>{survey.response_count || 0} responses</span>
                        </Badge>
                      </div>

                      <Link href={`/surveys/${survey.id}`} className="block group-hover:text-primary transition-colors">
                        <h3 className="text-base md:text-lg font-semibold font-heading text-foreground">
                          {survey.title}
                        </h3>
                      </Link>

                      {survey.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-3xl leading-relaxed">
                          {survey.description}
                        </p>
                      )}

                      <div className="text-[11px] text-muted-foreground font-mono pt-1 flex items-center gap-4">
                        <span>CREATED: {formatDate(survey.created_at)}</span>
                        <span>•</span>
                        <span>QUESTIONS: {survey.schema?.questions?.length || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShareSurvey(survey);
                        }}
                        className="gap-1.5 rounded-none font-mono text-xs"
                      >
                        <Share2 className="w-3.5 h-3.5 text-primary" />
                        <span>Share</span>
                      </Button>

                      <Link href={`/surveys/${survey.id}`}>
                        <Button variant="secondary" size="sm" className="gap-1.5 rounded-none font-mono text-xs">
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, survey.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-none border border-transparent hover:border-destructive/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {selectedShareSurvey && (
        <ShareModal
          survey={selectedShareSurvey}
          isOpen={Boolean(selectedShareSurvey)}
          onClose={() => setSelectedShareSurvey(null)}
        />
      )}
    </div>
  );
}
