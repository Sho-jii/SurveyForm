import { NextRequest, NextResponse } from "next/server";
import { parseSurveyFromText } from "@/features/surveys/services/pdfParserService";
import { getDocumentProxy, extractText } from "unpdf";
import { createServerSupabaseClient } from "@/services/supabase/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user authentication before processing the upload
    let isAuthenticated = false;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        isAuthenticated = true;
      } else {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const {
            data: { user: tokenUser },
          } = await supabase.auth.getUser(token);
          if (tokenUser) isAuthenticated = true;
        }
      }
    } catch (authErr) {
      console.warn("[PDF Parse Auth Warning]", authErr);
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error:
            "Authentication required. Please sign in with your Google account before uploading or parsing survey documents.",
        },
        { status: 401 }
      );
    }

    // 2. Validate file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    // 3. Extract text cleanly with unpdf (No worker threads or external .mjs worker dependencies)
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const { totalPages, text: fullText } = await extractText(pdf, { mergePages: true });

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from this PDF. Please ensure the document contains selectable text and is not a flattened image scan.",
        },
        { status: 422 }
      );
    }

    const parsed = parseSurveyFromText(fullText, file.name);

    return NextResponse.json({
      success: true,
      data: parsed,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        numPages: totalPages,
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
