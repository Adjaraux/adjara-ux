import { NextRequest, NextResponse } from 'next/server';
// import { generateCertificatePdf } from '@/lib/pdf-generator';

export async function GET(req: NextRequest) {
    return NextResponse.json({ error: "PDF generation is moved to client-side." }, { status: 410 });
}

export async function POST(req: NextRequest) {
    return NextResponse.json({ error: "PDF generation is moved to client-side." }, { status: 410 });
}
