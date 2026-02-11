import { supabaseService } from '../store/supabaseService';
import { Transaction, calculateMargin } from './types';

const vendors = ["Ramesh Textiles", "Surat Fabrics", "Ludhiana Woolens", "Varanasi Silks", "Radhe Fab"];
const products = ["Designer Suit", "Bridal Lehanga", "Cotton Saree", "Silk Kurti", "Anarkali Set", "Western Gown"];
const customers = ["Amit Kumar", "Sita Devi", "Rajesh Sharma", "Priya Singh", "Manoj Gupta", "Anita Verma"];

export const seedDummyData = async (userId: string) => {
    const dummyTransactions: Transaction[] = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        const originalPrice = Math.floor(Math.random() * 2000) + 1000;
        const sellingPrice = originalPrice + Math.floor(Math.random() * 1000) + 500;
        const marginInfo = calculateMargin(originalPrice, sellingPrice);

        // Random payment statuses
        const vendorPaid = Math.random() > 0.4;
        const customerPaid = Math.random() > 0.5;

        dummyTransactions.push({
            id: `seed-${i}-${Date.now()}`,
            date: date.toLocaleDateString('en-IN'),
            customerName: customers[Math.floor(Math.random() * customers.length)],
            vendorName: vendors[Math.floor(Math.random() * vendors.length)],
            productName: products[Math.floor(Math.random() * products.length)],
            originalPrice,
            sellingPrice,
            margin: marginInfo.margin,
            marginPercentage: marginInfo.percentage,
            vendorPaymentStatus: vendorPaid ? 'Paid' : 'Udhar',
            customerPaymentStatus: customerPaid ? 'Paid' : 'Udhar',
            trackingId: `TRK${Math.floor(Math.random() * 900000) + 100000}`,
            courierName: 'Delhivery',
            notes: 'Seeded transaction',
            createdAt: date.getTime()
        });
    }

    // Save transactions
    for (const t of dummyTransactions) {
        await supabaseService.addTransaction(t, userId);
    }

    // Save vendors to directory
    for (const vendor of vendors) {
        await supabaseService.saveDirectoryItem({
            id: '',
            name: vendor,
            type: 'Vendor',
            address: 'Seed Address',
            phone: '9999999999',
            createdAt: Date.now()
        }, userId);
    }
};
