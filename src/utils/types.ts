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
    pickupPersonName?: string;
    trackingId?: string;
    courierName?: string;
    pickupCharges?: number;
    shippingCharges?: number;
    status: 'Pending' | 'Booked' | 'Shipped' | 'Delivered' | 'Canceled';
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
    pickupCharges?: number;
    shippingCharges?: number;
    status: 'Pending' | 'Booked' | 'Shipped' | 'Delivered' | 'Canceled';
    vendorPaymentStatus?: 'Paid' | 'Udhar';
    customerPaymentStatus?: 'Paid' | 'Udhar';
    pickupPaymentStatus?: 'Paid' | 'Udhar';
    notes?: string;
    createdAt: number;
}

export interface LedgerEntry {
    id: string;
    userId: string;
    orderId?: string;
    personId: string;
    amount: number; // Positive = Credit (owing/received), Negative = Debit (owed/paid)
    transactionType: 'Sale' | 'Purchase' | 'PaymentIn' | 'PaymentOut' | 'Reimbursement' | 'ServiceFee';
    notes?: string;
    orderProductName?: string; // Joined from orders
    orderStatus?: string;      // Joined from orders
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

export const calculateMargin = (original: number, selling: number, pickup: number = 0, shipping: number = 0) => {
    const totalCost = original + pickup + shipping;
    const margin = selling - totalCost;
    const percentage = original > 0 ? (margin / original) * 100 : 0;
    return {
        margin,
        percentage: parseFloat(percentage.toFixed(2)),
    };
};
