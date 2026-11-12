import { NextRequest, NextResponse } from "next/server";
import { surveyService } from "@/features/surveys/services/surveyService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const survey = await surveyService.getSurveyById(id);
    if (!survey) {
      return NextResponse.json({ error: "Survey not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: survey });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch survey." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await surveyService.updateSurvey(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update survey." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await surveyService.deleteSurvey(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete survey." }, { status: 500 });
  }
}

