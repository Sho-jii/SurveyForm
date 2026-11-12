import { NextRequest, NextResponse } from "next/server";
import { surveyService } from "@/features/surveys/services/surveyService";

export async function GET() {
  try {
    const surveys = await surveyService.getAllSurveys();
    return NextResponse.json({ success: true, data: surveys });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch surveys." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await surveyService.createSurvey(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create survey." }, { status: 500 });
  }
}

