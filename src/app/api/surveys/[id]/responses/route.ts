import { NextRequest, NextResponse } from "next/server";
import { surveyService } from "@/features/surveys/services/surveyService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const responses = await surveyService.getSurveyResponses(id);
    return NextResponse.json({ success: true, data: responses });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch responses." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const created = await surveyService.submitResponse(id, body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to submit response." }, { status: 500 });
  }
}

