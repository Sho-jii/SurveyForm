"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Survey, SurveyResponse } from "@/features/surveys/types";
import { surveyService } from "@/features/surveys/services/surveyService";
import { Save, User, Calendar, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface ResponseEditorModalProps {
  survey: Survey;
  response: SurveyResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: SurveyResponse) => void;
  onDeleted?: (id: string) => void;
}

export function ResponseEditorModal({
  survey,
  response,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: ResponseEditorModalProps) {
  // Always call hooks unconditionally at top of component
  const [name, setName] = useState(response?.respondent_name || "");
  const [role, setRole] = useState(response?.respondent_role || "");
  const [answers, setAnswers] = useState<Record<string, any>>({ ...(response?.answers || {}) });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (response) {
      setName(response.respondent_name || "");
      setRole(response.respondent_role || "");
      setAnswers({ ...(response.answers || {}) });
    }
  }, [response?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.removeProperty("overflow");
    };
  }, [isOpen, onClose]);

  // Guard condition strictly after all hooks
  if (!response || !isOpen) return null;

  const handleLikertChange = (itemId: string, val: number, code?: string, isUtaut?: boolean) => {
    setAnswers((prev) => {
      const next = { ...prev, [itemId]: val };
      if (code) {
        const prefix = isUtaut ? "utaut_" : "iso_";
        next[`${prefix}${code}`] = val;
        next[code] = val;
      }
      return next;
    });
  };

  const handleTextChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Try Next.js API PUT endpoint
      try {
        await fetch(`/api/responses/${response.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            respondent_name: name || null,
            respondent_role: role || null,
            answers,
          }),
        });
      } catch (apiErr) {
        console.warn("PUT /api/responses failed, continuing with direct service:", apiErr);
      }

      // 2. Direct service update
      const updated = await surveyService.updateSurveyResponse(response.id, {
        respondent_name: name || null,
        respondent_role: role || null,
        answers,
      });

      const result: SurveyResponse = {
        ...response,
        ...(updated || {}),
        respondent_name: name || null,
        respondent_role: role || null,
        answers,
        updated_at: new Date().toISOString(),
      };

      onSaved(result);
      toast.success("Survey response updated successfully!");
      onClose();
    } catch (e: any) {
      console.error(e);
      // Fallback local update
      const localUpdated: SurveyResponse = {
        ...response,
        respondent_name: name || null,
        respondent_role: role || null,
        answers,
        updated_at: new Date().toISOString(),
      };
      onSaved(localUpdated);
      toast.success("Survey response updated locally");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this response submission?")) return;
    try {
      await surveyService.deleteSurveyResponse(response.id);
      if (onDeleted) onDeleted(response.id);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to delete response.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="response-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl h-[90vh] max-h-[90dvh] flex flex-col rounded-none border border-border bg-card shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card shrink-0 flex items-start justify-between gap-4 z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary rounded-none font-mono text-[10px] uppercase">
                Edit Survey Response
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">ID: {response.id.slice(0, 8)}...</span>
            </div>
            <h3 id="response-editor-title" className="text-xl font-bold font-heading text-foreground">
              Modify Submitted Answers
            </h3>
            <p className="text-xs text-muted-foreground">
              Adjust respondent details, Likert ratings, or remarks directly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer shrink-0 rounded-none border border-border/40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body - Native & Smooth Scroll */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0"
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
        >
          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-none bg-secondary/30 border border-border/70">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5 uppercase">
                <User className="w-3.5 h-3.5 text-primary" />
                Respondent Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                className="rounded-none bg-background/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono font-medium text-muted-foreground uppercase">
                Stakeholder Group / Role
              </Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. IT Expert, Fisherman..."
                className="rounded-none bg-background/60"
              />
            </div>
          </div>

          {/* Questions & Answer Editor */}
          <div className="space-y-5">
            <h4 className="text-sm font-semibold text-foreground font-heading uppercase tracking-wider font-mono">
              Recorded Answers
            </h4>

            {survey.schema.questions.map((q) => {
              if (q.type === "likert_matrix" && q.matrixRows) {
                const isUtaut = q.id.toLowerCase().includes("utaut") || q.title.toUpperCase().includes("UTAUT");
                const prefix = isUtaut ? "utaut_" : "iso_";

                return (
                  <div key={q.id} className="p-4 rounded-none bg-background/50 border border-border/70 space-y-3">
                    <span className="text-xs font-semibold text-foreground font-heading block">
                      {q.title}
                    </span>
                    <div className="space-y-2">
                      {q.matrixRows.map((row) => {
                        const currentVal =
                          answers[row.id] ??
                          (row.code ? answers[`${prefix}${row.code}`] : undefined) ??
                          (row.code ? answers[row.code] : undefined);

                        return (
                          <div
                            key={row.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-none bg-secondary/20 border border-border/40 text-xs"
                          >
                            <span className="font-medium text-muted-foreground">
                              {row.code ? `[${row.code}] ` : ""}
                              {row.label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {[1, 2, 3, 4, 5].map((num) => {
                                const isSelected = Number(currentVal) === num;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleLikertChange(row.id, num, row.code, isUtaut)}
                                    className={`size-7 rounded-none font-mono font-bold text-xs transition-colors border cursor-pointer ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground border-border/70"
                                    }`}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (q.type === "textarea" || q.id.includes("comment")) {
                const currentComment = answers[q.id] || answers.comments_suggestions || answers.comments || "";
                return (
                  <div key={q.id} className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{q.title}</Label>
                    <Textarea
                      value={currentComment}
                      onChange={(e) => {
                        handleTextChange(q.id, e.target.value);
                        handleTextChange("comments_suggestions", e.target.value);
                      }}
                      rows={3}
                      className="rounded-none bg-background/60"
                      placeholder="Enter respondent comments or suggestions..."
                    />
                  </div>
                );
              }

              if (q.type === "text" && !q.id.toLowerCase().includes("name")) {
                return (
                  <div key={q.id} className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{q.title}</Label>
                    <Input
                      value={answers[q.id] || ""}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      className="rounded-none bg-background/60"
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card shrink-0 flex flex-row items-center justify-between gap-3 z-10">
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-none font-mono text-xs">
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete Response
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-none font-mono text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 rounded-none font-mono text-xs">
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
