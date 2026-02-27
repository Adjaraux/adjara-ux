import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptPDF } from '@/components/pdf/receipt-pdf';
import React from 'react';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const logPath = path.join(process.cwd(), 'receipt-debug.log');
    const log = (msg: string) => fs.appendFileSync(logPath, `[TEST][${new Date().toISOString()}] ${msg}\n`);

    try {
        log("Test generation started");
        const receiptData = {
            id: 'test-123',
            date: new Date().toISOString(),
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            amount: 5000,
            currency: 'XOF',
            provider: 'test',
            type: 'mission' as const,
            projectName: 'Test Project',
            description: 'Test Description'
        };

        const stream = await renderToStream(<ReceiptPDF data={receiptData} />);

        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="test_receipt.pdf"`,
            },
        });
    } catch (e: any) {
        log(`FATAL ERROR: ${e.message}\nStack: ${e.stack}`);
        return new NextResponse(JSON.stringify({ error: String(e) }), { status: 500 });
    }
}
