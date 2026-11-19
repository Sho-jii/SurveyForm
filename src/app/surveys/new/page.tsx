"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/layout/Layout";
import { PageHeader } from "@/components/common/PageHeader";
import { SurveyUploadDropzone } from "@/features/surveys/components/SurveyUploadDropzone";
import { SurveyFormBuilder } from "@/features/surveys/components/SurveyFormBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoogleAuthButton } from "@/components/common/GoogleAuthButton";
import { LoadingState } from "@/components/common/LoadingState";
import { authService } from "@/services/auth/authService";
import type { User } from "@supabase/supabase-js";
import { Sparkles, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function NewSurveyPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [parsedData, setParsedData] = useState<any | null>(null);

  // Check creator authentication session
  useEffect(() => {
    let mounted = true;

    async function init() {
      const user = await authService.getCurrentUser();
      if (mounted) {
        setCurrentUser(user);
        setIsLoadingAuth(false);
      }
    }
    init();

    const unsubscribe = authService.onAuthStateChange((user) => {
      if (mounted) {
        setCurrentUser(user);
        setIsLoadingAuth(false);
      }
    });

    // Check if user uploaded from landing page
    try {
      const stored = sessionStorage.getItem("survey_draft");
      if (stored) {
        setParsedData(JSON.parse(stored));
        sessionStorage.removeItem("survey_draft");
      }
    } catch (e) {
      console.error(e);
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/surveys">
            <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground font-mono text-xs rounded-none">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Surveys</span>
            </Button>
          </Link>
        </div>

        {isLoadingAuth ? (
          <LoadingState message="Verifying creator session..." />
        ) : !currentUser ? (
          /* Unauthenticated Creator Security Gate: Upload will not begin if not signed in */
          <div className="max-w-lg mx-auto py-8">
            <Card className="border border-border/80 bg-card/60 p-6 sm:p-10 text-center rounded-none shadow-xl space-y-6">
              <div className="size-14 border border-primary/40 bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Lock className="size-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading uppercase tracking-wider text-foreground">
                  Creator Authentication Required
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uploading and creating surveys is restricted to authorized creators. Please sign in with your Google account to upload questionnaire PDFs and build survey forms.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <GoogleAuthButton variant="card" redirectTo="/surveys/new" />
                <Link href="/surveys" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="default"
                    className="rounded-none font-mono text-xs uppercase tracking-wider h-10 w-full sm:w-auto"
                  >
                    Explore Public Surveys
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : !parsedData ? (
          <div className="space-y-8 max-w-4xl mx-auto">
            <PageHeader
              title="Create Survey from PDF"
              description="Drop your evaluation questionnaire or survey form PDF. Our parser extracts Likert matrices, sections, and criteria automatically."
              badge={
                <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs rounded-none">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Instant Extraction
                </Badge>
              }
            />

            <SurveyUploadDropzone onParsed={(data) => setParsedData(data)} />

            {/* Feature Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <Card className="bg-card/50 border-border/80 rounded-none shadow-none">
                <CardContent className="p-4 space-y-1.5">
                  <div className="text-primary font-semibold text-xs flex items-center gap-1.5 font-mono uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Likert Matrices & Scales
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Seamlessly handles 5-point Likert scales (Strongly Disagree to Strongly Agree) such as ISO/IEC 25010 & UTAUT.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/80 rounded-none shadow-none">
                <CardContent className="p-4 space-y-1.5">
                  <div className="text-primary font-semibold text-xs flex items-center gap-1.5 font-mono uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Tailorable Requirements
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Make all fields required or optional with 1 click, or configure individual fields (e.g. make Name optional).
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/80 rounded-none shadow-none">
                <CardContent className="p-4 space-y-1.5">
                  <div className="text-primary font-semibold text-xs flex items-center gap-1.5 font-mono uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    JSON Column Storage
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stored as universal JSONB in Supabase to flexibly adapt to any questionnaire structure.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <SurveyFormBuilder
            initialData={parsedData}
            onCancel={() => setParsedData(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
