import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#334155' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    logo: { fontSize: 24, fontWeight: 'bold', color: '#4f46e5' },
    title: { fontSize: 32, marginBottom: 10, color: '#1e293b', fontWeight: 'bold' },
    section: { marginBottom: 20 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8 },
    label: { width: 120, color: '#64748b' },
    value: { flex: 1, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }
});

interface InvoiceProps {
    invoiceNumber: string;
    date: string;
    customerName: string;
    projectTitle: string;
    amount: number;
    currency: string;
    provider: string;
}

const InvoiceDocument = ({ invoiceNumber, date, customerName, projectTitle, amount, currency, provider }: InvoiceProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Brand Header */}
            <View style={{ marginBottom: 40 }}>
                <Text style={styles.logo}>ADJARA UX</Text>
                <Text style={{ color: '#64748b', marginTop: 4 }}>Agence Créative & Académie Digitale</Text>
            </View>

            <Text style={styles.title}>FACTURE / REÇU</Text>
            <View style={styles.section}>
                <View style={styles.row}><Text style={styles.label}>N° Facture :</Text><Text style={styles.value}>{invoiceNumber}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Date :</Text><Text style={styles.value}>{date}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Client :</Text><Text style={styles.value}>{customerName}</Text></View>
            </View>

            <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Détails de la commande</Text>
                <View style={styles.row}>
                    <Text style={{ flex: 2 }}>{projectTitle}</Text>
                    <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{amount.toLocaleString()} {currency}</Text>
                </View>
            </View>

            <View style={{ marginTop: 40, alignItems: 'flex-end' }}>
                <View style={{ width: 150 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text>Total HT</Text>
                        <Text>{amount.toLocaleString()} {currency}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#4f46e5', paddingTop: 5 }}>
                        <Text style={{ fontWeight: 'bold' }}>Total TTC</Text>
                        <Text style={{ fontWeight: 'bold', color: '#4f46e5' }}>{amount.toLocaleString()} {currency}</Text>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 40 }}>
                <Text style={{ color: '#64748b' }}>Payé via {provider.toUpperCase()}</Text>
                <Text style={{ color: '#64748b', marginTop: 4 }}>Merci de votre confiance.</Text>
            </View>

            <View style={styles.footer}>
                <Text>ADJARA UX - SIRET: [À Renseigner] - Lomé, Togo / Paris, France</Text>
                <Text>Contact: support@adjara-ux.com | www.adjara-ux.com</Text>
            </View>
        </Page>
    </Document>
);

/**
 * Generate PDF as a Node Buffer for server-side processing
 */
export async function generateInvoiceBuffer(data: InvoiceProps) {
    return await renderToBuffer(<InvoiceDocument {...data} />);
}
