// LEAGCY SERVER-SIDE GENERATOR - DISABLED FOR CLIENT-SIDE STRATEGY
// import { renderToStream } from '@react-pdf/renderer';
// import { createElement } from 'react';
// import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';

// type CertificateData = {
//     studentName: string;
//     courseName: string;
//     issuedAt: string;
//     certificateId: string;
//     finalGrade: string;
//     instructorName?: string;
// };

export async function generateCertificatePdf(data: any): Promise<Buffer> {
    throw new Error("Server-side PDF generation is disabled in favor of Client-Side generation.");
}
