import { SurveySignatory } from "@/features/surveys/types";
import {
  JARIB_SIGNATURE_BASE64,
  RECOGNIZED_BY_NAME,
  RECOGNIZED_BY_TITLE,
} from "../jaribSignatureBase64";

export interface CertificateRenderOptions {
  recipientName: string;
  recipientRole?: string | null;
  surveyTitle: string;
  certificateCode: string;
  issuedAt?: string;
  capstoneLogoUrl?: string | null;
  capstoneOrgName?: string | null;
  signatories?: SurveySignatory[] | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  signatoryOrganization?: string | null;
  signatorySignatureUrl?: string | null;
  secondarySignatoryName?: string | null;
  secondarySignatoryTitle?: string | null;
  secondarySignatoryOrganization?: string | null;
  secondarySignatorySignatureUrl?: string | null;
  qrDataUrl?: string | null;
  themeColor?: string;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Automatically crops away empty transparent margins around signature ink
 * so the signature renders large, crisp, and prominent across the signature line.
 */
function trimSignature(
  image: HTMLImageElement
): { source: CanvasImageSource; width: number; height: number } {
  try {
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d");
    if (!ctx) return { source: image, width: image.width, height: image.height };

    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const data = imgData.data;

    let minX = c.width;
    let minY = c.height;
    let maxX = 0;
    let maxY = 0;
    let hasInk = false;

    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const alpha = data[(y * c.width + x) * 4 + 3];
        if (alpha > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasInk = true;
        }
      }
    }

    if (!hasInk || (minX === 0 && minY === 0 && maxX === c.width && maxY === c.height)) {
      return { source: image, width: image.width, height: image.height };
    }

    // Add subtle 8px padding around ink
    minX = Math.max(0, minX - 8);
    minY = Math.max(0, minY - 8);
    maxX = Math.min(c.width, maxX + 8);
    maxY = Math.min(c.height, maxY + 8);

    const trimmedW = maxX - minX;
    const trimmedH = maxY - minY;

    if (trimmedW <= 0 || trimmedH <= 0) {
      return { source: image, width: image.width, height: image.height };
    }

    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = trimmedW;
    trimmedCanvas.height = trimmedH;
    const trimmedCtx = trimmedCanvas.getContext("2d");
    if (!trimmedCtx) return { source: image, width: image.width, height: image.height };

    trimmedCtx.drawImage(
      c,
      minX,
      minY,
      trimmedW,
      trimmedH,
      0,
      0,
      trimmedW,
      trimmedH
    );

    return { source: trimmedCanvas, width: trimmedW, height: trimmedH };
  } catch (e) {
    console.warn("Signature trimming fallback:", e);
    return { source: image, width: image.width, height: image.height };
  }
}

function cleanInstitution(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/mindoro\s+state\s+university/gi, "")
    .replace(/minsu/gi, "")
    .replace(/academic\s+research/gi, "")
    .trim();
}

function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
): number {
  let curX = x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, curX, y);
    curX += ctx.measureText(ch).width + (i < text.length - 1 ? spacing : 0);
  }
  return curX;
}

function drawCenteredTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number
) {
  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    totalWidth += ctx.measureText(text[i]).width + (i < text.length - 1 ? spacing : 0);
  }
  const startX = centerX - totalWidth / 2;
  drawTextWithSpacing(ctx, text, startX, y, spacing);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawGeometricLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const r = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy + r * 0.8);
  ctx.lineTo(cx - r, cy + r * 0.8);
  ctx.closePath();
  ctx.stroke();

  // Inner lines
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.4);
  ctx.lineTo(cx + r * 0.5, cy + r * 0.5);
  ctx.lineTo(cx - r * 0.5, cy + r * 0.5);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders the exact certificate design from the target specification:
 * - Top charcoal header bar (#2E3236) with CERTIFICATE OF APPRECIATION — and surveyor logo
 * - Clean white body with huge bold uppercase recipient name
 * - Academic ISO/IEC 25010 & UTAUT research evaluation citation
 * - Date and verification QR code in bottom-left
 * - NO circular stamp in the bottom middle (explicitly removed)
 * - Large, prominent handwritten digital signature ink resting on the horizontal line
 * - Mindoro State University removed completely across all sections
 */
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  options: CertificateRenderOptions
): Promise<string> {
  const width = 2400;
  const height = 1700;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  // 1. Crisp White Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Outer Hairline Border
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // 3. Top Dark Charcoal Banner (#2E3236 / #343A40)
  const headerHeight = 360;
  ctx.fillStyle = "#2E3236";
  ctx.fillRect(24, 24, width - 48, headerHeight);

  // 3a. Header Left Side: CERTIFICATE
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 88px 'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  drawTextWithSpacing(ctx, "CERTIFICATE", 120, 195, 12);

  // 3b. Header Subline: OF APPRECIATION —
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "600 30px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  const subline = "OF APPRECIATION";
  const sublineWidth = drawTextWithSpacing(ctx, subline, 120, 255, 8);

  // Trailing horizontal line from text to right
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sublineWidth + 30, 244);
  ctx.lineTo(sublineWidth + 400, 244);
  ctx.stroke();

  // 3c. Header Right Side: "YOUR BRAND" / Capstone Logo Spot
  const brandCenterX = 2120;
  const brandCenterY = 160;
  const logoUrl = options.capstoneLogoUrl || "/icons/HITOVIS_LOGO.png";
  const logoImg = await loadImage(logoUrl);

  if (logoImg) {
    const maxLogoDim = 150;
    const aspect = logoImg.width / logoImg.height;
    let drawW = maxLogoDim;
    let drawH = maxLogoDim / aspect;
    if (drawH > maxLogoDim) {
      drawH = maxLogoDim;
      drawW = maxLogoDim * aspect;
    }
    ctx.drawImage(
      logoImg,
      brandCenterX - drawW / 2,
      brandCenterY - drawH / 2 - 10,
      drawW,
      drawH
    );
  } else {
    drawGeometricLogo(ctx, brandCenterX, brandCenterY - 10, 110);
  }

  // Brand Name under logo (Strip Mindoro State University completely)
  let brandTitle = cleanInstitution(options.capstoneOrgName);
  if (!brandTitle || brandTitle.toLowerCase().includes("university")) {
    brandTitle = "HITOVIS";
  }
  brandTitle = brandTitle.toUpperCase();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  drawCenteredTextWithSpacing(ctx, brandTitle, brandCenterX, 305, 5);

  // 4. Main White Body Content (Left Column)
  const leftColX = 120;
  const leftColMaxWidth = 1420;

  // 4a. "This is to certify that"
  ctx.fillStyle = "#4A5568";
  ctx.font = "italic 36px 'Georgia', serif";
  ctx.fillText("This is to certify that", leftColX, 480);

  // 4b. Recipient Name: "NAME SURNAME"
  const recipient = (options.recipientName || "Hugo Smith").trim().toUpperCase();
  ctx.fillStyle = "#111827";

  let nameFontSize = 94;
  ctx.font = `bold ${nameFontSize}px 'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  while (ctx.measureText(recipient).width > leftColMaxWidth && nameFontSize > 48) {
    nameFontSize -= 4;
    ctx.font = `bold ${nameFontSize}px 'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  }
  ctx.fillText(recipient, leftColX, 600);

  // 4c. Recipient Evaluator Role Badge (if provided)
  let nextY = 660;
  if (options.recipientRole) {
    const roleText = `EVALUATOR ROLE: ${options.recipientRole.toUpperCase()}`;
    ctx.font = "bold 20px 'Courier New', monospace";
    const roleWidth = ctx.measureText(roleText).width;
    const badgePaddingX = 18;
    const badgeHeight = 36;

    ctx.fillStyle = "#F1F5F9";
    ctx.fillRect(leftColX, nextY - 26, roleWidth + badgePaddingX * 2, badgeHeight);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftColX, nextY - 26, roleWidth + badgePaddingX * 2, badgeHeight);

    ctx.fillStyle = "#334155";
    ctx.fillText(roleText, leftColX + badgePaddingX, nextY - 2);
    nextY += 50;
  } else {
    nextY += 20;
  }

  // 4d. "Has successfully completed .."
  ctx.fillStyle = "#4A5568";
  ctx.font = "italic 32px 'Georgia', serif";
  ctx.fillText("Has successfully completed the evaluation for ..", leftColX, nextY + 30);
  nextY += 80;

  // 4e. Survey Title: "LOREM IPSUM DOLOR SIT AMET"
  const surveyTitle = (
    options.surveyTitle || "CAPSTONE EVALUATION FORM - HITOVIS AQUACULTURE SYSTEM"
  ).toUpperCase();
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 36px 'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const titleLines = wrapText(ctx, surveyTitle, leftColMaxWidth);
  for (const line of titleLines) {
    ctx.fillText(line, leftColX, nextY);
    nextY += 46;
  }
  nextY += 20;

  // 4f. Evaluation Citation Paragraph
  ctx.fillStyle = "#64748B";
  ctx.font = "24px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  const descParagraph =
    "In grateful recognition and appreciation for actively completing the comprehensive survey evaluation and contributing rigorous expert assessment for the research capstone project. Evaluated in accordance with ISO/IEC 25010:2011 Software Quality Requirements and UTAUT Technology Acceptance Criteria.";
  const descLines = wrapText(ctx, descParagraph, leftColMaxWidth);
  for (const line of descLines) {
    ctx.fillText(line, leftColX, nextY);
    nextY += 38;
  }

  // 5. Bottom-Left Verification Strip (Date & QR Code)
  const now = new Date();
  const dateFormatted =
    options.issuedAt ||
    `${String(now.getDate()).padStart(2, "0")} / ${String(now.getMonth() + 1).padStart(2, "0")} / ${now.getFullYear()}`;

  const bottomY = 1430;

  // 5a. Date display
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 26px 'Courier New', monospace";
  ctx.fillText(`DATE   ${dateFormatted}`, leftColX, bottomY);

  // 5b. QR Code & Verification ID
  const qrImg = options.qrDataUrl ? await loadImage(options.qrDataUrl) : null;
  const qrSize = 140;
  const qrX = leftColX;
  const qrY = bottomY + 25;

  if (qrImg) {
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
  }

  const metaTextX = qrImg ? qrX + qrSize + 25 : qrX;
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 16px 'Courier New', monospace";
  ctx.fillText("AUTHENTIC RESEARCH CREDENTIAL", metaTextX, qrY + 35);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.fillText(options.certificateCode, metaTextX, qrY + 75);

  ctx.fillStyle = "#64748B";
  ctx.font = "16px 'Courier New', monospace";
  ctx.fillText(`Scan QR code or visit /verify/${options.certificateCode}`, metaTextX, qrY + 115);

  // 6. BOTTOM-MIDDLE: Explicitly omitted as requested (no circular stamp).

  // 7. Right Column: Stack of Signatories
  let activeSignatories: SurveySignatory[] = [];
  if (options.signatories && options.signatories.length > 0) {
    activeSignatories = options.signatories;
  } else {
    activeSignatories = [
      {
        id: "sig-1",
        name: options.signatoryName || RECOGNIZED_BY_NAME,
        title: options.signatoryTitle || RECOGNIZED_BY_TITLE,
        organization: cleanInstitution(options.signatoryOrganization),
        signatureUrl: options.signatorySignatureUrl || JARIB_SIGNATURE_BASE64,
      },
    ];
    if (options.secondarySignatoryName) {
      activeSignatories.push({
        id: "sig-2",
        name: options.secondarySignatoryName,
        title: options.secondarySignatoryTitle || "Co-Researcher & Project Lead",
        organization: cleanInstitution(options.secondarySignatoryOrganization),
        signatureUrl: options.secondarySignatorySignatureUrl || undefined,
      });
    }
  }

  // Draw stacked signatories in right column
  const rightColCenterX = 1960;
  const sigLineWidth = 440;

  const count = activeSignatories.length;
  let slotYs: number[] = [];
  if (count === 1) {
    slotYs = [1050];
  } else if (count === 2) {
    slotYs = [880, 1320];
  } else {
    slotYs = [680, 1020, 1360];
  }

  for (let i = 0; i < Math.min(count, slotYs.length); i++) {
    const sig = activeSignatories[i];
    const slotY = slotYs[i];

    // Digital Signature Ink (Large and Prominent)
    if (sig.signatureUrl) {
      const sigImg = await loadImage(sig.signatureUrl);
      if (sigImg) {
        // Automatically crop transparent padding around signature ink
        const trimmed = trimSignature(sigImg);

        // Maximum signature dimensions spanning the line
        const maxSigW = 440;
        const maxSigH = 175;
        const sigAspect = trimmed.width / trimmed.height;
        let sW = maxSigW;
        let sH = maxSigW / sigAspect;
        if (sH > maxSigH) {
          sH = maxSigH;
          sW = maxSigH * sigAspect;
        }

        // Draw signature resting directly across the horizontal line
        ctx.drawImage(
          trimmed.source,
          rightColCenterX - sW / 2,
          slotY - sH + 16,
          sW,
          sH
        );
      }
    } else {
      // Elegant cursive signature script
      ctx.fillStyle = "#1E293B";
      ctx.font = "italic 56px 'Brush Script MT', 'Dancing Script', 'Caveat', 'Georgia', cursive";
      ctx.textAlign = "center";
      ctx.fillText(sig.name, rightColCenterX, slotY - 14);
      ctx.textAlign = "left";
    }

    // Horizontal signature line
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightColCenterX - sigLineWidth / 2, slotY);
    ctx.lineTo(rightColCenterX + sigLineWidth / 2, slotY);
    ctx.stroke();

    // Role in bold uppercase
    ctx.fillStyle = "#111827";
    ctx.font = "bold 24px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText((sig.title || "RESEARCHER").toUpperCase(), rightColCenterX, slotY + 36);

    // Signatory Name (Without Mindoro State University)
    ctx.fillStyle = "#4B5563";
    ctx.font = "italic 22px 'Georgia', serif";
    const cleanOrg = cleanInstitution(sig.organization);
    const subtitle = cleanOrg ? `${sig.name} · ${cleanOrg}` : sig.name;
    ctx.fillText(subtitle, rightColCenterX, slotY + 68);
    ctx.textAlign = "left";
  }

  return canvas.toDataURL("image/png");
}
