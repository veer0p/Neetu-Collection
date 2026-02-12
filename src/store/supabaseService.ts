import { supabase } from '../utils/supabase';
import { Transaction, DirectoryItem, Order, LedgerEntry } from '../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@neetu_collection_user_session';

export const supabaseService = {
    // --- Auth (Custom Profiles Flow) ---
    async signUp(phone: string, pin: string, name: string): Promise<any> {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ phone, pin, name }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new Error('Phone number already registered.');
            console.error('Error signing up:', error);
            throw error;
        }
        return data;
    },

    async signIn(phone: string, pin: string): Promise<any> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .eq('pin', pin)
            .single();

        if (error || !data) {
            console.error('Error signing in:', error);
            throw new Error('Invalid phone number or PIN.');
        }

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
        return data;
    },

    async getCurrentUser(): Promise<any | null> {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    async signOut(): Promise<void> {
        await AsyncStorage.removeItem(SESSION_KEY);
    },

    // --- Orders & Ledger (v2) ---
    async getOrders(userId: string): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                product:product_id(name),
                customer:customer_id(name),
                vendor:vendor_id(name),
                pickup_person:pickup_person_id(name)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }

        return (data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            date: item.date,
            productId: item.product_id,
            productName: item.product?.name || 'Unknown',
            customerId: item.customer_id,
            customerName: item.customer?.name || 'Unknown',
            vendorId: item.vendor_id,
            vendorName: item.vendor?.name || 'Unknown',
            originalPrice: Number(item.original_price),
            sellingPrice: Number(item.selling_price),
            margin: Number(item.margin),
            paidByDriver: item.paid_by_driver,
            pickupPersonId: item.pickup_person_id,
            pickupPersonName: item.pickup_person?.name,
            trackingId: item.tracking_id,
            courierName: item.courier_name,
            notes: item.notes,
            createdAt: new Date(item.created_at).getTime(),
        })) as Order[];
    },

    async saveOrder(order: Partial<Order>, userId: string): Promise<void> {
        // 1. Insert/Update Order
        const isUpdate = !!order.id;
        const orderPayload = {
            user_id: userId,
            date: order.date,
            product_id: order.productId,
            customer_id: order.customerId,
            vendor_id: order.vendorId,
            original_price: order.originalPrice,
            selling_price: order.sellingPrice,
            paid_by_driver: order.paidByDriver || false,
            pickup_person_id: order.pickupPersonId,
            tracking_id: order.trackingId,
            courier_name: order.courierName,
            notes: order.notes,
        };

        let savedOrder;
        if (isUpdate) {
            const { data, error } = await supabase
                .from('orders')
                .update(orderPayload)
                .eq('id', order.id)
                .select()
                .single();
            if (error) throw error;
            savedOrder = data;
        } else {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();
            if (error) throw error;
            savedOrder = data;
        }

        // 2. Generate Ledger Entries (Only on new order for now, or full recalc)
        if (!isUpdate) {
            const ledgerEntries = [];

            // Customer Ledger (Sale) - They owe you selling_price
            ledgerEntries.push({
                user_id: userId,
                order_id: savedOrder.id,
                person_id: order.customerId,
                amount: order.sellingPrice || 0, // Positive = Receivable
                transaction_type: 'Sale'
            });

            // Vendor Ledger (Purchase) - You owe them original_price
            // If paidByDriver is true, you don't owe the vendor, you owe the driver.
            if (order.paidByDriver && order.pickupPersonId) {
                // To Driver (Reimbursement) - You owe driver original_price
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.pickupPersonId,
                    amount: -(order.originalPrice || 0), // Negative = Payable
                    transaction_type: 'Reimbursement'
                });
            } else {
                // To Vendor - You owe vendor original_price
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.vendorId,
                    amount: -(order.originalPrice || 0), // Negative = Payable
                    transaction_type: 'Purchase'
                });
            }

            const { error: ledgerError } = await supabase
                .from('ledger')
                .insert(ledgerEntries);

            if (ledgerError) throw ledgerError;
        }
    },

    async getLedgerEntries(personId: string): Promise<LedgerEntry[]> {
        const { data, error } = await supabase
            .from('ledger')
            .select('*')
            .eq('person_id', personId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching ledger:', error);
            return [];
        }

        return (data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            orderId: item.order_id,
            personId: item.person_id,
            amount: Number(item.amount),
            transactionType: item.transaction_type as any,
            notes: item.notes,
            createdAt: new Date(item.created_at).getTime(),
        })) as LedgerEntry[];
    },

    async addPayment(entry: Partial<LedgerEntry>, userId: string): Promise<void> {
        const { error } = await supabase
            .from('ledger')
            .insert([{
                user_id: userId,
                person_id: entry.personId,
                amount: entry.amount,
                transaction_type: entry.transactionType,
                notes: entry.notes
            }]);

        if (error) throw error;
    },

    async getDirectoryWithBalances(userId: string): Promise<DirectoryItem[]> {
        // Fetch directory and join with a sum of ledger amounts for each person
        const { data: directoryData, error: directoryError } = await supabase
            .from('directory')
            .select(`
                *,
                ledger:ledger(amount)
            `)
            .eq('user_id', userId);

        if (directoryError) {
            console.error('Error fetching directory balances:', directoryError);
            return [];
        }

        return (directoryData || []).map((item: any) => {
            const balance = (item.ledger || []).reduce((acc: number, l: any) => acc + Number(l.amount), 0);
            return {
                ...item,
                balance,
                createdAt: new Date(item.created_at).getTime()
            };
        }) as DirectoryItem[];
    },

    // --- Legacy Support (to be removed after migration) ---
    async getTransactions(userId: string): Promise<Transaction[]> {
        // Redirecting legacy calls to the new Order model for stability
        const orders = await this.getOrders(userId);
        return orders.map(o => ({
            ...o,
            customerPaymentStatus: 'Udhar', // Defaulting for legacy UI
            vendorPaymentStatus: 'Udhar',
            marginPercentage: (o.margin / o.originalPrice) * 100
        })) as any;
    },

    // --- Directory ---
    async getDirectory(userId: string): Promise<DirectoryItem[]> {
        const { data, error } = await supabase
            .from('directory')
            .select('*')
            .eq('user_id', userId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching directory:', error);
            return [];
        }

        return (data || []).map(item => ({
            ...item,
            createdAt: new Date(item.created_at).getTime(),
        })) as DirectoryItem[];
    },

    async saveDirectoryItem(item: DirectoryItem, userId: string): Promise<void> {
        const payload = {
            user_id: userId,
            name: item.name,
            type: item.type,
            address: item.address,
            phone: item.phone,
        };

        let error;
        const isUpdate = item.id && item.id.length > 20; // Check for UUID

        if (isUpdate) {
            const { error: err } = await supabase
                .from('directory')
                .update(payload)
                .eq('id', item.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('directory')
                .insert([payload]);
            error = err;
        }

        if (error) {
            console.error('Error saving directory item:', error);
            throw error;
        }
    },

    async deleteDirectoryItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('directory')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting directory item:', error);
            throw error;
        }
    },

    // --- Master Lists (for Autocomplete) ---
    async getContactsByType(userId: string, type: 'Vendor' | 'Customer' | 'Product' | 'Pickup Person'): Promise<any[]> {
        const { data, error } = await supabase
            .from('directory')
            .select('id, name')
            .eq('user_id', userId)
            .eq('type', type)
            .order('name', { ascending: true });

        if (error) {
            console.error(`Error fetching ${type}s:`, error);
            return [];
        }

        return data || [];
    },
};
