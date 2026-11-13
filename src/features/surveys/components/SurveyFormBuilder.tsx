"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/ui/decor-icon";
import { SurveySchema, SurveyQuestion } from "../types";
import { surveyService } from "../services/surveyService";
import {
  SignatorySettingsCard,
  SignatoryData,
} from "@/features/certificates/components/SignatorySettingsCard";
import {
  Save,
  Trash2,
  Plus,
  Sparkles,
  Settings2,
  CheckCircle2,
  Award,
} from "lucide-react";

import { toast } from "sonner";

interface SurveyFormBuilderProps {
  initialData: {
    title: string;
    description: string;
    instructions: string;
    schema: SurveySchema;
  };
  surveyId?: string;
  onSaveSuccess?: (updated: any) => void;
  onCancel?: () => void;
}

export function SurveyFormBuilder({ initialData, surveyId, onSaveSuccess, onCancel }: SurveyFormBuilderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [instructions, setInstructions] = useState(initialData.instructions);
  const [schema, setSchema] = useState<SurveySchema>(initialData.schema);
  const [signatory, setSignatory] = useState<SignatoryData>(() => {
    const s = initialData.schema.settings || {};
    return {
      signatories: s.signatories,
      signatoryName: s.signatoryName || "JARIB M. SIOCO",
      signatoryTitle: s.signatoryTitle || "Lead Researcher & Platform Architect",
      signatoryOrganization: s.signatoryOrganization || "HITOVIS Research Project",
      signatorySignatureUrl: s.signatorySignatureUrl || "",
      secondarySignatoryName: s.secondarySignatoryName,
      secondarySignatoryTitle: s.secondarySignatoryTitle,
      secondarySignatoryOrganization: s.secondarySignatoryOrganization,
      secondarySignatorySignatureUrl: s.secondarySignatorySignatureUrl,
      capstoneLogoUrl: s.capstoneLogoUrl,
      certificateThemeColor: s.certificateThemeColor || "gold",
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if initialData changes externally
  useEffect(() => {
    setTitle(initialData.title);
    setDescription(initialData.description);
    setInstructions(initialData.instructions);
    setSchema(initialData.schema);
    const s = initialData.schema.settings || {};
    setSignatory({
      signatories: s.signatories,
      signatoryName: s.signatoryName || "JARIB M. SIOCO",
      signatoryTitle: s.signatoryTitle || "Lead Researcher & Platform Architect",
      signatoryOrganization: s.signatoryOrganization || "HITOVIS Research Project",
      signatorySignatureUrl: s.signatorySignatureUrl || "",
      secondarySignatoryName: s.secondarySignatoryName,
      secondarySignatoryTitle: s.secondarySignatoryTitle,
      secondarySignatoryOrganization: s.secondarySignatoryOrganization,
      secondarySignatorySignatureUrl: s.secondarySignatorySignatureUrl,
      capstoneLogoUrl: s.capstoneLogoUrl,
      certificateThemeColor: s.certificateThemeColor || "gold",
    });
  }, [initialData]);

  // Global toggle: Make all required or all optional
  const handleToggleAllRequired = (required: boolean) => {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => ({
        ...q,
        required,
      })),
      settings: {
        ...prev.settings,
        requireAll: required,
      },
    }));
  };

  // Toggle individual question required state
  const handleToggleQuestionRequired = (qId: string, required: boolean) => {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === qId ? { ...q, required } : q)),
    }));
  };

  // Update question details
  const handleUpdateQuestion = (qId: string, updates: Partial<SurveyQuestion>) => {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    }));
  };

  // Delete question
  const handleDeleteQuestion = (qId: string) => {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
  };

  // Add new question
  const handleAddQuestion = () => {
    const newQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      type: "text",
      title: "New Survey Question",
      description: "Enter instructions or description for the respondent.",
      required: true,
      placeholder: "Answer here...",
    };
    setSchema((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  // Update a single matrix row within a likert question
  const handleUpdateMatrixRow = (
    qId: string,
    rowId: string,
    field: "code" | "label" | "description",
    val: string
  ) => {
    setSchema((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== qId || !q.matrixRows) return q;
        return {
          ...q,
          matrixRows: q.matrixRows.map((r) =>
            r.id === rowId ? { ...r, [field]: val } : r
          ),
        };
      }),
    }));
  };

  // Save signatory configuration specifically
  const handleSaveSignatoryFromBuilder = async (data: SignatoryData) => {
    setSignatory(data);
    if (surveyId) {
      try {
        const updatedSchema: SurveySchema = {
          ...schema,
          settings: {
            ...schema.settings,
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
        };

        const updated = await surveyService.updateSurvey(surveyId, {
          schema: updatedSchema,
          signatory_name: data.signatoryName,
          signatory_title: data.signatoryTitle,
          signatory_organization: data.signatoryOrganization,
          signatory_signature_url: data.signatorySignatureUrl,
        });

        if (onSaveSuccess && updated) {
          onSaveSuccess(updated);
        }
        toast.success("Certificate & research signatories saved to database!");
      } catch (err: any) {
        console.error(err);
        alert(err?.message || "Failed to save signatory configuration to database.");
      }
    } else {
      toast.success("Signatory settings applied to this survey draft!");
    }
  };

  // Save survey to database
  const handleSaveSurvey = async () => {
    if (!title.trim()) {
      alert("Please provide a survey title.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedSchema: SurveySchema = {
        ...schema,
        settings: {
          ...schema.settings,
          signatories: signatory.signatories || schema.settings?.signatories,
          signatoryName: signatory.signatoryName,
          signatoryTitle: signatory.signatoryTitle,
          signatoryOrganization: signatory.signatoryOrganization,
          signatorySignatureUrl: signatory.signatorySignatureUrl,
          secondarySignatoryName: signatory.secondarySignatoryName || schema.settings?.secondarySignatoryName,
          secondarySignatoryTitle: signatory.secondarySignatoryTitle || schema.settings?.secondarySignatoryTitle,
          secondarySignatoryOrganization: signatory.secondarySignatoryOrganization || schema.settings?.secondarySignatoryOrganization,
          secondarySignatorySignatureUrl: signatory.secondarySignatorySignatureUrl || schema.settings?.secondarySignatorySignatureUrl,
          capstoneLogoUrl: signatory.capstoneLogoUrl || schema.settings?.capstoneLogoUrl,
          certificateThemeColor: signatory.certificateThemeColor || schema.settings?.certificateThemeColor,
        },
      };

      if (surveyId) {
        // Updating an existing survey
        const updated = await surveyService.updateSurvey(surveyId, {
          title,
          description,
          instructions,
          schema: updatedSchema,
          signatory_name: signatory.signatoryName,
          signatory_title: signatory.signatoryTitle,
          signatory_organization: signatory.signatoryOrganization,
          signatory_signature_url: signatory.signatorySignatureUrl,
        });

        toast.success("Survey schema & questions updated successfully!");
        if (onSaveSuccess && updated) {
          onSaveSuccess(updated);
        }
      } else {
        // Creating a new survey
        const created = await surveyService.createSurvey({
          title,
          description,
          instructions,
          schema: updatedSchema,
          signatory_name: signatory.signatoryName,
          signatory_title: signatory.signatoryTitle,
          signatory_organization: signatory.signatoryOrganization,
          signatory_signature_url: signatory.signatorySignatureUrl,
        });

        toast.success("New survey published successfully!");
        router.push(`/surveys/${created.id}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to save survey.");
    } finally {
      setIsSaving(false);
    }
  };

  const allRequired = schema.questions.every((q) => q.required);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner & Batch Controls */}
      <Card className="relative bg-card/60 border-border shadow-lg rounded-none">
        <DecorIcon position="top-right" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 rounded-none font-mono text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PDF Parsed
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {schema.questions.length} Questions / Matrices
                </span>
              </div>
              <h2 className="text-xl font-bold font-heading text-foreground mt-1">
                Customize Survey Form & Field Requirements
              </h2>
              <p className="text-xs text-muted-foreground">
                Review the extracted questions. You can toggle optional/required fields (such as making Name optional)
                before publishing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving} className="rounded-none">
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={handleSaveSurvey} disabled={isSaving} className="rounded-none gap-2">
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Publishing..." : "Generate & Publish Survey Link"}</span>
              </Button>
            </div>
          </div>

          {/* Master Required / Optional Switch */}
          <div className="flex items-center justify-between p-4 rounded-none bg-secondary/30 border border-border/60">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 font-mono">
                <Settings2 className="w-4 h-4 text-primary" />
                Field Requirement Configuration
              </Label>
              <p className="text-xs text-muted-foreground">
                Set all fields as required or optional in a single click, or customize each individually.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={allRequired ? "default" : "outline"}
                size="xs"
                onClick={() => handleToggleAllRequired(true)}
                className="rounded-none font-mono"
              >
                Require All
              </Button>
              <Button
                variant={!allRequired ? "secondary" : "outline"}
                size="xs"
                onClick={() => handleToggleAllRequired(false)}
                className="rounded-none font-mono"
              >
                Make All Optional
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Survey Title & Instructions */}
      <Card className="relative bg-card/60 border-border rounded-none">
        <DecorIcon position="top-left" />
        <CardHeader>
          <CardTitle className="text-base font-semibold">Survey Header Information</CardTitle>
          <CardDescription className="text-xs">Title, overview, and directions displayed to respondents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Survey Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Capstone Evaluation Form"
              className="text-base font-semibold rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Description / Purpose</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the survey objective..."
              className="rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Instructions / Directions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Instructions on how to answer..."
              className="rounded-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Official Signatory Configuration for Recognition Certificates */}
      <SignatorySettingsCard
        initialData={signatory}
        onSave={handleSaveSignatoryFromBuilder}
      />

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold font-heading text-foreground uppercase tracking-wider font-mono">
            Survey Questions & Scales
          </h3>
          <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-1.5 rounded-none">
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </Button>
        </div>

        {schema.questions.map((question, index) => {
          const isNameField = question.id.toLowerCase().includes("name");

          return (
            <Card
              key={question.id}
              className={`relative bg-card/70 border-border transition-all rounded-none ${
                isNameField ? "ring-1 ring-primary/40 bg-primary/5" : ""
              }`}
            >
              <DecorIcon position="top-right" className="opacity-30" />
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-none bg-secondary border border-border flex items-center justify-center text-xs font-mono font-semibold">
                      {index + 1}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase rounded-none">
                      {question.type.replace("_", " ")}
                    </Badge>
                    {isNameField && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary rounded-none">
                        Demographic Field
                      </Badge>
                    )}
                  </div>

                  {/* Required / Optional Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`req-${question.id}`}
                        checked={question.required}
                        onCheckedChange={(checked) => handleToggleQuestionRequired(question.id, checked)}
                      />
                      <Label htmlFor={`req-${question.id}`} className="text-xs font-mono font-medium cursor-pointer">
                        {question.required ? (
                          <span className="text-primary font-bold">REQUIRED</span>
                        ) : (
                          <span className="text-muted-foreground">OPTIONAL</span>
                        )}
                      </Label>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Question Title</Label>
                    <Input
                      value={question.title}
                      onChange={(e) => handleUpdateQuestion(question.id, { title: e.target.value })}
                      className="rounded-none"
                    />
                  </div>

                  {question.description && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Description / Hint</Label>
                      <Input
                        value={question.description}
                        onChange={(e) => handleUpdateQuestion(question.id, { description: e.target.value })}
                        className="text-xs text-muted-foreground rounded-none"
                      />
                    </div>
                  )}

                  {/* Likert Matrix Items - Fully Editable */}
                  {question.type === "likert_matrix" && question.matrixRows && (
                    <div className="mt-2 rounded-none border border-border/60 bg-secondary/30 p-3 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span className="font-semibold text-foreground">
                          Likert Matrix Items ({question.matrixRows.length})
                        </span>
                        <span>Scale: 1 ({question.scale?.labels?.[1] || "Strongly Disagree"}) to 5 ({question.scale?.labels?.[5] || "Strongly Agree"})</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {question.matrixRows.map((row) => (
                          <div
                            key={row.id}
                            className="p-2.5 rounded-none bg-background/70 border border-border/60 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-16 shrink-0">
                                <Label className="text-[10px] font-mono text-muted-foreground">CODE</Label>
                                <Input
                                  value={row.code || ""}
                                  onChange={(e) =>
                                    handleUpdateMatrixRow(question.id, row.id, "code", e.target.value)
                                  }
                                  placeholder="e.g. 7.6"
                                  className="h-7 text-xs font-mono font-bold rounded-none"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-[10px] font-mono text-muted-foreground">CRITERION LABEL</Label>
                                <Input
                                  value={row.label}
                                  onChange={(e) =>
                                    handleUpdateMatrixRow(question.id, row.id, "label", e.target.value)
                                  }
                                  placeholder="e.g. As a whole / Modularity"
                                  className="h-7 text-xs font-semibold rounded-none"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] font-mono text-muted-foreground">QUESTION STATEMENT / DESCRIPTION</Label>
                              <Input
                                value={row.description || ""}
                                onChange={(e) =>
                                  handleUpdateMatrixRow(question.id, row.id, "description", e.target.value)
                                }
                                placeholder="Enter specific description evaluated by respondent..."
                                className="h-7 text-xs text-muted-foreground rounded-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single / Multiple Choice Options Preview */}
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 rounded-none border border-border/60 bg-secondary/30 p-3 space-y-2">
                      <span className="text-xs text-muted-foreground font-mono">Choices / Options:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {question.options.map((opt, i) => (
                          <Badge key={i} variant="secondary" className="text-xs rounded-none">
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-none bg-card/95 backdrop-blur-md border border-border shadow-2xl">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            Form ready with {schema.questions.length} components.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving} className="rounded-none">
              Cancel
            </Button>
          )}
          <Button size="default" onClick={handleSaveSurvey} disabled={isSaving} className="rounded-none gap-2">
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Generate Public Link"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
