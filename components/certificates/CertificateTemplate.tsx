import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Fonts (using standard fonts for now, but ready for custom)
// Font.register({ family: 'Inter', src: '...' });

// Register Fonts (using standard fonts for now, but ready for custom)
// Font.register({ family: 'Inter', src: '...' });

interface CertificateSettings {
    title: string;
    subtitle: string;
    primaryColor: string;
    secondaryColor: string;
    signatureName: string;
    signatureRole: string;
    logoText: string;
    showLogo: boolean;
    showSignature: boolean;
}

const createStyles = (settings: CertificateSettings) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    border: {
        border: `4px solid ${settings.secondaryColor}`, // Dynamic Secondary
        height: '100%',
        padding: 20,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 60,
    },
    logo: {
        width: 120,
        height: 40,
        backgroundColor: '#f1f5f9', // Placeholder grey
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 10,
        color: '#64748b',
    },
    title: {
        fontSize: 24,
        textTransform: 'uppercase',
        letterSpacing: 4,
        color: settings.secondaryColor, // Dynamic Secondary
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 60,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    body: {
        alignItems: 'center',
    },
    recipient: {
        fontSize: 32,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 20,
        textAlign: 'center',
    },
    text: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 1.5,
        marginBottom: 40,
    },
    courseTitle: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: settings.primaryColor, // Dynamic Primary
        marginBottom: 10,
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTop: '1px solid #e2e8f0',
        paddingTop: 20,
    },
    signatureBlock: {
        alignItems: 'center',
    },
    signatureLine: {
        width: 150,
        borderBottom: '1px solid #94a3b8',
        marginBottom: 5,
    },
    signatureText: {
        fontSize: 10,
        color: '#64748b',
    },
    meta: {
        fontSize: 8,
        color: '#cbd5e1',
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    qrPlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#f1f5f9',
        border: '1px solid #e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    grade: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 5,
    }
});

interface CertificateData {
    studentName: string;
    courseName: string;
    issuedAt: string;
    certificateId: string;
    finalGrade: string; // e.g. "16.5/20"
    instructorName?: string;
}

export const CertificateTemplate = ({ data, settings }: { data: CertificateData, settings?: CertificateSettings }) => {
    // Default settings if undefined (fallback)
    const activeSettings: CertificateSettings = settings || {
        title: "Certificat de Réussite",
        subtitle: "Décerné officiellement à",
        primaryColor: "#4f46e5",
        secondaryColor: "#1e293b",
        signatureName: "Jean Formateur",
        signatureRole: "Responsable Pédagogique",
        logoText: "LOGO ÉCOLE",
        showLogo: true,
        showSignature: true
    };

    const styles = createStyles(activeSettings);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.border}>
                    {/* Header with Logo */}
                    <View style={styles.header}>
                        {activeSettings.showLogo && (
                            <View style={styles.logo}>
                                {/* Placeholder for Logo Image */}
                                <Text style={styles.logoText}>{activeSettings.logoText}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={{ fontSize: 10, color: '#94a3b8' }}>ACADEMY OF EXCELLENCE</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{activeSettings.title}</Text>
                    <Text style={styles.subtitle}>{activeSettings.subtitle}</Text>

                    {/* Recipient */}
                    <View style={styles.body}>
                        <Text style={styles.recipient}>{data.studentName}</Text>

                        <Text style={styles.text}>
                            Pour avoir complété avec succès et satisfait aux exigences d'évaluation du cursus
                        </Text>

                        <Text style={styles.courseTitle}>{data.courseName}</Text>

                        <Text style={styles.grade}>
                            Mention obtenue avec une note finale de {data.finalGrade}
                        </Text>
                    </View>

                    {/* Footer / Signatures */}
                    <View style={styles.footer}>
                        <View style={styles.signatureBlock}>
                            <Text style={[styles.signatureText, { marginBottom: 15, fontFamily: 'Helvetica-Oblique' }]}>{data.issuedAt}</Text>
                            <View style={styles.qrPlaceholder}>
                                <Text style={{ fontSize: 6 }}>QR CODE</Text>
                            </View>
                            <Text style={[styles.meta, { position: 'relative', bottom: -5, right: 0 }]}>ID: {data.certificateId}</Text>
                        </View>

                        {activeSettings.showSignature && (
                            <View style={styles.signatureBlock}>
                                {/* Placeholder for Signature Image */}
                                <View style={{ height: 40, justifyContent: 'flex-end', width: 100, alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Helvetica-Oblique', fontSize: 12, color: '#1e293b' }}>
                                        {activeSettings.signatureName}
                                    </Text>
                                </View>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureText}>{activeSettings.signatureRole}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};
