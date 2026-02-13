import { supabase } from '../utils/supabase';
import { Order, LedgerEntry, DirectoryItem, Transaction, calculateMargin } from '../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@neetu_collection_user';

export const supabaseService = {
    // --- Profile Services ---
    async signUp(phone: string, pin: string, name: string) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ phone, pin, name }])
            .select()
            .single();
        if (error) throw error;

        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        return data;
    },

    async signIn(phone: string, pin: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .eq('pin', pin)
            .single();
        if (error) throw error;

        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        return data;
    },

    async getCurrentUser() {
        const user = await AsyncStorage.getItem(USER_STORAGE_KEY);
        return user ? JSON.parse(user) : null;
    },

    async signOut() {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
    },

    // --- Order Services ---
    async getOrders(userId: string): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:directory!customer_id(name),
                product:directory!product_id(name),
                vendor:directory!vendor_id(name),
                pickup_person:directory!pickup_person_id(name)
            `)
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
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
            pickupCharges: Number(item.pickup_charges),
            shippingCharges: Number(item.shipping_charges),
            status: item.status,
            vendorPaymentStatus: item.vendor_payment_status,
            customerPaymentStatus: item.customer_payment_status,
            pickupPaymentStatus: item.pickup_payment_status,
            notes: item.notes,
            createdAt: new Date(item.created_at).getTime(),
        })) as Order[];
    },

    async saveOrder(order: Partial<Order>, userId: string): Promise<void> {
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
            pickup_charges: order.pickupCharges || 0,
            shipping_charges: order.shippingCharges || 0,
            status: order.status || 'Pending',
            notes: order.notes,
            vendor_payment_status: order.vendorPaymentStatus || 'Udhar',
            customer_payment_status: order.customerPaymentStatus || 'Udhar',
            pickup_payment_status: order.pickupPaymentStatus || 'Paid',
            margin: order.margin || 0,
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

        if (!isUpdate) {
            const ledgerEntries = [];
            ledgerEntries.push({
                user_id: userId,
                order_id: savedOrder.id,
                person_id: order.customerId,
                amount: order.sellingPrice || 0,
                transaction_type: 'Sale'
            });

            ledgerEntries.push({
                user_id: userId,
                order_id: savedOrder.id,
                person_id: order.vendorId,
                amount: -(order.originalPrice || 0),
                transaction_type: 'Purchase'
            });

            if (order.paidByDriver && order.pickupPersonId) {
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.pickupPersonId,
                    amount: -(order.originalPrice || 0),
                    transaction_type: 'Reimbursement',
                    notes: 'Item price reimbursement'
                });
            }

            if (order.pickupPersonId && order.pickupCharges && order.pickupCharges > 0) {
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.pickupPersonId,
                    amount: order.pickupCharges,
                    transaction_type: 'ServiceFee',
                    notes: 'Pickup service charge'
                });
            }

            if (order.shippingCharges && order.shippingCharges > 0) {
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.vendorId,
                    amount: -(order.shippingCharges || 0),
                    transaction_type: 'Purchase',
                    notes: 'Shipping Charges'
                });
            }

            if (order.customerPaymentStatus === 'Paid') {
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.customerId,
                    amount: -(order.sellingPrice || 0),
                    transaction_type: 'PaymentIn'
                });
            }

            if (order.paidByDriver || order.vendorPaymentStatus === 'Paid') {
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.vendorId,
                    amount: order.originalPrice || 0,
                    transaction_type: 'PaymentOut',
                    notes: order.paidByDriver ? 'Paid by Driver' : 'Paid at Shop'
                });
            }

            if (order.paidByDriver && order.pickupPersonId && order.pickupPaymentStatus === 'Paid') {
                ledgerEntries.push({
                    user_id: userId,
                    order_id: savedOrder.id,
                    person_id: order.pickupPersonId,
                    amount: order.originalPrice || 0,
                    transaction_type: 'PaymentOut',
                    notes: 'Reimbursed immediately'
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
            .select(`
                *,
                order:orders(product_id, product:directory!product_id(name), status)
            `)
            .eq('person_id', personId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching ledger:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            orderId: item.order_id,
            personId: item.person_id,
            amount: Number(item.amount),
            transactionType: item.transaction_type as any,
            notes: item.notes,
            orderProductName: item.order?.product?.name,
            orderStatus: item.order?.status,
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
        const { data: directoryData, error: directoryError } = await supabase
            .from('directory')
            .select(`
                *,
                ledger:ledger(amount)
            `)
            .eq('user_id', userId);

        if (directoryError) {
            console.error('Error fetching directory with balances:', directoryError);
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

    async getTransactions(userId: string): Promise<Transaction[]> {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:directory!customer_id(name),
                product:directory!product_id(name),
                vendor:directory!vendor_id(name),
                pickup_person:directory!pickup_person_id(name)
            `)
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }

        return (orders || []).map((o: any) => {
            const { margin, percentage } = calculateMargin(
                Number(o.original_price),
                Number(o.selling_price),
                Number(o.pickup_charges),
                Number(o.shipping_charges)
            );

            return {
                id: o.id,
                date: o.date,
                customerName: o.customer?.name || 'Unknown',
                vendorName: o.vendor?.name || 'Unknown',
                productName: o.product?.name || 'Unknown',
                originalPrice: Number(o.original_price),
                sellingPrice: Number(o.selling_price),
                margin,
                marginPercentage: percentage,
                vendorPaymentStatus: o.vendor_payment_status,
                customerPaymentStatus: o.customer_payment_status,
                pickupPaymentStatus: o.pickup_payment_status,
                pickupPersonName: o.pickup_person?.name,
                trackingId: o.tracking_id,
                courierName: o.courier_name,
                pickupCharges: Number(o.pickup_charges),
                shippingCharges: Number(o.shipping_charges),
                status: o.status,
                notes: o.notes,
                createdAt: new Date(o.created_at).getTime(),
            };
        }) as Transaction[];
    },

    async getDirectory(userId: string): Promise<DirectoryItem[]> {
        const { data, error } = await supabase
            .from('directory')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) {
            console.error('Error fetching directory:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            ...item,
            createdAt: new Date(item.created_at).getTime()
        })) as DirectoryItem[];
    },

    async saveDirectoryItem(item: Partial<DirectoryItem>, userId: string): Promise<void> {
        const isUpdate = !!item.id;
        const payload = {
            user_id: userId,
            name: item.name,
            type: item.type,
            address: item.address,
            phone: item.phone,
        };

        if (isUpdate) {
            const { error } = await supabase
                .from('directory')
                .update(payload)
                .eq('id', item.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('directory')
                .insert([payload]);
            if (error) throw error;
        }
    },

    async deleteDirectoryItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('directory')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getContactsByType(userId: string, type: 'Customer' | 'Vendor' | 'Product' | 'Pickup Person') {
        const { data, error } = await supabase
            .from('directory')
            .select('id, name')
            .eq('user_id', userId)
            .eq('type', type)
            .order('name');

        if (error) {
            console.error(`Error fetching ${type}:`, error);
            return [];
        }

        return data || [];
    },
};
