"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import { MetricCard } from "@/components/common/MetricCard";
import { Survey, SurveyResponse } from "@/features/surveys/types";
import { calculateSurveyMetrics } from "../utils/calculateSurveyMetrics";
import {
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from "recharts";

interface SurveyAnalyticsDashboardProps {
  survey: Survey;
  responses: SurveyResponse[];
}

export function SurveyAnalyticsDashboard({ survey, responses }: SurveyAnalyticsDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const metrics = calculateSurveyMetrics(survey, responses);

  // Prepare dimension chart data
  const dimensionChartData = metrics.dimensionScores.map((dim) => ({
    name: dim.sectionTitle.replace(/^\d+\.\s*/, "").slice(0, 16),
    fullName: dim.sectionTitle,
    score: dim.averageScore,
  }));

  // Prepare role chart data
  const roleChartData = Object.entries(metrics.roleBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#00c758", "#3080ff", "#8d54ff", "#fac800", "#00d294", "#ff667f"];

  // Verbal interpretation for 5-point Likert
  const getVerbalInterpretation = (score: number) => {
    if (score >= 4.5) return { label: "Strongly Agree / Excellent", color: "text-emerald-400" };
    if (score >= 3.5) return { label: "Agree / High Quality", color: "text-primary" };
    if (score >= 2.5) return { label: "Moderately Agree / Acceptable", color: "text-amber-400" };
    if (score >= 1.5) return { label: "Disagree / Needs Improvement", color: "text-rose-400" };
    return { label: "Strongly Disagree / Unsatisfactory", color: "text-destructive" };
  };

  const overallInterp = getVerbalInterpretation(metrics.overallMeanScore);

  return (
    <div className="space-y-8 w-full max-w-full min-w-0">
      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <MetricCard
          title="Total Submissions"
          value={metrics.totalResponses}
          subtitle="Completed evaluations"
          icon={<Users className="w-4 h-4" />}
        />
        <MetricCard
          title="Overall Mean Score"
          value={metrics.overallMeanScore > 0 ? `${metrics.overallMeanScore} / 5.0` : "—"}
          subtitle={overallInterp.label}
          icon={<Award className="w-4 h-4 text-emerald-400" />}
          trend={metrics.overallMeanScore >= 4.5 ? "★ Outstanding" : undefined}
        />
        <MetricCard
          title="Completion Rate"
          value={`${Math.round(metrics.completionRate)}%`}
          subtitle="Form submission rate"
          icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Evaluated Dimensions"
          value={metrics.dimensionScores.length}
          subtitle="ISO/IEC 25010 & UTAUT"
          icon={<Layers className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Dimension Mean Scores Bar Chart */}
        <Card className="lg:col-span-2 relative bg-card/80 border-border/80 shadow-none rounded-none w-full min-w-0 overflow-hidden">
          <DecorIcon position="top-right" className="opacity-40" />
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base font-semibold font-heading uppercase tracking-wide">
                  Dimension Mean Scores (Likert 1–5 Scale)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Aggregated average across all evaluation criteria
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs rounded-none">
                Mean: {metrics.overallMeanScore}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {dimensionChartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground font-mono">
                NO LIKERT DATA RECORDED YET.
              </div>
            ) : !isMounted ? (
              <div className="w-full h-[280px] flex items-center justify-center font-mono text-xs text-muted-foreground animate-pulse">
                INITIALIZING LIKERT CHART...
              </div>
            ) : (
              <div className="w-full h-[280px] min-h-[280px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                  <BarChart data={dimensionChartData} margin={{ top: 15, right: 15, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263342" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      width={30}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]?.payload;
                          return (
                            <div className="bg-popover text-popover-foreground border-2 border-border p-3 font-mono text-xs rounded-none shadow-2xl">
                              <p className="font-bold text-foreground text-xs mb-1.5 uppercase tracking-wide border-b border-border/60 pb-1">
                                {data?.fullName || data?.name}
                              </p>
                              <div className="flex items-center justify-between gap-3 pt-0.5">
                                <span className="text-muted-foreground">Mean Likert Score:</span>
                                <span className="text-emerald-400 font-bold text-sm">{data?.score} / 5.00</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" fill="#10b981" isAnimationActive={false} minPointSize={6}>
                      {dimensionChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stakeholder Roles Breakdown */}
        <Card className="relative bg-card/80 border-border/80 shadow-none rounded-none w-full min-w-0 overflow-hidden">
          <DecorIcon position="top-right" className="opacity-40" />
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold font-heading uppercase tracking-wide">
              Stakeholder Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Respondent participation by role
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex flex-col justify-between">
            {roleChartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground font-mono">
                NO ROLE RESPONSES YET.
              </div>
            ) : !isMounted ? (
              <div className="w-full h-[280px] flex items-center justify-center font-mono text-xs text-muted-foreground animate-pulse">
                INITIALIZING BREAKDOWN...
              </div>
            ) : (
              <>
                <div className="w-full h-[200px] min-h-[200px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <PieChart>
                      <Pie
                        data={roleChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {roleChartData.map((_, index) => (
                          <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-popover text-popover-foreground border-2 border-border p-2.5 font-mono text-xs rounded-none shadow-2xl">
                                <span className="font-bold text-foreground block mb-0.5">{data.name}</span>
                                <span className="text-primary font-bold">{data.value} participant(s)</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-2 text-xs">
                  {roleChartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span
                        className="size-2 rounded-none shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name}: <strong className="text-foreground">{entry.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dimension Score Tables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm md:text-base font-semibold font-heading uppercase tracking-wider text-foreground">
            Dimension Quality Details (ISO/IEC 25010 & UTAUT)
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            SCALE: 1 (STRONGLY DISAGREE) TO 5 (STRONGLY AGREE)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          {metrics.dimensionScores.map((dim) => {
            const interp = getVerbalInterpretation(dim.averageScore);

            return (
              <Card key={dim.sectionId} className="relative bg-card/70 border-border/80 shadow-none rounded-none w-full min-w-0 overflow-hidden">
                <DecorIcon position="top-right" className="opacity-30" />
                <CardHeader className="p-4 pb-2 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground font-heading">
                      {dim.sectionTitle}
                    </span>
                    <Badge variant="outline" className={`font-mono text-xs font-bold rounded-none ${interp.color}`}>
                      {dim.averageScore} / 5.0
                    </Badge>
                  </div>
                  <span className={`text-[11px] font-medium ${interp.color}`}>
                    {interp.label}
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2">
                  {dim.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0"
                    >
                      <span className="text-muted-foreground truncate max-w-[75%]" title={item.description}>
                        {item.code || ""} {item.label}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {item.meanScore > 0 ? item.meanScore.toFixed(2) : "—"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
