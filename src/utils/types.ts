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
    trackingId?: string;
    courierName?: string;
    notes?: string;
    createdAt: number;
}

export interface DirectoryItem {
    id: string;
    name: string;
    type: 'Vendor' | 'Customer';
    address?: string;
    phone?: string;
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
