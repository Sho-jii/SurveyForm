import { Survey, SurveyResponse } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "sonner";

// Exact coordinate map of all 62 items on the official HITOVIS Survey-Questionnaire-HITOVIS.pdf
// (Coordinates verified against template text bounding boxes)
const ITEM_LOCATIONS: Record<string, { page: number; y: number }> = {
  // Page 1: ISO 25010
  "1.1": { page: 0, y: 446.6 },
  "1.2": { page: 0, y: 412.1 },
  "1.3": { page: 0, y: 388.9 },
  "1.4": { page: 0, y: 354.6 },
  "2.1": { page: 0, y: 290.0 },
  "2.2": { page: 0, y: 266.8 },
  "2.3": { page: 0, y: 243.7 },
  "2.4": { page: 0, y: 209.2 },
  "2.5": { page: 0, y: 174.7 },
  "3.1": { page: 0, y: 122.0 },
  "3.2": { page: 0, y: 98.8 },
  // Page 2: ISO 25010
  "3.3": { page: 1, y: 733.6 },
  "3.4": { page: 1, y: 699.1 },
  "4.1": { page: 1, y: 647.6 },
  "4.2": { page: 1, y: 624.5 },
  "4.3": { page: 1, y: 601.3 },
  "4.4": { page: 1, y: 578.2 },
  "4.5": { page: 1, y: 543.7 },
  "4.6": { page: 1, y: 520.5 },
  "4.7": { page: 1, y: 497.4 },
  "5.1": { page: 1, y: 454.6 },
  "5.2": { page: 1, y: 431.4 },
  "5.3": { page: 1, y: 408.3 },
  "5.4": { page: 1, y: 373.9 },
  "5.5": { page: 1, y: 350.6 },
  "5.6": { page: 1, y: 327.6 },
  "6.1": { page: 1, y: 271.7 },
  "6.2": { page: 1, y: 237.2 },
  "6.3": { page: 1, y: 202.7 },
  "7.1": { page: 1, y: 144.9 },
  "7.2": { page: 1, y: 110.4 },
  // Page 3: ISO 25010 & UTAUT
  "7.3": { page: 2, y: 733.6 },
  "7.4": { page: 2, y: 710.4 },
  "7.5": { page: 2, y: 675.9 },
  "7.6": { page: 2, y: 641.4 },
  "8.1": { page: 2, y: 588.5 },
  "8.2": { page: 2, y: 554.1 },
  "8.3": { page: 2, y: 519.6 },
  "8.4": { page: 2, y: 485.1 },
  "utaut_1.1": { page: 2, y: 388.4 },
  "utaut_1.2": { page: 2, y: 365.3 },
  "utaut_1.3": { page: 2, y: 342.1 },
  "utaut_1.4": { page: 2, y: 318.9 },
  "utaut_1.5": { page: 2, y: 295.8 },
  "utaut_2.1": { page: 2, y: 254.0 },
  "utaut_2.2": { page: 2, y: 242.1 },
  "utaut_2.3": { page: 2, y: 219.0 },
  "utaut_2.4": { page: 2, y: 195.8 },
  "utaut_2.5": { page: 2, y: 172.7 },
  "utaut_3.1": { page: 2, y: 131.3 },
  "utaut_3.2": { page: 2, y: 108.1 },
  // Page 4: UTAUT
  "utaut_3.3": { page: 3, y: 733.6 },
  "utaut_3.4": { page: 3, y: 710.4 },
  "utaut_4.1": { page: 3, y: 670.3 },
  "utaut_4.2": { page: 3, y: 635.8 },
  "utaut_4.3": { page: 3, y: 612.6 },
  "utaut_4.4": { page: 3, y: 589.5 },
  "utaut_4.5": { page: 3, y: 566.3 },
  "utaut_5.1": { page: 3, y: 523.6 },
  "utaut_5.2": { page: 3, y: 500.4 },
  "utaut_5.3": { page: 3, y: 477.3 },
  "utaut_5.4": { page: 3, y: 454.1 },
};

const RATING_COLS: Record<number, number> = {
  5: 456,
  4: 480,
  3: 504,
  2: 528,
  1: 552,
};

function base64ToUint8Array(base64: string): Uint8Array {
  const raw = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Ensures white strokes drawn on canvas in dark mode are converted to crisp dark ink
 * before embedding onto white paper.
 */
async function ensureDarkSignature(base64DataUrl: string): Promise<string> {
  if (typeof window === "undefined" || !base64DataUrl || !base64DataUrl.startsWith("data:image")) {
    return base64DataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(base64DataUrl);
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        let hasConverted = false;
        for (let i = 0; i < d.length; i += 4) {
          const alpha = d[i + 3];
          if (alpha > 15) {
            // If stroke was drawn in light/white (e.g. from dark mode)
            if (d[i] > 140 && d[i + 1] > 140 && d[i + 2] > 140) {
              d[i] = 10;
              d[i + 1] = 15;
              d[i + 2] = 20;
              hasConverted = true;
            }
          }
        }
        if (hasConverted) {
          ctx.putImageData(imgData, 0, 0);
          return resolve(canvas.toDataURL("image/png"));
        }
      } catch (e) {
        console.warn("ensureDarkSignature error:", e);
      }
      resolve(base64DataUrl);
    };
    img.onerror = () => resolve(base64DataUrl);
    img.src = base64DataUrl;
  });
}

function drawCheckmark(page: any, cx: number, cy: number) {
  // Vector checkmark (resolution-independent, no font encoding errors)
  page.drawLine({
    start: { x: cx - 4, y: cy },
    end: { x: cx - 1, y: cy - 4 },
    thickness: 1.4,
    color: rgb(0.05, 0.1, 0.18),
  });
  page.drawLine({
    start: { x: cx - 1, y: cy - 4 },
    end: { x: cx + 5, y: cy + 4.5 },
    thickness: 1.4,
    color: rgb(0.05, 0.1, 0.18),
  });
}

function wrapTextToLines(text: string, maxCharsPerLine: number[]): string[] {
  const words = text.trim().split(/\s+/);
  const result: string[] = [];
  let currentLine = "";
  let lineIdx = 0;

  for (const word of words) {
    const maxChars = maxCharsPerLine[lineIdx] || 85;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        result.push(currentLine);
        lineIdx++;
      }
      currentLine = word;
      if (lineIdx >= maxCharsPerLine.length) break;
    }
  }
  if (currentLine && lineIdx < maxCharsPerLine.length) {
    result.push(currentLine);
  }
  return result;
}

export const exportService = {
  /**
   * Export responses to CSV with Excel compatibility
   */
  exportToCsv(survey: Survey, responses: SurveyResponse[]): void {
    if (!survey || responses.length === 0) {
      alert("No responses available to export.");
      return;
    }

    const headers = ["Submission ID", "Date Submitted", "Respondent Name", "Role", "Status"];
    const colKeys: { key: string; label: string }[] = [];

    survey.schema.questions.forEach((q) => {
      if (q.type === "likert_matrix" && q.matrixRows) {
        q.matrixRows.forEach((row) => {
          const colLabel = `${row.code || ""} ${row.label}`.trim();
          headers.push(`[${q.title}] ${colLabel}`);
          colKeys.push({ key: row.id, label: colLabel });
        });
      } else {
        headers.push(q.title);
        colKeys.push({ key: q.id, label: q.title });
      }
    });

    const rows = responses.map((r) => {
      const rowData = [
        r.id,
        new Date(r.created_at).toLocaleString(),
        r.respondent_name || "Anonymous",
        r.respondent_role || "Not specified",
        r.completion_status,
      ];

      colKeys.forEach((col) => {
        let val = r.answers?.[col.key];
        if (typeof val === "object" && val !== null) {
          val = JSON.stringify(val);
        }
        rowData.push(val !== undefined && val !== null ? String(val) : "");
      });

      return rowData.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = "\uFEFF" + [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey.slug}-responses-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export complete survey & responses as JSON
   */
  exportToJson(survey: Survey, responses: SurveyResponse[]): void {
    const data = {
      survey: {
        id: survey.id,
        title: survey.title,
        slug: survey.slug,
        description: survey.description,
        schema: survey.schema,
      },
      exportTimestamp: new Date().toISOString(),
      totalResponses: responses.length,
      responses,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey.slug}-export-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export exact replica of the uploaded Survey Questionnaire PDF
   * (US Letter format: 612 x 792 pt, original fonts, tables, checkboxes, comments, and signature)
   *
   * @param survey The survey definition
   * @param response Optional individual response to fill into the questionnaire
   */
  async exportExactSurveyPdf(survey: Survey, response?: SurveyResponse): Promise<void> {
    const toastId = toast.loading("Preparing exact questionnaire PDF...", { id: "export-pdf" });

    try {
      // 1. Fetch original uploaded PDF template
      const res = await fetch("/templates/Survey-Questionnaire-HITOVIS.pdf");
      if (!res.ok) {
        throw new Error(`Failed to load template PDF (${res.status})`);
      }
      const templateBytes = await res.arrayBuffer();

      // 2. Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();

      if (pages.length < 4) {
        throw new Error(`Invalid template page count: ${pages.length}`);
      }

      // If no response provided, download clean blank questionnaire template
      if (!response) {
        const cleanBytes = await pdfDoc.save();
        const blob = new Blob([cleanBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${survey.slug}-questionnaire-form.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Original blank questionnaire downloaded!", { id: toastId });
        return;
      }

      // Embed fonts
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const answers = response.answers || {};

      // --- PAGE 1: NAME & ROLE ---
      const page1 = pages[0];
      const rawName =
        response.respondent_name ||
        answers.demographic_name ||
        answers.respondent_name ||
        answers.participant_name ||
        "";
      const respondentName = String(rawName).trim();

      if (respondentName) {
        page1.drawText(respondentName, {
          x: 115,
          y: 673.4,
          size: 10,
          font: fontBold,
          color: rgb(0.05, 0.05, 0.05),
        });
      }

      // Stakeholder Role Checkbox (y = 653.2)
      const rawRole = response.respondent_role || answers.demographic_role || "";
      const role = String(rawRole).toLowerCase();
      if (role.includes("community") || role.includes("fisherman")) {
        drawCheckmark(page1, 114, 655);
      } else if (role.includes("client")) {
        drawCheckmark(page1, 264, 655);
      } else if (role.includes("it") || role.includes("expert")) {
        drawCheckmark(page1, 350, 655);
      } else if (role.length > 0) {
        drawCheckmark(page1, 440, 655);
      }

      // --- PAGES 1 TO 4: OVERLAY 62 LIKERT ITEMS ---
      // Build a comprehensive answer map across all key conventions
      const resolvedRatings: Record<string, number> = {};

      // 1. Direct item location keys (e.g. "1.1", "utaut_1.1")
      for (const [key, val] of Object.entries(answers)) {
        const numVal = Number(val);
        if (numVal >= 1 && numVal <= 5) {
          resolvedRatings[key] = numVal;
        }
      }

      // 2. Map survey questions matrixRows (e.g. row.id = "iso_sec_1_1_1", row.code = "1.1")
      survey.schema.questions.forEach((q) => {
        if (q.type === "likert_matrix" && q.matrixRows) {
          const isUtaut = q.id.toLowerCase().includes("utaut") || q.title.toUpperCase().includes("UTAUT");
          q.matrixRows.forEach((row) => {
            const raw = answers[row.id] ?? (row.code ? answers[row.code] : undefined);
            const num = Number(raw);
            if (num >= 1 && num <= 5 && row.code) {
              const targetKey = isUtaut ? `utaut_${row.code}` : row.code;
              resolvedRatings[targetKey] = num;
            }
          });
        }
      });

      // Draw checkmarks for each item on its designated page & column
      for (const [itemKey, loc] of Object.entries(ITEM_LOCATIONS)) {
        const rating = resolvedRatings[itemKey];
        if (rating && RATING_COLS[rating]) {
          const page = pages[loc.page];
          const cx = RATING_COLS[rating];
          drawCheckmark(page, cx, loc.y + 2);
        }
      }

      // --- PAGE 4: COMMENTS / SUGGESTIONS & SIGNATURE ---
      const page4 = pages[3];

      // Comments
      const commentVal =
        (answers.comments_suggestions && String(answers.comments_suggestions)) ||
        (answers.comment && String(answers.comment)) ||
        (answers.comments && String(answers.comments)) ||
        "";

      if (commentVal && commentVal.trim()) {
        const lines = wrapTextToLines(commentVal, [58, 85, 85, 85]);
        const yPositions = [407, 383, 359, 335];
        const xPositions = [185, 75, 75, 75];

        lines.forEach((lineText, idx) => {
          if (idx < yPositions.length) {
            page4.drawText(lineText, {
              x: xPositions[idx],
              y: yPositions[idx],
              size: 9,
              font: fontItalic,
              color: rgb(0.08, 0.08, 0.08),
            });
          }
        });
      }

      // Participant Signature
      const rawSig =
        answers.signature_confirmation ||
        answers.respondent_signature ||
        answers.signature ||
        answers.signature_data;

      if (rawSig && typeof rawSig === "string") {
        if (rawSig.startsWith("data:image")) {
          try {
            // Convert white dark-mode canvas strokes to solid dark ink
            const darkSigDataUrl = await ensureDarkSignature(rawSig);
            const sigBytes = base64ToUint8Array(darkSigDataUrl);

            let embeddedSig: any = null;
            if (darkSigDataUrl.includes("image/jpeg") || darkSigDataUrl.includes("image/jpg")) {
              embeddedSig = await pdfDoc.embedJpg(sigBytes);
            } else {
              embeddedSig = await pdfDoc.embedPng(sigBytes);
            }

            if (embeddedSig) {
              // Signature line is at x=222.1, y=253.1
              page4.drawImage(embeddedSig, {
                x: 230,
                y: 254,
                width: 110,
                height: 42,
              });
            }
          } catch (e) {
            console.warn("Could not embed canvas signature:", e);
          }
        } else if (rawSig.trim().length > 0) {
          // Typed signature confirmation
          page4.drawText(rawSig.trim(), {
            x: 240,
            y: 260,
            size: 13,
            font: fontItalic,
            color: rgb(0.05, 0.1, 0.2),
          });
        }
      }

      // 3. Save & download
      const filledBytes = await pdfDoc.save();
      const blob = new Blob([filledBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = String(respondentName || response.id.slice(0, 8)).replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${survey.slug}-evaluation-${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exact evaluation PDF downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.warn("Template overlay error, running high-fidelity jsPDF fallback:", err);
      // Fallback to jsPDF if template fetch is blocked
      this.generateJsPdfFallback(survey, response);
      toast.success("Evaluation PDF exported via fallback generator", { id: toastId });
    }
  },

  /**
   * High-fidelity fallback questionnaire generator using jsPDF
   */
  generateJsPdfFallback(survey: Survey, response?: SurveyResponse): void {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = 612;
    const pageHeight = 792;
    const marginX = 50;
    const tableWidth = 512;

    // PAGE 1: TITLE & HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 15, 15);
    doc.text("CAPSTONE EVALUATION FORM", pageWidth / 2, 52, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const titleText = survey.title || "HITOVIS: A Smart IoT - Based Catfish Aquaculture Management System";
    doc.text(titleText, pageWidth / 2, 70, { align: "center" });

    // Name Line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const respondentName = response?.respondent_name ? `  ${response.respondent_name}` : "____________________________________________________";
    doc.text(`Name :  ${respondentName}`, marginX, 96);

    // Stakeholder Roles with Checkboxes
    const role = (response?.respondent_role || "").toLowerCase();
    const isComm = role.includes("community") || role.includes("fisherman");
    const isClient = role.includes("client");
    const isIT = role.includes("it") || role.includes("expert");
    const isOther = !isComm && !isClient && !isIT && role.length > 0;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `[${isComm ? "X" : " "}] Community /Fisherman     [${isClient ? "X" : " "}] Client     [${isIT ? "X" : " "}] IT Expert     [${isOther ? "X" : " "}] Others`,
      marginX,
      116
    );

    // Direction text
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    doc.text(
      "Direction:  Respond to the following statement; the number of your responses corresponds using the scale below.",
      marginX,
      136,
      { maxWidth: tableWidth }
    );

    // Scale Legend Table
    autoTable(doc, {
      startY: 152,
      margin: { left: marginX, right: marginX },
      tableWidth: 320,
      head: [["Numerical Value", "Verbal Description"]],
      body: [
        ["5", "Strongly Agree"],
        ["4", "Agree"],
        ["3", "Moderately Agree"],
        ["2", "Disagree"],
        ["1", "Strongly Disagree"],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        halign: "left",
      },
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 100, halign: "center" },
        1: { cellWidth: 220 },
      },
    });

    let currentY = (doc as any).lastAutoTable?.finalY + 16 || 250;

    const likertQuestions = survey.schema.questions.filter((q) => q.type === "likert_matrix" && q.matrixRows);
    const answers = response?.answers || {};
    let currentPart = "";

    likertQuestions.forEach((q) => {
      const partName = q.id.includes("utaut")
        ? "Unified Theory of Acceptance and Use of Technology (UTAUT)"
        : "IoT DEVICE AND SYSTEM QUALITY EVALUATION (ISO/IEC 25010:2011)";

      if (partName !== currentPart) {
        currentPart = partName;
        if (currentY > pageHeight - 100) {
          doc.addPage();
          currentY = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(0, 0, 0);
        doc.text(partName, marginX, currentY);
        currentY += 8;
      }

      const tableHead = [
        [
          {
            content: q.title.toUpperCase(),
            styles: { fontStyle: "bold" as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] },
          },
          { content: "5", styles: { halign: "center" as const, fontStyle: "bold" as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
          { content: "4", styles: { halign: "center" as const, fontStyle: "bold" as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
          { content: "3", styles: { halign: "center" as const, fontStyle: "bold" as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
          { content: "2", styles: { halign: "center" as const, fontStyle: "bold" as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
          { content: "1", styles: { halign: "center" as const, fontStyle: "bold" as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } },
        ],
      ];

      const tableBody = (q.matrixRows || []).map((row) => {
        const itemText = `${row.code ? row.code + "  " : ""}${row.label ? row.label + ".  " : ""}${row.description || ""}`.trim();
        const selectedRating = answers[row.id] ?? (row.code ? answers[row.code] : undefined);

        return [
          itemText,
          Number(selectedRating) === 5 ? "X" : "",
          Number(selectedRating) === 4 ? "X" : "",
          Number(selectedRating) === 3 ? "X" : "",
          Number(selectedRating) === 2 ? "X" : "",
          Number(selectedRating) === 1 ? "X" : "",
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: marginX, right: marginX },
        tableWidth: tableWidth,
        head: tableHead as any,
        body: tableBody,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 382 },
          1: { cellWidth: 26, halign: "center", fontStyle: "bold" },
          2: { cellWidth: 26, halign: "center", fontStyle: "bold" },
          3: { cellWidth: 26, halign: "center", fontStyle: "bold" },
          4: { cellWidth: 26, halign: "center", fontStyle: "bold" },
          5: { cellWidth: 26, halign: "center", fontStyle: "bold" },
        },
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;
    });

    // COMMENTS / SUGGESTIONS & SIGNATURE
    if (currentY > pageHeight - 120) {
      doc.addPage();
      currentY = 50;
    }

    const commentVal = answers.comments_suggestions || answers.comments || answers.comment || "";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text("Comments/Suggestion:__________________________________________________", marginX, currentY);

    if (commentVal) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      const splitComment = doc.splitTextToSize(String(commentVal), tableWidth);
      doc.text(splitComment, marginX, currentY + 14);
      currentY += splitComment.length * 12 + 10;
    } else {
      doc.text("______________________________________________________________________", marginX, currentY + 16);
      doc.text("______________________________________________________________________", marginX, currentY + 32);
      currentY += 46;
    }

    currentY += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("SIGNATURE", marginX, currentY);

    const respondentSignature = answers.respondent_signature || answers.signature_confirmation;
    if (typeof respondentSignature === "string" && respondentSignature.startsWith("data:image")) {
      try {
        doc.addImage(respondentSignature, "PNG", marginX + 10, currentY + 4, 120, 36);
        currentY += 38;
      } catch (e) {
        console.warn("Could not embed participant signature:", e);
      }
    }

    doc.setFont("helvetica", "normal");
    doc.text("____________________________", marginX, currentY + 16);

    const totalPages = (doc as any).internal?.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : (doc as any).getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 24, { align: "right" });
      doc.text(`HITOVIS Questionnaire Form — ${survey.title}`, marginX, pageHeight - 24);
    }

    const filename = response
      ? `${survey.slug}-evaluation-${(response.respondent_name || response.id.slice(0, 8)).replace(/\s+/g, "_")}.pdf`
      : `${survey.slug}-questionnaire-form.pdf`;

    doc.save(filename);
  },

  /**
   * Export formal PDF Evaluation Report
   */
  exportToPdfReport(survey: Survey, responses: SurveyResponse[]): void {
    this.exportExactSurveyPdf(survey);
  },
};
