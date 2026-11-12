import { SurveySchema, SurveyQuestion, SurveySection } from "../types";

/**
 * Intelligent survey questionnaire extractor from raw PDF text
 */
export function parseSurveyFromText(rawText: string, fileName?: string): {
  title: string;
  description: string;
  instructions: string;
  schema: SurveySchema;
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = "Survey Questionnaire";
  let description = "";
  let instructions = "";

  // Title extraction: check first few lines
  if (lines.length > 0) {
    if (lines[0].toLowerCase().includes("form") || lines[0].toLowerCase().includes("evaluation") || lines[0].toLowerCase().includes("survey")) {
      title = lines[0];
      if (lines.length > 1 && !lines[1].toLowerCase().startsWith("name:") && !lines[1].toLowerCase().startsWith("direction")) {
        title += ` - ${lines[1]}`;
      }
    } else if (fileName) {
      title = fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    }
  }

  // Detect scale instructions (e.g. 5: Strongly Agree, 4: Agree, etc.)
  const scaleLabels: Record<number, string> = {};
  let isLikertPresent = false;

  const scaleRegex = /^(\d)\s+([A-Za-z\s]+)$/;
  for (const line of lines) {
    const match = line.match(scaleRegex);
    if (match) {
      const val = parseInt(match[1], 10);
      const desc = match[2].trim();
      if (val >= 1 && val <= 7 && desc.length > 2) {
        scaleLabels[val] = desc;
        isLikertPresent = true;
      }
    }
    if (line.toLowerCase().startsWith("direction:") || line.toLowerCase().startsWith("instructions:")) {
      instructions = line;
    }
  }

  // Fallback standard Likert scale if none found but Likert matrix exists
  if (Object.keys(scaleLabels).length === 0) {
    scaleLabels[5] = "Strongly Agree";
    scaleLabels[4] = "Agree";
    scaleLabels[3] = "Moderately Agree";
    scaleLabels[2] = "Disagree";
    scaleLabels[1] = "Strongly Disagree";
  }

  const sections: SurveySection[] = [];
  const questions: SurveyQuestion[] = [];

  // 1. Check for Demographic questions at top
  // Name
  const hasName = lines.some((l) => l.trim().toLowerCase().match(/^name\s*[:_]/));
  if (hasName) {
    questions.push({
      id: "demographic_name",
      type: "text",
      title: "Full Name",
      description: "Enter your full name to receive your verified Certificate of Recognition upon submission.",
      required: true,
      placeholder: "e.g. Engr. Jarib M. Sioco / Juan Dela Cruz",
    });
  }

  // Roles/Classifications (e.g., Community/Fisherman Client IT Expert Others)
  const roleLine = lines.find(
    (l) =>
      l.includes("Community/Fisherman") ||
      l.includes("Community /Fisherman") ||
      l.includes("IT Expert") ||
      (l.includes("Client") && l.includes("Others"))
  );
  if (roleLine) {
    const defaultRoles = ["Community/Fisherman", "Client", "IT Expert", "Others"];
    questions.push({
      id: "demographic_role",
      type: "single_choice",
      title: "Respondent Classification / Stakeholder Role",
      description: "Please select your primary role or stakeholder group.",
      required: true,
      options: defaultRoles,
    });
  }

  // 2. Parse Likert Sections & Subsections or standard questions
  // Look for sections like "IoT DEVICE AND SYSTEM QUALITY EVALUATION (ISO/IEC 25010:2011)"
  // and "Unified Theory of Acceptance and Use of Technology (UTAUT)"
  let currentMajorPart = "";
  let currentSectionTitle = "";
  let currentSectionId = "";
  let currentMatrixRows: { id: string; code?: string; label: string; description?: string }[] = [];

  const flushMatrixQuestion = () => {
    if (currentMatrixRows.length > 0 && currentSectionId) {
      questions.push({
        id: `matrix_${currentSectionId}`,
        sectionId: currentSectionId,
        type: "likert_matrix",
        title: currentSectionTitle,
        description: `Please rate each item on a scale from 1 (${scaleLabels[1] || "Strongly Disagree"}) to 5 (${scaleLabels[5] || "Strongly Agree"}).`,
        required: true,
        scale: {
          min: 1,
          max: 5,
          labels: scaleLabels,
        },
        matrixRows: [...currentMatrixRows],
      });
      currentMatrixRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Major parts: ISO 25010 or UTAUT
    if (line.includes("ISO/IEC 25010") || line.toUpperCase().includes("SYSTEM QUALITY EVALUATION")) {
      currentMajorPart = "ISO/IEC 25010:2011 - System Quality Evaluation";
      continue;
    }
    if (line.includes("UTAUT") || line.toUpperCase().includes("UNIFIED THEORY OF ACCEPTANCE")) {
      flushMatrixQuestion();
      currentMajorPart = "UTAUT - Technology Acceptance & Adoption";
      continue;
    }

    // Detect Section Header, e.g. "1. FUNCTIONAL SUITABILITY", "2. RELIABILITY", etc.
    const sectionMatch = line.match(/^(\d+)\.\s+([A-Z\s]{4,})/);
    if (sectionMatch && !line.includes("Strongly")) {
      flushMatrixQuestion();
      const secNum = sectionMatch[1];
      const secName = sectionMatch[2].trim();
      currentSectionId = `${currentMajorPart.includes("UTAUT") ? "utaut" : "iso"}_sec_${secNum}`;
      currentSectionTitle = `${sectionMatch[0].trim()}`;

      sections.push({
        id: currentSectionId,
        title: currentSectionTitle,
        part: currentMajorPart || "General Survey",
        order: sections.length + 1,
      });
      continue;
    }

    // Detect Sub-question Likert item, e.g. "1.1 Functional completeness. The device provides..."
    const itemMatch = line.match(/^(\d+\.\d+)(?:\s+(.*))?$/);
    if (itemMatch && currentSectionId) {
      const code = itemMatch[1];
      let rawRest = (itemMatch[2] || "").trim();

      // If code was standalone on its own line, grab the next line
      if (
        !rawRest &&
        i + 1 < lines.length &&
        !lines[i + 1].match(/^(\d+\.\d+|\d+\.\s+[A-Z]|UTAUT|Comments|SIGNATURE)/i)
      ) {
        rawRest = lines[++i];
      }

      let label = "";
      let desc = "";

      if (rawRest.toLowerCase().startsWith("as a whol")) {
        label = "As a whole";
        desc = rawRest.replace(/^as a whol(?:e)?(?:,)?\s*/i, "").replace(/^e,?\s*/i, "");
      } else if (rawRest.toLowerCase().startsWith("co - existence") || rawRest.toLowerCase().startsWith("co-existence")) {
        label = "Co-existence";
        desc = rawRest.replace(/^co\s*-\s*existence\.\s*/i, "");
      } else if (rawRest.includes(".")) {
        const dotIdx = rawRest.indexOf(".");
        label = rawRest.slice(0, dotIdx).trim();
        desc = rawRest.slice(dotIdx + 1).trim();
      } else {
        label = rawRest.trim() || `Item ${code}`;
        desc = "";
      }

      // Lookahead next lines if continuation
      let j = i + 1;
      while (
        j < lines.length &&
        !lines[j].match(/^(\d+\.\d+)/) &&
        !lines[j].match(/^(\d+)\.\s+[A-Z]/) &&
        !lines[j].includes("UTAUT") &&
        !lines[j].toLowerCase().startsWith("comments") &&
        !lines[j].toUpperCase().startsWith("SIGNATURE")
      ) {
        if (!lines[j].match(/^\d\s+[A-Z]/) && !lines[j].match(/^(\d+)\.\s+/)) {
          desc += (desc ? " " : "") + lines[j].trim();
        }
        j++;
      }
      i = j - 1;

      // Clean up description if trailing section names got included
      desc = desc.replace(/\s*\d+\.\s+[A-Z\s]{4,}$/g, "").trim();

      currentMatrixRows.push({
        id: `${currentSectionId}_${code.replace(".", "_")}`,
        code: code,
        label: label,
        description: desc,
      });
      continue;
    }

    // Detect Comments or Suggestions textarea
    if (line.toLowerCase().startsWith("comments") || line.toLowerCase().includes("suggestion")) {
      flushMatrixQuestion();
      questions.push({
        id: "comments_suggestions",
        type: "textarea",
        title: "Comments & Suggestions",
        description: "Please share any additional observations, feedback, or recommendations.",
        required: false,
        placeholder: "Write your feedback or remarks here...",
      });
    }

    // Detect Signature field
    if (line.toUpperCase().includes("SIGNATURE")) {
      flushMatrixQuestion();
      questions.push({
        id: "signature_confirmation",
        type: "signature",
        title: "Participant Confirmation / Digital Signature",
        description: "By typing your full name or signing, you acknowledge your evaluation.",
        required: false,
        placeholder: "Type your name or draw signature to confirm",
      });
    }
  }

  flushMatrixQuestion();

  // If no matrix items were parsed, fallback to generic survey parsing
  if (questions.length === 0) {
    // Treat non-empty lines with question marks or numbers as generic questions
    let qCounter = 1;
    for (const line of lines) {
      if (line.includes("?") || line.match(/^\d+[\.\)]/)) {
        questions.push({
          id: `question_${qCounter}`,
          type: "text",
          title: line.replace(/^\d+[\.\)]\s*/, ""),
          required: true,
        });
        qCounter++;
      }
    }
  }

  return {
    title: title || "Evaluation Survey Form",
    description: description || "Please complete all evaluation fields below.",
    instructions: instructions || "Respond to each statement according to the provided scale.",
    schema: {
      sections,
      questions,
      settings: {
        requireAll: false,
        allowAnonymous: true,
        showProgressBar: true,
        confirmationMessage: "Thank you! Your survey responses have been submitted successfully.",
        submitButtonText: "Submit Survey Evaluation",
      },
    },
  };
}

