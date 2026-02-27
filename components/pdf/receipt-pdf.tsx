import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Standard styling for a professional receipt
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        color: '#334155', // slate-700
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 20,
    },
    agencyInfo: {
        flexDirection: 'column',
    },
    agencyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5', // indigo-600
        marginBottom: 4,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#1E293B', // slate-800
    },
    paidStamp: {
        position: 'absolute',
        top: 150,
        right: 40,
        borderWidth: 3,
        borderColor: '#10B981', // green-500
        color: '#10B981',
        padding: 8,
        fontSize: 20,
        fontWeight: 'bold',
        borderRadius: 4,
        transform: 'rotate(-15deg)',
        opacity: 0.8,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94A3B8', // slate-400
        marginBottom: 8,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    infoBlock: {
        flexDirection: 'column',
    },
    table: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    tableHeader: {
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        padding: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        padding: 8,
    },
    col1: { width: '70%' },
    col2: { width: '30%', textAlign: 'right' },
    totalSection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalBox: {
        width: '40%',
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
    }
});

interface ReceiptData {
    id: string;
    date: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    currency: string;
    provider: string;
    description: string;
    type: 'mission' | 'formation';
    projectName?: string;
    packName?: string;
    agency?: {
        company_name: string;
        address: string;
        siret: string;
        email_contact: string;
        logo_url?: string;
    };
}

export const ReceiptPDF = ({ data }: { data: ReceiptData }) => {
    const safeCurrency = data.currency === 'FCFA' ? 'XOF' : (data.currency || 'XOF');
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: safeCurrency
    }).format(data.amount);

    return (
        <Document title={`Recu_${data.customerName}_${data.id.substring(0, 8)}`}>
            <Page size="A4" style={styles.page}>
                {/* Stamp "PAYÉ" */}
                <View style={styles.paidStamp}>
                    <Text>PAYÉ</Text>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.agencyInfo}>
                        <Text style={styles.agencyTitle}>{data.agency?.company_name || 'Antygravity Agency'}</Text>
                        <Text>{data.agency?.address || 'Lomé, Quartier Administratif'}</Text>
                        <Text>Togo, RCCM: {data.agency?.siret || 'TG-LOM-2024-B-001'}</Text>
                        <Text>{data.agency?.email_contact || 'contact@antyg.agency'}</Text>
                    </View>
                    <View>
                        <Text style={styles.invoiceTitle}>REÇU</Text>
                        <Text style={{ textAlign: 'right', color: '#64748B' }}>Ref: {data.id.substring(0, 8).toUpperCase()}</Text>
                        <Text style={{ textAlign: 'right', color: '#64748B' }}>Date: {new Date(data.date).toLocaleDateString('fr-FR')}</Text>
                    </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.sectionTitle}>Facturé à</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.customerName}</Text>
                        <Text style={{ color: '#64748B' }}>{data.customerEmail}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.sectionTitle}>Mode de Règlement</Text>
                        <Text style={{ fontSize: 11 }}>Moneroo (Mobile Money)</Text>
                        <Text style={{ color: '#64748B', fontSize: 9 }}>Trans ID: {data.provider === 'moneroo' ? data.id : 'N/A'}</Text>
                    </View>
                </View>

                {/* Item Table */}
                <View style={styles.sectionTitle}>Détails de la transaction</View>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Désignation</Text>
                        <Text style={styles.col2}>Montant</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.col1}>
                            <Text style={{ fontWeight: 'bold' }}>
                                {data.type === 'mission' ? `Paiement Mission : ${data.projectName}` : `Inscription Formation : Pack ${data.packName}`}
                            </Text>
                            <Text style={{ color: '#64748B', fontSize: 9, marginTop: 2 }}>
                                {data.description}
                            </Text>
                        </View>
                        <Text style={styles.col2}>{formattedAmount}</Text>
                    </View>
                </View>

                {/* Total Box */}
                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>TOTAL RÉGLÉ</Text>
                        <Text style={styles.totalAmount}>{formattedAmount}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Ce document tient lieu de reçu officiel de paiement.</Text>
                    <Text>{data.agency?.company_name || 'AntyG Agency'} - Société à Responsabilité Limitée</Text>
                    <Text>Lomé, Togo - www.antyg.agency</Text>
                </View>
            </Page>
        </Document>
    );
};
