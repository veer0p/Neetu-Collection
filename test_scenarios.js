/**
 * Neetu Collection — Test Scenarios Data
 * Ground truth for all order and account cases.
 */

const Scenarios = [
    {
        id: 'ORD-A',
        name: 'Direct Order, All Udhar',
        input: {
            originalPrice: 2000,
            sellingPrice: 2800,
            customerPaymentStatus: 'Udhar',
            vendorPaymentStatus: 'Udhar'
        },
        expected: {
            ledgerCount: 2,
            balances: { customer: 2800, vendor: -2000, pickup: 0 },
            ledger: [
                { type: 'Sale', amount: 2800, person: 'customer' },
                { type: 'Purchase', amount: -2000, person: 'vendor' }
            ]
        }
    },
    {
        id: 'ORD-B',
        name: 'Direct Order, Customer Paid, Vendor Udhar',
        input: {
            originalPrice: 2000,
            sellingPrice: 2800,
            customerPaymentStatus: 'Paid',
            vendorPaymentStatus: 'Udhar'
        },
        expected: {
            ledgerCount: 3,
            balances: { customer: 0, vendor: -2000, pickup: 0 },
            ledger: [
                { type: 'Sale', amount: 2800, person: 'customer' },
                { type: 'Purchase', amount: -2000, person: 'vendor' },
                { type: 'PaymentIn', amount: -2800, person: 'customer' }
            ]
        }
    },
    {
        id: 'ORD-C',
        name: 'Direct Order, Both Paid',
        input: {
            originalPrice: 2000,
            sellingPrice: 2800,
            customerPaymentStatus: 'Paid',
            vendorPaymentStatus: 'Paid'
        },
        expected: {
            ledgerCount: 4,
            balances: { customer: 0, vendor: 0, pickup: 0 },
            ledger: [
                { type: 'Sale', amount: 2800, person: 'customer' },
                { type: 'Purchase', amount: -2000, person: 'vendor' },
                { type: 'PaymentIn', amount: -2800, person: 'customer' },
                { type: 'PaymentOut', amount: 2000, person: 'vendor' }
            ]
        }
    },
    {
        id: 'ORD-D',
        name: 'Direct Order + Shipping, Vendor Udhar',
        input: {
            originalPrice: 2000,
            sellingPrice: 2800,
            shippingCharges: 200,
            customerPaymentStatus: 'Udhar',
            vendorPaymentStatus: 'Udhar'
        },
        expected: {
            ledgerCount: 3,
            balances: { customer: 2800, vendor: -2200, pickup: 0 },
            ledger: [
                { type: 'Sale', amount: 2800, person: 'customer' },
                { type: 'Purchase', amount: -2000, person: 'vendor' },
                { type: 'Expense', amount: -200, person: 'vendor' }
            ]
        }
    },
    {
        id: 'ORD-F',
        name: 'Pickup Order, All Udhar',
        input: {
            originalPrice: 2000,
            sellingPrice: 2800,
            hasPickup: true,
            pickupCharges: 100,
            shippingCharges: 150,
            customerPaymentStatus: 'Udhar',
            vendorPaymentStatus: 'Udhar',
            pickupPaymentStatus: 'Udhar'
        },
        expected: {
            ledgerCount: 4,
            balances: { customer: 2800, vendor: -2000, pickup: -250 },
            ledger: [
                { type: 'Sale', amount: 2800, person: 'customer' },
                { type: 'Purchase', amount: -2000, person: 'vendor' },
                { type: 'Expense', amount: -100, person: 'pickup' },
                { type: 'Expense', amount: -150, person: 'pickup' }
            ]
        }
    },
    {
        id: 'ORD-H',
        name: 'Pickup Order, Paid by Driver (Reimbursement)',
        input: {
            originalPrice: 2000,
            sellingPrice: 2800,
            hasPickup: true,
            pickupCharges: 100,
            paidByDriver: true,
            customerPaymentStatus: 'Udhar',
            pickupPaymentStatus: 'Udhar'
        },
        expected: {
            ledgerCount: 5,
            balances: { customer: 2800, vendor: 0, pickup: -2100 },
            ledger: [
                { type: 'Sale', amount: 2800, person: 'customer' },
                { type: 'Purchase', amount: -2000, person: 'vendor' },
                { type: 'Expense', amount: -100, person: 'pickup' },
                { type: 'PaymentOut', amount: 2000, person: 'vendor' },
                { type: 'Reimbursement', amount: -2000, person: 'pickup' }
            ]
        }
    }
];

const AccountIntegrityCases = [
    {
        id: 'ACC-INTEGRITY',
        name: 'Return Case: Give 1000, Return 1000, Delete Original',
        steps: [
            { action: 'ADD_PAYMENT', person: 'customer', amount: 1000, type: 'PaymentOut', expectedBalance: 1000 },
            { action: 'ADD_PAYMENT', person: 'customer', amount: -1000, type: 'PaymentIn', expectedBalance: 0 },
            { action: 'DELETE_FIRST', person: 'customer', expectedBalance: -1000 }
        ]
    }
];

module.exports = { Scenarios, AccountIntegrityCases };
