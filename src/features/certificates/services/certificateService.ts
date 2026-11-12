import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { createClient } from "@/services/supabase/client";
import { SurveySignatory } from "@/features/surveys/types";
import {
  JARIB_SIGNATURE_BASE64,
  RECOGNIZED_BY_NAME,
  RECOGNIZED_BY_TITLE,
} from "../jaribSignatureBase64";

export interface CertificateTheme {
  id: string;
  name: string;
  primary: string; // Hex color for CSS
  secondary: string;
  accentLight: string;
  textAccent: string;
  badgeBg: string;
  rgb: [number, number, number]; // RGB tuple for jsPDF
}

export const CERTIFICATE_THEMES: Record<string, CertificateTheme> = {
  gold: {
    id: "gold",
    name: "Classic Amber Gold",
    primary: "#d97706",
    secondary: "#b45309",
    accentLight: "#fef3c7",
    textAccent: "#b45309",
    badgeBg: "#78350f",
    rgb: [217, 119, 6],
  },
  emerald: {
    id: "emerald",
    name: "Aquaculture Emerald",
    primary: "#059669",
    secondary: "#047857",
    accentLight: "#d1fae5",
    textAccent: "#047857",
    badgeBg: "#064e3b",
    rgb: [5, 150, 105],
  },
  blue: {
    id: "blue",
    name: "Cyber Ocean Blue",
    primary: "#0284c7",
    secondary: "#0369a1",
    accentLight: "#e0f2fe",
    textAccent: "#0284c7",
    badgeBg: "#0c4a6e",
    rgb: [2, 132, 199],
  },
  purple: {
    id: "purple",
    name: "Royal Academic Purple",
    primary: "#7c3aed",
    secondary: "#6d28d9",
    accentLight: "#ede9fe",
    textAccent: "#6d28d9",
    badgeBg: "#4c1d95",
    rgb: [124, 58, 237],
  },
  rose: {
    id: "rose",
    name: "Crimson Honor Red",
    primary: "#e11d48",
    secondary: "#be123c",
    accentLight: "#ffe4e6",
    textAccent: "#be123c",
    badgeBg: "#881337",
    rgb: [225, 29, 72],
  },
  slate: {
    id: "slate",
    name: "Obsidian Monochrome",
    primary: "#334155",
    secondary: "#1e293b",
    accentLight: "#f1f5f9",
    textAccent: "#0f172a",
    badgeBg: "#0f172a",
    rgb: [51, 65, 85],
  },
};

export interface SurveyCertificate {
  id?: string;
  certificate_code: string;
  response_id: string;
  survey_id: string;
  recipient_name: string;
  recipient_role?: string | null;
  survey_title: string;
  issued_at: string;
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
  metadata?: {
    respondent_signature?: string | null;
    completion_time?: string | null;
    score?: number | null;
    signatories?: SurveySignatory[] | null;
  };
}

// In-memory store fallback if Supabase is offline
const inMemoryCertificates: Record<string, SurveyCertificate> = {};

async function resolveImageToBase64(urlOrBase64?: string | null): Promise<string | null> {
  if (!urlOrBase64) return null;
  if (urlOrBase64.startsWith("data:image")) return urlOrBase64;
  try {
    const res = await fetch(urlOrBase64);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Could not fetch remote image:", e);
    return null;
  }
}

export const certificateService = {
  generateCode(): string {
    const timePart = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CERT-${timePart}-${randPart}`;
  },

  async generateQrCodeDataUrl(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch (e) {
      console.error("QR Code generation error:", e);
      return "";
    }
  },

  async issueCertificate(cert: Omit<SurveyCertificate, "id">): Promise<SurveyCertificate> {
    inMemoryCertificates[cert.certificate_code] = { ...cert, id: cert.certificate_code };

    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("survey_certificates")
          .insert({
            certificate_code: cert.certificate_code,
            response_id: cert.response_id,
            survey_id: cert.survey_id,
            recipient_name: cert.recipient_name,
            recipient_role: cert.recipient_role || null,
            survey_title: cert.survey_title,
            issued_at: cert.issued_at,
            signatory_name: cert.signatory_name || null,
            signatory_title: cert.signatory_title || null,
            signatory_organization: cert.signatory_organization || null,
            signatory_signature_url: cert.signatory_signature_url || null,
            metadata: {
              ...(cert.metadata || {}),
              signatories: cert.signatories,
              secondary_signatory_name: cert.secondary_signatory_name,
              secondary_signatory_title: cert.secondary_signatory_title,
              secondary_signatory_organization: cert.secondary_signatory_organization,
              secondary_signatory_signature_url: cert.secondary_signatory_signature_url,
              capstone_logo_url: cert.capstone_logo_url,
              certificate_theme_color: cert.certificate_theme_color,
            },
          })
          .select()
          .single();

        if (error) {
          console.warn("Could not insert certificate into Supabase (table may need migration):", error.message);
        } else if (data) {
          inMemoryCertificates[cert.certificate_code] = {
            ...data,
            signatories: cert.signatories,
            secondary_signatory_name: cert.secondary_signatory_name,
            secondary_signatory_title: cert.secondary_signatory_title,
            secondary_signatory_organization: cert.secondary_signatory_organization,
            secondary_signatory_signature_url: cert.secondary_signatory_signature_url,
            capstone_logo_url: cert.capstone_logo_url,
            certificate_theme_color: cert.certificate_theme_color,
          };
          return inMemoryCertificates[cert.certificate_code];
        }

        // Also update survey_responses certificate_code
        await supabase
          .from("survey_responses")
          .update({ certificate_code: cert.certificate_code })
          .eq("id", cert.response_id);
      } catch (e) {
        console.warn("Supabase issueCertificate error, using memory fallback:", e);
      }
    }

    return inMemoryCertificates[cert.certificate_code];
  },

  async getCertificateByCode(code: string): Promise<SurveyCertificate | null> {
    if (inMemoryCertificates[code]) {
      return inMemoryCertificates[code];
    }

    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("survey_certificates")
          .select("*")
          .eq("certificate_code", code)
          .single();

        if (data && !error) {
          const meta = (data.metadata || {}) as any;
          const merged: SurveyCertificate = {
            ...data,
            signatories: meta.signatories || null,
            secondary_signatory_name: meta.secondary_signatory_name || null,
            secondary_signatory_title: meta.secondary_signatory_title || null,
            secondary_signatory_organization: meta.secondary_signatory_organization || null,
            secondary_signatory_signature_url: meta.secondary_signatory_signature_url || null,
            capstone_logo_url: meta.capstone_logo_url || null,
            certificate_theme_color: meta.certificate_theme_color || null,
          };
          inMemoryCertificates[code] = merged;
          return merged;
        }

        // Check if code matches a response ID or certificate_code on response
        const { data: resp } = await supabase
          .from("survey_responses")
          .select("*, surveys(*)")
          .or(`certificate_code.eq.${code},id.eq.${code}`)
          .single();

        if (resp) {
          const s = resp.surveys as any;
          const fallbackCert: SurveyCertificate = {
            id: resp.id,
            certificate_code: resp.certificate_code || code,
            response_id: resp.id,
            survey_id: resp.survey_id,
            recipient_name: resp.respondent_name || "Valued Research Participant",
            recipient_role: resp.respondent_role,
            survey_title: s?.title || "Evaluation Questionnaire",
            issued_at: resp.created_at,
            signatories: s?.schema?.settings?.signatories || s?.signatories || null,
            signatory_name: s?.signatory_name || s?.schema?.settings?.signatoryName || null,
            signatory_title: s?.signatory_title || s?.schema?.settings?.signatoryTitle || null,
            signatory_organization: s?.signatory_organization || s?.schema?.settings?.signatoryOrganization || null,
            signatory_signature_url: s?.signatory_signature_url || s?.schema?.settings?.signatorySignatureUrl || null,
            secondary_signatory_name: s?.secondary_signatory_name || s?.schema?.settings?.secondarySignatoryName || null,
            secondary_signatory_title: s?.secondary_signatory_title || s?.schema?.settings?.secondarySignatoryTitle || null,
            secondary_signatory_organization: s?.secondary_signatory_organization || s?.schema?.settings?.secondarySignatoryOrganization || null,
            secondary_signatory_signature_url: s?.secondary_signatory_signature_url || s?.schema?.settings?.secondarySignatorySignatureUrl || null,
            capstone_logo_url: s?.capstone_logo_url || s?.schema?.settings?.capstoneLogoUrl || null,
            certificate_theme_color: s?.certificate_theme_color || s?.schema?.settings?.certificateThemeColor || "gold",
          };
          return fallbackCert;
        }
      } catch (e) {
        console.warn("Supabase getCertificateByCode error:", e);
      }
    }

    return null;
  },

  async downloadCertificatePdf(
    cert: SurveyCertificate,
    verificationBaseUrl?: string
  ): Promise<void> {
    const origin =
      verificationBaseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3020");
    const verificationUrl = `${origin}/verify/${cert.certificate_code}`;

    // Always use current date
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Resolve color theme
    const themeKey = cert.certificate_theme_color || "gold";
    const theme = CERTIFICATE_THEMES[themeKey] || CERTIFICATE_THEMES.gold;

    // Generate QR Code
    const qrDataUrl = await this.generateQrCodeDataUrl(verificationUrl);

    // Create Landscape A4 PDF: 297mm width x 210mm height
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // 1. Clean Crisp Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // 2. Double Classic Certificate Border
    // Outer Border
    doc.setDrawColor(24, 24, 27);
    doc.setLineWidth(1.4);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner Accent Border in Theme Color
    doc.setDrawColor(theme.rgb[0], theme.rgb[1], theme.rgb[2]);
    doc.setLineWidth(0.6);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Corner decorative squares
    const sq = 3;
    doc.setFillColor(theme.rgb[0], theme.rgb[1], theme.rgb[2]);
    doc.rect(12, 12, sq, sq, "F");
    doc.rect(pageWidth - 12 - sq, 12, sq, sq, "F");
    doc.rect(12, pageHeight - 12 - sq, sq, sq, "F");
    doc.rect(pageWidth - 12 - sq, pageHeight - 12 - sq, sq, sq, "F");

    // 3. Top Capstone Logo (Centered)
    const capstoneLogo = await resolveImageToBase64(
      cert.capstone_logo_url || "/icons/HITOVIS_LOGO.png"
    );
    if (capstoneLogo) {
      try {
        doc.addImage(capstoneLogo, "PNG", pageWidth / 2 - 9, 16, 18, 18);
      } catch (e) {
        console.warn("Could not embed capstone logo:", e);
      }
    }

    // 4. Institution Header
    const orgTitle = (
      cert.signatory_organization || "HITOVIS RESEARCH & EVALUATION PLATFORM"
    ).toUpperCase();
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(orgTitle, pageWidth / 2, 38, { align: "center" });

    // 5. Certificate Main Title
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.setTextColor(theme.rgb[0], theme.rgb[1], theme.rgb[2]);
    doc.text("CERTIFICATE OF APPRECIATION", pageWidth / 2, 47, { align: "center" });

    // Decorative underline rule with diamond center
    doc.setDrawColor(theme.rgb[0], theme.rgb[1], theme.rgb[2]);
    doc.setLineWidth(0.6);
    doc.line(pageWidth / 2 - 40, 50.5, pageWidth / 2 - 3, 50.5);
    doc.line(pageWidth / 2 + 3, 50.5, pageWidth / 2 + 40, 50.5);
    doc.rect(pageWidth / 2 - 1.2, 49.3, 2.4, 2.4, "F");

    // 6. Presentation Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    doc.text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", pageWidth / 2, 59, { align: "center" });

    // 7. Recipient Name (Dignified Serif)
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.setTextColor(15, 15, 15);
    const recipientText = (cert.recipient_name || "Valued Research Participant").toUpperCase();
    doc.text(recipientText, pageWidth / 2, 70, { align: "center" });

    // Evaluator Role (if provided)
    if (cert.recipient_role) {
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 70);
      doc.text(`[ EVALUATOR GROUP: ${cert.recipient_role.toUpperCase()} ]`, pageWidth / 2, 77, {
        align: "center",
      });
    }

    // 8. Body Citation
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(
      "in grateful recognition and appreciation for actively completing the comprehensive survey evaluation",
      pageWidth / 2,
      86,
      { align: "center" }
    );
    doc.text(
      "and contributing rigorous expert assessment for the research capstone project:",
      pageWidth / 2,
      91,
      { align: "center" }
    );

    // Survey / Capstone Title
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(10, 10, 10);
    const splitTitle = doc.splitTextToSize(`"${cert.survey_title}"`, 220);
    doc.text(splitTitle, pageWidth / 2, 99, { align: "center" });

    // Standards benchmark
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "Evaluated in accordance with ISO/IEC 25010 Software Quality Standards and UTAUT Technology Acceptance Framework.",
      pageWidth / 2,
      112,
      { align: "center" }
    );

    // 9. QR Code Verification Badge (Centered)
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 9, 118, 18, 18);
    }
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `OFFICIAL VERIFIED CREDENTIAL: ${cert.certificate_code}  ·  DATE ISSUED: ${dateStr.toUpperCase()}`,
      pageWidth / 2,
      140,
      { align: "center" }
    );

    // 10. Dynamic Signatories Row (1, 2, 3, or more members)
    let sigList: SurveySignatory[] = [];
    if (cert.signatories && cert.signatories.length > 0) {
      sigList = cert.signatories;
    } else if (cert.metadata?.signatories && cert.metadata.signatories.length > 0) {
      sigList = cert.metadata.signatories;
    } else {
      sigList = [
        {
          id: "sig-1",
          name: cert.signatory_name || RECOGNIZED_BY_NAME,
          title: cert.signatory_title || RECOGNIZED_BY_TITLE,
          organization: cert.signatory_organization || "Mindoro State University",
          signatureUrl: cert.signatory_signature_url || JARIB_SIGNATURE_BASE64,
        },
      ];
      if (cert.secondary_signatory_name) {
        sigList.push({
          id: "sig-2",
          name: cert.secondary_signatory_name,
          title: cert.secondary_signatory_title || "Co-Researcher & Project Lead",
          organization: cert.secondary_signatory_organization || "Mindoro State University",
          signatureUrl: cert.secondary_signatory_signature_url || undefined,
        });
      }
    }

    const n = sigList.length;
    const sigY = 154;

    // Distribute X coordinates evenly across page
    for (let i = 0; i < n; i++) {
      const sig = sigList[i];
      let posX = pageWidth / 2;

      if (n === 2) {
        posX = i === 0 ? 80 : pageWidth - 80;
      } else if (n === 3) {
        if (i === 0) posX = 55;
        else if (i === 1) posX = pageWidth / 2;
        else posX = pageWidth - 55;
      } else if (n >= 4) {
        const startX = 40;
        const endX = pageWidth - 40;
        posX = startX + (i * (endX - startX)) / (n - 1);
      }

      // Add signature image if available
      const resolvedSig = await resolveImageToBase64(sig.signatureUrl);
      if (resolvedSig) {
        try {
          doc.addImage(resolvedSig, "PNG", posX - 20, sigY - 14, 40, 16);
        } catch (e) {
          console.warn("Could not embed signature:", e);
        }
      } else {
        // Italic script text placeholder
        doc.setFont("times", "italic");
        doc.setFontSize(13);
        doc.setTextColor(60, 60, 60);
        doc.text(sig.name, posX, sigY - 2, { align: "center" });
      }

      // Solid underline rule
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.6);
      doc.line(posX - 24, sigY + 4, posX + 24, sigY + 4);

      // Printed Name (Bold)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 15, 15);
      doc.text(sig.name.toUpperCase(), posX, sigY + 9, { align: "center" });

      // Title
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(75, 75, 75);
      doc.text(sig.title, posX, sigY + 13.5, { align: "center" });

      // Organization
      doc.setFont("courier", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text(sig.organization, posX, sigY + 17.5, { align: "center" });
    }

    // Save PDF
    const cleanFileName = `Certificate-${cert.certificate_code}.pdf`;
    doc.save(cleanFileName);
  },
};
