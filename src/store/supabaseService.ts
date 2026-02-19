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

    async getOrderById(orderId: string): Promise<Order | null> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:directory!customer_id(name),
                product:directory!product_id(name),
                vendor:directory!vendor_id(name),
                pickup_person:directory!pickup_person_id(name)
            `)
            .eq('id', orderId)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            return null;
        }

        return {
            id: data.id,
            userId: data.user_id,
            date: data.date,
            productId: data.product_id,
            productName: data.product?.name || 'Unknown',
            customerId: data.customer_id,
            customerName: data.customer?.name || 'Unknown',
            vendorId: data.vendor_id,
            vendorName: data.vendor?.name || 'Unknown',
            originalPrice: Number(data.original_price),
            sellingPrice: Number(data.selling_price),
            margin: Number(data.margin),
            paidByDriver: data.paid_by_driver,
            pickupPersonId: data.pickup_person_id,
            pickupPersonName: data.pickup_person?.name,
            trackingId: data.tracking_id,
            courierName: data.courier_name,
            pickupCharges: Number(data.pickup_charges),
            shippingCharges: Number(data.shipping_charges),
            status: data.status,
            vendorPaymentStatus: data.vendor_payment_status,
            customerPaymentStatus: data.customer_payment_status,
            pickupPaymentStatus: data.pickup_payment_status,
            notes: data.notes,
            createdAt: new Date(data.created_at).getTime(),
        } as Order;
    },

    async saveOrder(order: Partial<Order>, userId: string): Promise<void> {
        const isUpdate = !!order.id;
        const margin = (order.sellingPrice || 0) - (order.originalPrice || 0) - (order.pickupCharges || 0) - (order.shippingCharges || 0);
        const orderPayload = {
            user_id: userId,
            date: order.date,
            product_id: order.productId,
            customer_id: order.customerId,
            vendor_id: order.vendorId,
            original_price: order.originalPrice,
            selling_price: order.sellingPrice,
            paid_by_driver: order.paidByDriver || false,
            pickup_person_id: order.pickupPersonId || null,
            tracking_id: order.trackingId,
            courier_name: order.courierName,
            pickup_charges: order.pickupCharges || 0,
            shipping_charges: order.shippingCharges || 0,
            status: order.status || 'Pending',
            notes: order.notes,
            vendor_payment_status: order.vendorPaymentStatus || 'Udhar',
            customer_payment_status: order.customerPaymentStatus || 'Udhar',
            pickup_payment_status: order.pickupPaymentStatus || 'Paid',
            margin,
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

        // === DELETE-AND-RECREATE: Always rebuild ledger for this order ===
        if (isUpdate) {
            const { error: deleteError } = await supabase
                .from('ledger')
                .delete()
                .eq('order_id', savedOrder.id);
            if (deleteError) throw deleteError;
        }

        if (order.status === 'Canceled') return;

        const ledgerEntries: any[] = [];
        const orderId = savedOrder.id;
        const hasPickupPerson = !!order.pickupPersonId;
        const originalPrice = order.originalPrice || 0;
        const sellingPrice = order.sellingPrice || 0;
        const pickupCharges = order.pickupCharges || 0;
        const shippingCharges = order.shippingCharges || 0;
        const paidByDriver = order.paidByDriver || false;

        ledgerEntries.push({
            user_id: userId, order_id: orderId, person_id: order.customerId,
            amount: sellingPrice, transaction_type: 'Sale',
        });
        ledgerEntries.push({
            user_id: userId, order_id: orderId, person_id: order.vendorId,
            amount: -originalPrice, transaction_type: 'Purchase',
        });
        if (!hasPickupPerson && shippingCharges > 0) {
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.vendorId,
                amount: -shippingCharges, transaction_type: 'Expense', notes: 'Shipping charges',
            });
        }
        if (hasPickupPerson && pickupCharges > 0) {
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                amount: -pickupCharges, transaction_type: 'Expense', notes: 'Pickup charges',
            });
        }
        if (hasPickupPerson && shippingCharges > 0) {
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                amount: -shippingCharges, transaction_type: 'Expense', notes: 'Shipping charges',
            });
        }
        if (paidByDriver && hasPickupPerson) {
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.vendorId,
                amount: originalPrice, transaction_type: 'PaymentOut', notes: 'Paid by driver',
            });
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                amount: -originalPrice, transaction_type: 'Reimbursement', notes: 'Product cost reimbursement',
            });
        }
        if (order.customerPaymentStatus === 'Paid') {
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.customerId,
                amount: -sellingPrice, transaction_type: 'PaymentIn',
            });
        }
        if (order.vendorPaymentStatus === 'Paid' && !paidByDriver) {
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.vendorId,
                amount: originalPrice, transaction_type: 'PaymentOut',
            });
            if (!hasPickupPerson && shippingCharges > 0) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.vendorId,
                    amount: shippingCharges, transaction_type: 'PaymentOut', notes: 'Shipping settled',
                });
            }
        }
        if (order.pickupPaymentStatus === 'Paid' && hasPickupPerson) {
            if (pickupCharges > 0) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                    amount: pickupCharges, transaction_type: 'PaymentOut', notes: 'Pickup settled',
                });
            }
            if (shippingCharges > 0) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                    amount: shippingCharges, transaction_type: 'PaymentOut', notes: 'Shipping settled',
                });
            }
            if (paidByDriver) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                    amount: originalPrice, transaction_type: 'PaymentOut', notes: 'Product cost reimbursed',
                });
            }
        }
        const { error: ledgerError } = await supabase.from('ledger').insert(ledgerEntries);
        if (ledgerError) throw ledgerError;
    },

    async getLedgerEntries(personId: string): Promise<LedgerEntry[]> {
        const { data, error } = await supabase
            .from('ledger')
            .select('*, order:orders(product:directory!product_id(name), status)')
            .eq('person_id', personId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return (data || []).map((item: any) => ({
            id: item.id, userId: item.user_id, orderId: item.order_id, personId: item.person_id,
            amount: Number(item.amount), transactionType: item.transaction_type as any, notes: item.notes,
            orderProductName: item.order?.product?.name, orderStatus: item.order?.status,
            createdAt: new Date(item.created_at).getTime(),
        })) as LedgerEntry[];
    },

    async getLedgerEntriesByOrder(orderId: string): Promise<(LedgerEntry & { personName?: string })[]> {
        const { data, error } = await supabase
            .from('ledger')
            .select('*, person:directory!person_id(name)')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (error) return [];
        return (data || []).map((item: any) => ({
            id: item.id, userId: item.user_id, orderId: item.order_id, personId: item.person_id,
            personName: item.person?.name, amount: Number(item.amount),
            transactionType: item.transaction_type as any, notes: item.notes,
            createdAt: new Date(item.created_at).getTime(),
        }));
    },

    async addPayment(entry: Partial<LedgerEntry>, userId: string): Promise<void> {
        const { error } = await supabase.from('ledger').insert([{
            user_id: userId, person_id: entry.personId, amount: entry.amount,
            transaction_type: entry.transactionType, notes: entry.notes
        }]);
        if (error) throw error;
    },

    async updateOrderPaymentStatus(orderId: string, field: 'vendor' | 'customer' | 'pickup', status: 'Paid' | 'Udhar'): Promise<void> {
        const fieldMap: Record<string, string> = { vendor: 'vendor_payment_status', customer: 'customer_payment_status', pickup: 'pickup_payment_status' };
        const { error: updateError } = await supabase.from('orders').update({ [fieldMap[field]]: status }).eq('id', orderId);
        if (updateError) throw updateError;
        const { data: fullOrder, error: fetchError } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (fetchError) throw fetchError;
        await this.saveOrder({
            id: fullOrder.id, date: fullOrder.date, productId: fullOrder.product_id, customerId: fullOrder.customer_id, vendorId: fullOrder.vendor_id,
            originalPrice: Number(fullOrder.original_price), sellingPrice: Number(fullOrder.selling_price),
            paidByDriver: fullOrder.paid_by_driver, pickupPersonId: fullOrder.pickup_person_id,
            trackingId: fullOrder.tracking_id, courierName: fullOrder.courier_name,
            pickupCharges: Number(fullOrder.pickup_charges), shippingCharges: Number(fullOrder.shipping_charges),
            status: fullOrder.status, notes: fullOrder.notes,
            vendorPaymentStatus: fullOrder.vendor_payment_status, customerPaymentStatus: fullOrder.customer_payment_status, pickupPaymentStatus: fullOrder.pickup_payment_status,
        }, fullOrder.user_id);
    },

    async updateLedgerEntry(id: string, notes: string): Promise<void> {
        const { error } = await supabase.from('ledger').update({ notes }).eq('id', id);
        if (error) throw error;
    },

    async getDirectoryWithBalances(userId: string): Promise<DirectoryItem[]> {
        const { data: directoryData, error: directoryError } = await supabase
            .from('directory').select('*, ledger:ledger(amount)').eq('user_id', userId);
        if (directoryError) return [];
        return (directoryData || []).map((item: any) => ({
            ...item, balance: (item.ledger || []).reduce((acc: number, l: any) => acc + Number(l.amount), 0),
            createdAt: new Date(item.created_at).getTime()
        })) as DirectoryItem[];
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
        const { data: orders, error } = await supabase
            .from('orders').select('*, customer:directory!customer_id(name), product:directory!product_id(name), vendor:directory!vendor_id(name), pickup_person:directory!pickup_person_id(name)')
            .eq('user_id', userId).order('date', { ascending: false });
        if (error) return [];
        return (orders || []).map((o: any) => {
            const { margin, percentage } = calculateMargin(Number(o.original_price), Number(o.selling_price), Number(o.pickup_charges), Number(o.shipping_charges));
            return {
                id: o.id, date: o.date, customerName: o.customer?.name || 'Unknown', vendorName: o.vendor?.name || 'Unknown', productName: o.product?.name || 'Unknown',
                originalPrice: Number(o.original_price), sellingPrice: Number(o.selling_price),
                margin, marginPercentage: percentage, vendorPaymentStatus: o.vendor_payment_status, customerPaymentStatus: o.customer_payment_status,
                pickupPaymentStatus: o.pickup_payment_status, pickupPersonName: o.pickup_person?.name,
                trackingId: o.tracking_id, courierName: o.courier_name, pickupCharges: Number(o.pickup_charges), shippingCharges: Number(o.shipping_charges),
                status: o.status, notes: o.notes, createdAt: new Date(o.created_at).getTime(),
            };
        }) as Transaction[];
    },

    async getDirectory(userId: string): Promise<DirectoryItem[]> {
        const { data, error } = await supabase.from('directory').select('*').eq('user_id', userId).order('name');
        if (error) return [];
        return (data || []).map((item: any) => ({ ...item, createdAt: new Date(item.created_at).getTime() })) as DirectoryItem[];
    },

    async saveDirectoryItem(item: Partial<DirectoryItem>, userId: string): Promise<void> {
        const payload = { user_id: userId, name: item.name, type: item.type, address: item.address, phone: item.phone };
        const { error } = item.id ? await supabase.from('directory').update(payload).eq('id', item.id) : await supabase.from('directory').insert([payload]);
        if (error) throw error;
    },

    async deleteDirectoryItem(id: string): Promise<void> {
        const { error } = await supabase.from('directory').delete().eq('id', id);
        if (error) throw error;
    },

    async deleteOrder(orderId: string): Promise<void> {
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) throw error;
    },

    async updateOrderStatus(orderId: string, status: string): Promise<void> {
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*, product:directory!product_id(name), customer:directory!customer_id(name), vendor:directory!vendor_id(name), pickup_person:directory!pickup_person_id(name)')
            .eq('id', orderId).single();
        if (fetchError) throw fetchError;
        const orderData: Order = {
            id: order.id, userId: order.user_id, date: order.date, productId: order.product_id, productName: order.product?.name || 'Unknown',
            customerId: order.customer_id, customerName: order.customer?.name || 'Unknown', vendorId: order.vendor_id, vendorName: order.vendor?.name || 'Unknown',
            originalPrice: Number(order.original_price), sellingPrice: Number(order.selling_price), margin: Number(order.margin),
            paidByDriver: order.paid_by_driver, pickupPersonId: order.pickup_person_id, pickupPersonName: order.pickup_person?.name,
            trackingId: order.tracking_id, courierName: order.courier_name, pickupCharges: Number(order.pickup_charges), shippingCharges: Number(order.shipping_charges),
            status: status as any, notes: order.notes, customerPaymentStatus: order.customer_payment_status, vendorPaymentStatus: order.vendor_payment_status,
            pickupPaymentStatus: order.pickup_payment_status, createdAt: new Date(order.created_at).getTime(),
        };
        await this.saveOrder(orderData, order.user_id);
    },

    async getContactsByType(userId: string, type: 'Customer' | 'Vendor' | 'Product' | 'Pickup Person') {
        const { data, error } = await supabase.from('directory').select('id, name').eq('user_id', userId).eq('type', type).order('name');
        if (error) return [];
        return data || [];
    },

    async getProducts(): Promise<any[]> {
        const { data, error } = await supabase.from('directory').select('*').eq('type', 'Product').order('name');
        return error ? [] : data;
    },

    async addDirectoryItem(item: any, userId: string): Promise<void> {
        await this.saveDirectoryItem(item, userId);
    },

    async updateDirectoryItem(id: string, item: any): Promise<void> {
        await this.saveDirectoryItem({ ...item, id }, item.user_id);
    },
};
