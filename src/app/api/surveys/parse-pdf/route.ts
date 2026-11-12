import { NextRequest, NextResponse } from "next/server";
import { parseSurveyFromText } from "@/features/surveys/services/pdfParserService";
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import of pdfjs-dist legacy build
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Configure workerSrc to absolute file URL so Node.js loads it without relative chunk errors
    try {
      let workerPath: string | null = null;
      try {
        workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
      } catch {
        const localPath = path.resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
        if (fs.existsSync(localPath)) {
          workerPath = localPath;
        }
      }

      if (workerPath) {
        pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
      }
    } catch (e) {
      console.warn("[PDF Worker Setup Warning]", e);
    }

    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    let fullText = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let lastY: number | undefined;
      let pageText = "";

      for (const item of content.items as any[]) {
        if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith("\n") && !pageText.endsWith(" ")) {
          pageText += " ";
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
      fullText += pageText + "\n\n";
    }

    const parsed = parseSurveyFromText(fullText, file.name);

    return NextResponse.json({
      success: true,
      data: parsed,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        numPages: doc.numPages,
      },
    });
  } catch (error: any) {
    console.error("[PDF Parse Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse PDF document." },
      { status: 500 }
    );
  }
}
