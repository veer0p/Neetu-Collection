export interface Transaction {
    id: string;
    date: string;
    customerName: string;
    vendorName: string; // Formerly shopName
    productName: string;
    originalPrice: number; // Purchase price
    sellingPrice: number; // Sale price
    margin: number;
    marginPercentage: number;
    vendorPaymentStatus: 'Paid' | 'Udhar'; // Your payment to vendor
    customerPaymentStatus: 'Paid' | 'Udhar'; // Customer's payment to you
    pickupPaymentStatus?: 'Paid' | 'Udhar'; // Your payment to pickup person
    paidByDriver?: boolean;
    pickupPersonId?: string;
    pickupPersonName?: string;
    trackingId?: string;
    courierName?: string;
    notes?: string;
    createdAt: number;
}

export interface Order {
    id: string;
    userId: string;
    date: string;
    productId: string;
    productName: string;
    customerId: string;
    customerName: string;
    vendorId: string;
    vendorName: string;
    originalPrice: number;
    sellingPrice: number;
    margin: number;
    paidByDriver: boolean;
    pickupPersonId?: string;
    pickupPersonName?: string;
    trackingId?: string;
    courierName?: string;
    notes?: string;
    vendorPaymentStatus?: 'Paid' | 'Udhar';
    customerPaymentStatus?: 'Paid' | 'Udhar';
    pickupPaymentStatus?: 'Paid' | 'Udhar';
    createdAt: number;
}

export interface LedgerEntry {
    id: string;
    userId: string;
    orderId?: string;
    personId: string;
    amount: number; // Positive = Credit (owing/received), Negative = Debit (owed/paid)
    transactionType: 'Sale' | 'Purchase' | 'PaymentIn' | 'PaymentOut' | 'Reimbursement';
    notes?: string;
    createdAt: number;
}

export interface DirectoryItem {
    id: string;
    name: string;
    type: 'Vendor' | 'Customer' | 'Product' | 'Pickup Person';
    address?: string;
    phone?: string;
    balance?: number;
    totalSales?: number;
    totalPurchases?: number;
    lastTransactionDate?: number;
    createdAt: number;
}

export type Period = 'This Week' | 'This Month' | 'Last 3 Months' | 'Custom';

export const calculateMargin = (original: number, selling: number) => {
    const margin = selling - original;
    const percentage = original > 0 ? (margin / original) * 100 : 0;
    return {
        margin,
        percentage: parseFloat(percentage.toFixed(2)),
    };
};
