import { supabaseService } from '../store/supabaseService';
import { calculateMargin } from './types';

const vendors = ["Ramesh Textiles", "Surat Fabrics", "Ludhiana Woolens", "Varanasi Silks", "Radhe Fab"];
const products = ["Designer Suit", "Bridal Lehanga", "Cotton Saree", "Silk Kurti", "Anarkali Set", "Western Gown"];
const customers = ["Amit Kumar", "Sita Devi", "Rajesh Sharma", "Priya Singh", "Manoj Gupta", "Anita Verma"];

export const seedDummyData = async (userId: string) => {
    const now = new Date();

    // 1. Seed Directory first to ensure we have IDs (though saveOrder can resolve them, 
    // it's cleaner to seed them first for consistency).
    for (const vendor of vendors) {
        await supabaseService.saveDirectoryItem({
            id: '',
            name: vendor,
            type: 'Vendor',
            createdAt: Date.now()
        }, userId);
    }
    for (const customer of customers) {
        await supabaseService.saveDirectoryItem({
            id: '',
            name: customer,
            type: 'Customer',
            createdAt: Date.now()
        }, userId);
    }
    for (const product of products) {
        await supabaseService.saveDirectoryItem({
            id: '',
            name: product,
            type: 'Product',
            createdAt: Date.now()
        }, userId);
    }

    // 2. Seed Orders/Ledger
    for (let i = 0; i < 15; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        const originalPrice = Math.floor(Math.random() * 2000) + 1000;
        const sellingPrice = originalPrice + Math.floor(Math.random() * 1000) + 500;

        const customerName = customers[Math.floor(Math.random() * customers.length)];
        const vendorName = vendors[Math.floor(Math.random() * vendors.length)];
        const productName = products[Math.floor(Math.random() * products.length)];

        const order = {
            date: date.toLocaleDateString('en-IN'),
            customerName,
            vendorName,
            productName,
            originalPrice,
            sellingPrice,
            paidByDriver: Math.random() > 0.8,
            vendorPaymentStatus: Math.random() > 0.4 ? 'Paid' : 'Udhar',
            customerPaymentStatus: Math.random() > 0.5 ? 'Paid' : 'Udhar',
            trackingId: `TRK${Math.floor(Math.random() * 900000) + 100000}`,
            courierName: 'Delhivery',
            notes: 'Seeded transaction',
        };

        // Note: saveOrder handles ledger entry generation
        // But for seeding, we might need it to avoid directory lookups if we hadn't seeded them
        // In our case, saveOrder's resolveId logic will find the seeded items.
        await supabaseService.saveOrder(order as any, userId);
    }
};
