export type QuestionType =
  | "likert_matrix"
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "textarea"
  | "number"
  | "rating"
  | "select"
  | "signature";

export interface LikertScaleItem {
  value: number;
  label: string;
}

export interface LikertMatrixRow {
  id: string; // e.g. "1.1", "1.2"
  code?: string; // e.g. "1.1"
  label: string; // "Functional completeness"
  description?: string; // "The device provides the functions needed..."
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  sectionId?: string;
  options?: string[]; // for single_choice, multiple_choice, select
  scale?: {
    min: number;
    max: number;
    step?: number;
    labels?: Record<string | number, string>;
  };
  matrixRows?: LikertMatrixRow[]; // for likert_matrix
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  part?: string; // e.g. "PART 1: ISO/IEC 25010:2011"
  order: number;
}

export interface SurveySignatory {
  id: string;
  name: string;
  title: string;
  organization: string;
  signatureUrl?: string;
}

export interface SurveySettings {
  requireAll: boolean;
  allowAnonymous: boolean;
  showProgressBar: boolean;
  confirmationMessage?: string;
  submitButtonText?: string;
  theme?: "efferd-dark" | "efferd-light" | "system";
  // Signatory & Certificate Settings
  enableCertificate?: boolean;
  signatories?: SurveySignatory[];
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryOrganization?: string;
  signatorySignatureUrl?: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  secondarySignatoryOrganization?: string;
  secondarySignatorySignatureUrl?: string;
  capstoneLogoUrl?: string;
  certificateThemeColor?: string;
}

export interface SurveySchema {
  sections: SurveySection[];
  questions: SurveyQuestion[];
  settings: SurveySettings;
}

export interface Survey {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  schema: SurveySchema;
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
  response_count?: number;
  signatories?: SurveySignatory[] | null;
  signatory_name?: string | null;
  signatory_title?: string | null;
  signatory_organization?: string | null;
  signatory_signature_url?: string | null;
  secondary_signatory_name?: string | null;
  secondary_signatory_title?: string | null;
  secondary_signatory_organization?: string | null;
  secondary_signatory_signature_url?: string | null;
  capstone_logo_url?: string | null;
  certificate_theme_color?: string | null;
}

export type SurveyAnswerValue = string | number | string[] | Record<string, number>;

export interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_name: string | null;
  respondent_role: string | null;
  answers: Record<string, SurveyAnswerValue>; // questionId -> answer
  completion_status: "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

export interface LikertDimensionScore {
  sectionId: string;
  sectionTitle: string;
  averageScore: number;
  itemCount: number;
  totalResponses: number;
  items: {
    id: string;
    code?: string;
    label: string;
    description?: string;
    meanScore: number;
    distribution: Record<number, number>; // rating -> count
  }[];
}

export interface SurveyAnalytics {
  totalResponses: number;
  completionRate: number;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
  roleBreakdown: Record<string, number>;
  dimensionScores: LikertDimensionScore[];
  overallMeanScore: number;
  questionStats: Record<
    string,
    {
      questionTitle: string;
      type: QuestionType;
      answeredCount: number;
      meanScore?: number;
      optionCounts?: Record<string, number>;
      recentTextAnswers?: string[];
    }
  >;
}

