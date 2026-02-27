import { createHmac } from 'crypto';

// CinetPay API Config
const API_BASE_URL = 'https://api-checkout.cinetpay.com/v2';
const SITE_ID = process.env.NEXT_PUBLIC_CINETPAY_SITE_ID;
const API_KEY = process.env.CINETPAY_API_KEY;

export interface InitPaymentRequest {
    transaction_id: string;
    amount: number;
    currency: 'XOF' | 'CDF' | 'GNF' | 'USD';
    description: string;
    customer_id?: string; // We map this to Supabase User ID
    customer_name?: string;
    customer_surname?: string; // Required by CinetPay
    customer_email?: string;
    customer_phone_number?: string;
    customer_address?: string;
    customer_city?: string;
    customer_country?: string; // ISO 2 chars (TG)
    notify_url: string; // The Webhook URL
    return_url: string; // Success/Failure Redirect URL
    channels?: string; // 'ALL' or 'MOBILE_MONEY,CREDIT_CARD'
    channels?: string; // 'ALL' or 'MOBILE_MONEY,CREDIT_CARD'
    metadata?: string; // JSON String: { userId, packType?, projectId? }
}

export interface InitPaymentResponse {
    code: string; // "201" for Created
    message: string;
    description: string;
    data?: {
        payment_token: string;
        payment_url: string;
    };
    api_response_id?: string;
}

export interface VerifyPaymentResponse {
    code: string; // "00" for Success
    message: string;
    data?: {
        amount: number;
        currency: string;
        status: 'ACCEPTED' | 'REFUSED'; // or other status
        payment_method: string;
        description: string;
        metadata: string;
        operator_id: string;
        payment_date: string;
    };
}

class CinetPayClient {
    /**
     * Initialize a payment session.
     * Returns the Payment URL (Guichet) to redirect the user to.
     */
    async initPayment(payload: InitPaymentRequest): Promise<string> {
        if (!SITE_ID || !API_KEY) throw new Error("Missing CinetPay Credentials");

        const body = {
            ...payload,
            apikey: API_KEY,
            site_id: SITE_ID,
            lang: 'fr',
            channels: payload.channels || 'ALL',
        };

        const response = await fetch(`${API_BASE_URL}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data: InitPaymentResponse = await response.json();

        if (data.code !== '201' || !data.data?.payment_url) {
            console.error("[CinetPay] Init Error:", data);
            throw new Error(`CinetPay Init Failed: ${data.message} - ${data.description}`);
        }

        return data.data.payment_url;
    }

    /**
     * VERIFICATION (The "Trust but Verify" Check)
     * We call this when we receive a Webhook to confirm the status directly with CinetPay.
     */
    async verifyPayment(transaction_id: string): Promise<VerifyPaymentResponse> {
        if (!SITE_ID || !API_KEY) throw new Error("Missing CinetPay Credentials");

        const body = {
            apikey: API_KEY,
            site_id: SITE_ID,
            transaction_id: transaction_id
        };

        const response = await fetch(`${API_BASE_URL}/payment/check`, {
            method: 'POST', // CinetPay uses POST for checking status too
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data: VerifyPaymentResponse = await response.json();
        return data;
    }
}

export const cinetPay = new CinetPayClient();
