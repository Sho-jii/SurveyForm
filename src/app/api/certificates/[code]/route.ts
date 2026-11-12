import { NextRequest, NextResponse } from "next/server";
import { certificateService } from "@/features/certificates/services/certificateService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: "Certificate code is required." }, { status: 400 });
    }

    const cert = await certificateService.getCertificateByCode(code);
    if (!cert) {
      return NextResponse.json(
        { verified: false, error: "Certificate not found or invalid verification code." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verified: true,
      data: cert,
    });
  } catch (error: any) {
    console.error("[Certificate API Error]", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

