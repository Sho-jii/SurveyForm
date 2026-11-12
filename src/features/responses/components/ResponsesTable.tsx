"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Survey, SurveyResponse } from "@/features/surveys/types";
import { ResponseEditorModal } from "./ResponseEditorModal";
import { exportService } from "@/features/surveys/services/exportService";
import {
  Edit2,
  Search,
  FileSpreadsheet,
  FileCode,
  FileText,
  Clock,
  Download,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ResponsesTableProps {
  survey: Survey;
  responses: SurveyResponse[];
  onResponseUpdated: (updated: SurveyResponse) => void;
  onResponseDeleted: (id: string) => void;
}

export function ResponsesTable({
  survey,
  responses,
  onResponseUpdated,
  onResponseDeleted,
}: ResponsesTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Unique roles
  const roles = Array.from(
    new Set(responses.map((r) => r.respondent_role).filter(Boolean) as string[])
  );

  const filteredResponses = responses.filter((r) => {
    const matchesSearch =
      (r.respondent_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (r.respondent_role?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || r.respondent_role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Search, Filter, and Export Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-full sm:max-w-md min-w-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by respondent name, role, or ID..."
              className="h-9 rounded-none text-xs"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>
          {roles.length > 0 && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by stakeholder role"
              className="h-9 px-3 rounded-none bg-secondary/50 border border-input text-xs font-mono font-medium text-foreground focus:outline-none"
            >
              <option value="all">ALL ROLES</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportService.exportToCsv(survey, responses)}
            className="gap-1.5 rounded-none font-mono text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportService.exportToJson(survey, responses)}
            className="gap-1.5 rounded-none font-mono text-xs"
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>JSON</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => exportService.exportExactSurveyPdf(survey)}
            className="gap-1.5 rounded-none font-mono text-xs"
            title="Download blank survey questionnaire formatted exactly as uploaded"
          >
            <FileText className="w-4 h-4" />
            <span>Original Form PDF</span>
          </Button>
        </div>
      </div>

      {/* Responses List / Table */}
      <Card className="bg-card/60 border-border overflow-hidden rounded-none w-full min-w-0">
        <CardContent className="p-0">
          {filteredResponses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-xs font-mono">NO SURVEY RESPONSES RECORDED YET</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full min-w-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3 px-4">Respondent</th>
                    <th className="py-3 px-4">Stakeholder Group</th>
                    <th className="py-3 px-4">Date Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-xs">
                  {filteredResponses.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-secondary/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.open(`/s/${survey.slug}?edit=${r.id}`, "_blank");
                      }}
                      title="Click to view and edit response in full answering form (new window)"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-none bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                            {(r.respondent_name || "A")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground font-sans block text-sm">
                              {r.respondent_name || "Anonymous Participant"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {r.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {r.respondent_role ? (
                          <Badge variant="secondary" className="rounded-none text-[10px] uppercase">
                            {r.respondent_role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(r.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] rounded-none uppercase font-mono"
                        >
                          Completed
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportService.exportExactSurveyPdf(survey, r);
                            }}
                            className="gap-1 rounded-none text-xs"
                            title="Download respondent's filled questionnaire in original PDF format"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>PDF</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/s/${survey.slug}?edit=${r.id}`, "_blank");
                            }}
                            className="gap-1 rounded-none text-xs hover:bg-primary/20 text-foreground"
                            title="Open questionnaire in new window to edit respondent answers"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-primary" />
                            <span>Edit Form</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Response Modal */}
      {isEditorOpen && selectedResponse && (
        <ResponseEditorModal
          key={selectedResponse.id}
          survey={survey}
          response={selectedResponse}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedResponse(null);
          }}
          onSaved={onResponseUpdated}
          onDeleted={onResponseDeleted}
        />
      )}
    </div>
  );
}
