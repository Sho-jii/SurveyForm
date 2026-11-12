import { AppLayout } from "@/layout/Layout";
import { SurveyDetailView } from "@/features/surveys/components/SurveyDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <AppLayout>
      <SurveyDetailView id={resolvedParams.id} />
    </AppLayout>
  );
}

