import { surveyService } from "@/features/surveys/services/surveyService";
import { PublicSurveyViewer } from "@/features/public-form/components/PublicSurveyViewer";
import { EmptyState } from "@/components/common/EmptyState";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function PublicSurveyPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const survey = await surveyService.getSurveyById(resolvedParams.slug);

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full">
          <EmptyState
            title="Survey Questionnaire Not Found"
            description="The requested survey link does not exist, has expired, or is currently unpublished."
            actionText="Go to Homepage"
            onAction={() => {}}
          />
          <div className="text-center mt-4">
            <Link href="/surveys">
              <Button variant="outline" size="sm">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Load existing response if in edit mode
  let initialResponse = null;
  if (resolvedSearchParams?.edit) {
    initialResponse = await surveyService.getSurveyResponseById(resolvedSearchParams.edit);
  }

  return (
    <div className="min-h-screen bg-background text-foreground efferd-grid relative">
      <div className="efferd-glow absolute inset-0 pointer-events-none" />
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md py-3 px-4 text-center">
        <span className="font-heading text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          SurveyForm — Secure Response Portal
        </span>
      </header>
      <main className="relative z-10">
        <PublicSurveyViewer survey={survey} initialResponse={initialResponse} />
      </main>
    </div>
  );
}

