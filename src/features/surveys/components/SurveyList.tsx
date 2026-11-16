"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DecorIcon } from "@/components/ui/decor-icon";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { StatusChip } from "@/components/common/StatusChip";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { GoogleAuthButton } from "@/components/common/GoogleAuthButton";
import { ShareModal } from "./ShareModal";
import { Survey } from "../types";
import { surveyService } from "../services/surveyService";
import { authService, ADMIN_EMAIL } from "@/services/auth/authService";
import type { User } from "@supabase/supabase-js";
import {
  Share2,
  FileText,
  BarChart2,
  Trash2,
  Users,
  CheckCircle2,
  Sparkles,
  Lock,
  Globe,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function SurveyList() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [managedSurveys, setManagedSurveys] = useState<Survey[]>([]);
  const [publicSurveys, setPublicSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("manage");
  const [selectedShareSurvey, setSelectedShareSurvey] = useState<Survey | null>(null);

  // Subscribe to auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const user = await authService.getCurrentUser();
      if (mounted) {
        setCurrentUser(user);
        // If not logged in, default to the public tab so guests see public surveys right away
        if (!user) {
          setActiveTab("public");
        }
      }
    }
    initAuth();

    const unsubscribe = authService.onAuthStateChange((user) => {
      if (mounted) {
        setCurrentUser(user);
        if (user) {
          setActiveTab("manage");
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Load both public and managed surveys
  const loadSurveys = async () => {
    setIsLoading(true);
    try {
      const [managed, pub] = await Promise.all([
        surveyService.getMySurveys(currentUser),
        surveyService.getPublicSurveys(),
      ]);
      setManagedSurveys(managed);
      setPublicSurveys(pub);
    } catch (e) {
      console.error("Failed to load surveys:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, [currentUser]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this survey and all its responses?")) return;
    try {
      await surveyService.deleteSurvey(id);
      setManagedSurveys((prev) => prev.filter((s) => s.id !== id));
      setPublicSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete survey.");
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading survey campaigns..." />;
  }

  const isMasterAdmin = (currentUser?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const totalResponses = managedSurveys.reduce((sum, s) => sum + (s.response_count || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Research Survey Platform"
        description="Public survey directory and creator management portal for academic evaluations and capstone research."
        badge={
          currentUser ? (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[10px] rounded-none gap-1">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span>Creator Session Active</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border text-foreground bg-secondary/60 font-mono text-[10px] rounded-none gap-1.5 px-2 py-0.5">
              <Globe className="size-3 text-primary shrink-0" />
              <span>{publicSurveys.length} {publicSurveys.length === 1 ? "Public Survey Available" : "Public Surveys Available"}</span>
            </Badge>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {currentUser && (
            <Link href="/surveys/new">
              <Button size="default" className="gap-2 rounded-none font-mono text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Import Survey PDF</span>
              </Button>
            </Link>
          )}
        </div>
      </PageHeader>

      {/* Main Tabs: Public Directory vs Creator Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border/60 pb-1">
          <TabsList className="bg-transparent p-0 gap-2 h-auto flex flex-wrap">
            <TabsTrigger
              value="public"
              className="rounded-none border border-border data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-xs uppercase tracking-wider py-2 px-3 sm:px-4 gap-2"
            >
              <Globe className="size-3.5" />
              <span>Explore Public Surveys</span>
              <Badge variant="secondary" className="rounded-none text-[10px] py-0 px-1 font-mono">
                {publicSurveys.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="manage"
              className="rounded-none border border-border data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-xs uppercase tracking-wider py-2 px-3 sm:px-4 gap-2"
            >
              <FileText className="size-3.5" />
              <span>Manage My Surveys</span>
              {currentUser && (
                <Badge variant="secondary" className="rounded-none text-[10px] py-0 px-1 font-mono">
                  {managedSurveys.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Public Surveys Directory (Clean Public View without clutter or metric cards) */}
        <TabsContent value="public" className="space-y-4 m-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/40 gap-2">
            <div>
              <h2 className="text-base font-semibold font-heading uppercase tracking-wider text-foreground">
                Public Surveys Directory
              </h2>
              <p className="text-xs text-muted-foreground">
                Participate in active capstone questionnaires and submit your expert feedback.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs rounded-none border-border bg-secondary/50 px-2.5 py-1 w-fit">
              <Globe className="size-3 mr-1 text-primary" />
              <span>{publicSurveys.length} {publicSurveys.length === 1 ? "SURVEY AVAILABLE" : "SURVEYS AVAILABLE"}</span>
            </Badge>
          </div>

          {publicSurveys.length === 0 ? (
            <EmptyState
              title="No public surveys currently available"
              description="There are currently no active public surveys published on the system."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {publicSurveys.map((survey) => (
                <Card
                  key={survey.id}
                  className="relative bg-card/70 hover:bg-card/95 border-border/80 hover:border-foreground/40 transition-all group overflow-hidden rounded-none shadow-none"
                >
                  <DecorIcon position="top-right" className="opacity-30 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip status={survey.status} />
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px] sm:max-w-none">
                            /{survey.slug}
                          </span>
                          <Badge variant="secondary" className="text-xs gap-1 rounded-none font-mono">
                            <Users className="w-3 h-3 text-primary" />
                            <span>{survey.response_count || 0} responses</span>
                          </Badge>
                        </div>

                        <Link href={`/s/${survey.slug}`} className="block group-hover:text-primary transition-colors">
                          <h3 className="text-base md:text-lg font-semibold font-heading text-foreground break-words">
                            {survey.title}
                          </h3>
                        </Link>

                        {survey.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-3xl leading-relaxed break-words">
                            {survey.description}
                          </p>
                        )}

                        <div className="text-[11px] text-muted-foreground font-mono pt-1 flex flex-wrap items-center gap-2 sm:gap-4">
                          <span>PUBLISHED: {formatDate(survey.created_at)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>QUESTIONS: {survey.schema?.questions?.length || 0}</span>
                        </div>
                      </div>

                      {/* Public Action Buttons: Full-width on mobile with equal proportion */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 md:pt-0 w-full md:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShareSurvey(survey);
                          }}
                          className="gap-1.5 rounded-none font-mono text-xs flex-1 sm:flex-none justify-center"
                        >
                          <Share2 className="w-3.5 h-3.5 text-primary" />
                          <span>Share</span>
                        </Button>

                        <Link href={`/s/${survey.slug}`} className="flex-1 sm:flex-none">
                          <Button size="sm" className="w-full gap-1.5 rounded-none font-mono text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 justify-center">
                            <span>Answer Survey</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Creator Management */}
        <TabsContent value="manage" className="space-y-6 m-0">
          {!currentUser ? (
            /* Unauthenticated Security Gate */
            <Card className="border border-border/80 bg-card/60 p-6 sm:p-12 text-center rounded-none shadow-xl max-w-lg mx-auto space-y-6">
              <div className="size-14 border border-primary/40 bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Lock className="size-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading uppercase tracking-wider text-foreground">
                  Creator Authentication Required
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Management controls, Jamovi data exports, analytics dashboards, and signatory configurations are protected. Sign in with your authorized Google account to manage your campaigns.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <GoogleAuthButton variant="card" />
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setActiveTab("public")}
                  className="rounded-none font-mono text-xs uppercase tracking-wider h-10 w-full sm:w-auto"
                >
                  Explore Public Surveys
                </Button>
              </div>
            </Card>
          ) : (
            /* Authenticated Management View */
            <div className="space-y-6">
              {/* Campaign Metrics: ONLY visible when logged-in user has surveys */}
              {managedSurveys.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard
                    title="Managed Campaigns"
                    value={managedSurveys.length}
                    subtitle="Active in your workspace"
                    icon={<FileText className="w-4 h-4 text-emerald-400" />}
                  />
                  <MetricCard
                    title="Total Responses"
                    value={totalResponses}
                    subtitle="Collected evaluation entries"
                    icon={<Users className="w-4 h-4 text-primary" />}
                  />
                  <MetricCard
                    title="Active Surveys"
                    value={managedSurveys.filter((s) => s.status === "published").length}
                    subtitle="Open for public submission"
                    icon={<Globe className="w-4 h-4 text-sky-400" />}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/40 gap-2">
                <div>
                  <h2 className="text-base font-semibold font-heading uppercase tracking-wider text-foreground">
                    Your Managed Surveys
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Authorized creator workspace {isMasterAdmin && "· Full System Access"}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs rounded-none border-border bg-secondary/50 px-2.5 py-1 w-fit">
                  <FileText className="size-3 mr-1 text-emerald-400" />
                  <span>{managedSurveys.length} {managedSurveys.length === 1 ? "CAMPAIGN" : "CAMPAIGNS"}</span>
                </Badge>
              </div>

              {managedSurveys.length === 0 ? (
                <EmptyState
                  title="No surveys attached to your account yet"
                  description="You have not created any surveys under this account. Import a survey questionnaire PDF to launch your first research campaign."
                  actionText="Import Survey PDF"
                  onAction={() => (window.location.href = "/surveys/new")}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {managedSurveys.map((survey) => (
                    <Card
                      key={survey.id}
                      className="relative bg-card/70 hover:bg-card/95 border-border/80 hover:border-foreground/40 transition-all group overflow-hidden rounded-none shadow-none"
                    >
                      <DecorIcon position="top-right" className="opacity-30 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusChip status={survey.status} />
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px] sm:max-w-none">
                                /{survey.slug}
                              </span>
                              <Badge variant="secondary" className="text-xs gap-1 rounded-none font-mono">
                                <Users className="w-3 h-3 text-primary" />
                                <span>{survey.response_count || 0} responses</span>
                              </Badge>
                              <Badge variant="outline" className="text-[10px] font-mono rounded-none text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                                Verified Campaign
                              </Badge>
                            </div>

                            <Link href={`/surveys/${survey.id}`} className="block group-hover:text-primary transition-colors">
                              <h3 className="text-base md:text-lg font-semibold font-heading text-foreground break-words">
                                {survey.title}
                              </h3>
                            </Link>

                            {survey.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 max-w-3xl leading-relaxed break-words">
                                {survey.description}
                              </p>
                            )}

                            <div className="text-[11px] text-muted-foreground font-mono pt-1 flex flex-wrap items-center gap-2 sm:gap-4">
                              <span>CREATED: {formatDate(survey.created_at)}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>QUESTIONS: {survey.schema?.questions?.length || 0}</span>
                            </div>
                          </div>

                          {/* Managed Action Buttons: Responsive row */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 w-full md:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShareSurvey(survey);
                              }}
                              className="gap-1.5 rounded-none font-mono text-xs flex-1 sm:flex-none justify-center"
                            >
                              <Share2 className="w-3.5 h-3.5 text-primary" />
                              <span>Share</span>
                            </Button>

                            <Link href={`/surveys/${survey.id}`} className="flex-1 sm:flex-none">
                              <Button variant="secondary" size="sm" className="w-full gap-1.5 rounded-none font-mono text-xs font-bold justify-center">
                                <BarChart2 className="w-3.5 h-3.5" />
                                <span>Manage</span>
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDelete(e, survey.id)}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-none border border-transparent hover:border-destructive/30 shrink-0"
                              title="Delete Survey"
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
          )}
        </TabsContent>
      </Tabs>

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
