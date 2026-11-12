import { Survey, SurveyResponse, SurveyAnalytics, LikertDimensionScore } from "../../surveys/types";

export function calculateSurveyMetrics(survey: Survey, responses: SurveyResponse[]): SurveyAnalytics {
  const totalResponses = responses.length;
  const completedCount = responses.filter((r) => r.completion_status === "completed").length;
  const completionRate = totalResponses > 0 ? (completedCount / totalResponses) * 100 : 0;

  // Timestamps
  const sortedByDate = [...responses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const firstResponseAt = sortedByDate.length > 0 ? sortedByDate[0].created_at : null;
  const lastResponseAt = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].created_at : null;

  // Role Breakdown
  const roleBreakdown: Record<string, number> = {};
  responses.forEach((r) => {
    const role = r.respondent_role || (r.answers?.demographic_role as string) || "Anonymous";
    roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
  });

  // Dimension & Question Analytics
  const dimensionScores: LikertDimensionScore[] = [];
  const questionStats: SurveyAnalytics["questionStats"] = {};

  let totalLikertScoreSum = 0;
  let totalLikertItemCount = 0;

  // Process all questions
  survey.schema.questions.forEach((q) => {
    if (q.type === "likert_matrix" && q.matrixRows) {
      let sectionSum = 0;
      let sectionItemsAnswered = 0;

      const itemResults = q.matrixRows.map((row) => {
        let sum = 0;
        let count = 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        responses.forEach((r) => {
          let rawVal = r.answers?.[row.id];
          if (rawVal === undefined && row.code) {
            rawVal = r.answers?.[row.code] ?? r.answers?.[row.id.replace(/_/g, ".")];
          }
          const val = typeof rawVal === "number" ? rawVal : Number(rawVal);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            sum += val;
            count++;
            distribution[val] = (distribution[val] || 0) + 1;
          }
        });

        const meanScore = count > 0 ? Number((sum / count).toFixed(2)) : 0;
        if (count > 0) {
          sectionSum += sum;
          sectionItemsAnswered += count;
          totalLikertScoreSum += sum;
          totalLikertItemCount += count;
        }

        return {
          id: row.id,
          code: row.code,
          label: row.label,
          description: row.description,
          meanScore,
          distribution,
        };
      });

      const sectionAvg = sectionItemsAnswered > 0 ? Number((sectionSum / sectionItemsAnswered).toFixed(2)) : 0;

      dimensionScores.push({
        sectionId: q.sectionId || q.id,
        sectionTitle: q.title,
        averageScore: sectionAvg,
        itemCount: q.matrixRows.length,
        totalResponses: sectionItemsAnswered,
        items: itemResults,
      });

      questionStats[q.id] = {
        questionTitle: q.title,
        type: q.type,
        answeredCount: sectionItemsAnswered,
        meanScore: sectionAvg,
      };
    } else {
      // General question stats
      let answeredCount = 0;
      const optionCounts: Record<string, number> = {};
      const recentTextAnswers: string[] = [];

      responses.forEach((r) => {
        const val = r.answers?.[q.id];
        if (val !== undefined && val !== null && val !== "") {
          answeredCount++;
          if (typeof val === "string") {
            optionCounts[val] = (optionCounts[val] || 0) + 1;
            if (q.type === "text" || q.type === "textarea") {
              if (recentTextAnswers.length < 10) recentTextAnswers.push(val);
            }
          }
        }
      });

      questionStats[q.id] = {
        questionTitle: q.title,
        type: q.type,
        answeredCount,
        optionCounts,
        recentTextAnswers,
      };
    }
  });

  const overallMeanScore = totalLikertItemCount > 0 ? Number((totalLikertScoreSum / totalLikertItemCount).toFixed(2)) : 0;

  return {
    totalResponses,
    completionRate,
    firstResponseAt,
    lastResponseAt,
    roleBreakdown,
    dimensionScores,
    overallMeanScore,
    questionStats,
  };
}

