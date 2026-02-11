import { supabase } from '../utils/supabase';
import { Transaction, DirectoryItem } from '../utils/types';
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

    // --- Transactions ---
    async getTransactions(userId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }

        return (data || []).map(item => ({
            ...item,
            originalPrice: Number(item.original_price),
            sellingPrice: Number(item.selling_price),
            margin: Number(item.margin),
            marginPercentage: Number(item.margin_percentage),
            vendorPaymentStatus: item.vendor_payment_status,
            customerPaymentStatus: item.customer_payment_status,
            customerName: item.customer_name,
            vendorName: item.vendor_name,
            productName: item.product_name,
            trackingId: item.tracking_id,
            courierName: item.courier_name,
        })) as Transaction[];
    },

    async addTransaction(transaction: Transaction, userId: string): Promise<void> {
        const payload = {
            user_id: userId,
            date: transaction.date,
            customer_name: transaction.customerName,
            vendor_name: transaction.vendorName,
            product_name: transaction.productName,
            original_price: transaction.originalPrice,
            selling_price: transaction.sellingPrice,
            vendor_payment_status: transaction.vendorPaymentStatus,
            customer_payment_status: transaction.customerPaymentStatus,
            tracking_id: transaction.trackingId,
            courier_name: transaction.courierName,
            notes: transaction.notes,
        };

        const { error } = await supabase
            .from('transactions')
            .insert([payload]);

        if (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    },

    async updateTransaction(id: string, target: 'vendor' | 'customer', status: 'Paid' | 'Udhar'): Promise<void> {
        const column = target === 'vendor' ? 'vendor_payment_status' : 'customer_payment_status';
        const { error } = await supabase
            .from('transactions')
            .update({ [column]: status })
            .eq('id', id);

        if (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
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

    // --- Master Shops ---
    async getShops(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('directory')
            .select('name')
            .eq('user_id', userId)
            .eq('type', 'Vendor')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching shops:', error);
            return [];
        }

        return Array.from(new Set((data || []).map(item => item.name)));
    },
};
