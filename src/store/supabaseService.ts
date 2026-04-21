import { supabase } from '../utils/supabase';
import { Order, LedgerEntry, DirectoryItem, Transaction, calculateMargin, OrderStatus, Expense } from '../utils/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@neetu_collection_user';

export const supabaseService = {
    // --- Profile Services ---
    async signUp(phone: string, pin: string, name: string) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ phone, pin, name }])
            .select()
            .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Failed to create user profile.');

        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        return data;
    },

    async signIn(phone: string, pin: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .eq('pin', pin)
            .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Invalid phone number or PIN.');

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

    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId: string, updates: any) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;

        // Update local storage if it's the current user
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        }
        return data;
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
            statusHistory: item.status_history,
            quantity: item.quantity || 1,
            unitOriginalPrice: Number(item.unit_original_price || item.original_price),
            unitSellingPrice: Number(item.unit_selling_price || item.selling_price),
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
            statusHistory: data.status_history,
            quantity: data.quantity || 1,
            unitOriginalPrice: Number(data.unit_original_price || data.original_price),
            unitSellingPrice: Number(data.unit_selling_price || data.selling_price),
            createdAt: new Date(data.created_at).getTime(),
        } as Order;
    },

    async saveOrder(order: Partial<Order>, userId: string): Promise<void> {
        const isUpdate = !!order.id;
        const margin = (Number(order.sellingPrice) || 0) - (Number(order.originalPrice) || 0);

        let savedOrder;
        if (isUpdate) {
            // Fetch existing order to preserve its status history if not provided
            let history: any[] = order.statusHistory || [];
            if (!order.statusHistory) {
                const { data: existing } = await supabase.from('orders').select('status_history').eq('id', order.id).single();
                history = existing?.status_history || [];
            }

            // Only append to history if status has changed or history is empty
            if (order.status && (!history.length || history[history.length - 1].status !== order.status)) {
                history.push({
                    status: order.status,
                    date: new Date().toISOString()
                });
            }

            const orderPayload = {
                user_id: userId,
                date: order.date,
                product_id: order.productId || null,
                customer_id: order.customerId || null,
                vendor_id: order.vendorId || null,
                original_price: order.originalPrice,
                selling_price: order.sellingPrice,
                paid_by_driver: order.paidByDriver || false,
                pickup_person_id: order.pickupPersonId || null,
                tracking_id: order.trackingId,
                courier_name: order.courierName,
                pickup_charges: order.pickupCharges || 0,
                shipping_charges: order.shippingCharges || 0,
                status: order.status || 'Pending',
                status_history: history,
                notes: order.notes,
                vendor_payment_status: order.vendorPaymentStatus || 'Udhar',
                customer_payment_status: order.customerPaymentStatus || 'Udhar',
                pickup_payment_status: order.pickupPaymentStatus || 'Paid',
                quantity: order.quantity || 1,
                unit_original_price: order.unitOriginalPrice || order.originalPrice || 0,
                unit_selling_price: order.unitSellingPrice || order.sellingPrice || 0,
                margin,
            };

            const { data, error } = await supabase
                .from('orders')
                .update(orderPayload)
                .eq('id', order.id)
                .select()
                .single();
            if (error) throw error;
            savedOrder = data;
        } else {
            const orderPayload = {
                user_id: userId,
                date: order.date,
                product_id: order.productId || null,
                customer_id: order.customerId || null,
                vendor_id: order.vendorId || null,
                original_price: order.originalPrice,
                selling_price: order.sellingPrice,
                paid_by_driver: order.paidByDriver || false,
                pickup_person_id: order.pickupPersonId || null,
                tracking_id: order.trackingId,
                courier_name: order.courierName,
                pickup_charges: order.pickupCharges || 0,
                shipping_charges: order.shippingCharges || 0,
                status: order.status || 'Pending',
                status_history: order.statusHistory || [{
                    status: order.status || 'Pending',
                    date: new Date().toISOString()
                }],
                notes: order.notes,
                vendor_payment_status: order.vendorPaymentStatus || 'Udhar',
                customer_payment_status: order.customerPaymentStatus || 'Udhar',
                pickup_payment_status: order.pickupPaymentStatus || 'Paid',
                quantity: order.quantity || 1,
                unit_original_price: order.unitOriginalPrice || order.originalPrice || 0,
                unit_selling_price: order.unitSellingPrice || order.sellingPrice || 0,
                margin,
            };

            const { data, error } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();
            if (error) throw error;
            savedOrder = data;
        }

        // === DELETE-AND-RECREATE: Rebuild ledger for this order ===
        // Normal edits delete non-payment entries. 
        // For Canceled/Returned, we keep the history and append reversals instead of deleting.
        const isCanceledOrReturned = order.status === 'Canceled' || order.status === 'Returned';
        if (isUpdate && !isCanceledOrReturned) {
            const { error: deleteError } = await supabase
                .from('ledger')
                .delete()
                .eq('order_id', savedOrder.id)
                .not('transaction_type', 'in', '("PaymentIn","PaymentOut","Refund","Recovery","Reversal")');
            if (deleteError) throw deleteError;

            // V2 Accounting: Purge pending 'due' transactions for this order to avoid duplicates on re-save
            await supabase.from('v2_transactions')
                .delete()
                .eq('order_id', savedOrder.id)
                .eq('type', 'due');
        }

        const orderId = savedOrder.id;
        const originalPrice = Number(order.originalPrice || 0);
        const sellingPrice = Number(order.sellingPrice || 0);
        const pickupCharges = Number(order.pickupCharges || 0);
        const shippingCharges = Number(order.shippingCharges || 0);
        const hasPickupPerson = !!order.pickupPersonId;
        const paidByDriver = order.paidByDriver || false;

        if (isCanceledOrReturned) {
            // Reversal Logic:
            // Instead of deleting the history, we add balancing entries that zero out the amounts.
            // 1. Fetch current status of ledger for this order to see what needs reversing
            const { data: currentEntries } = await supabase
                .from('ledger')
                .select('*')
                .eq('order_id', orderId)
                .not('transaction_type', 'in', '("Refund","Recovery","Reversal")');

            const reversalEntries: any[] = [];
            const alreadyReversed = await supabase
                .from('ledger')
                .select('notes')
                .eq('order_id', orderId)
                .in('transaction_type', ['Refund', 'Recovery', 'Reversal']);

            // Only add reversals if not already reversed (prevent duplicate cancellation entries)
            if (alreadyReversed.data?.length === 0) {
                (currentEntries || []).forEach((e: any) => {
                    reversalEntries.push({
                        user_id: userId, order_id: orderId, person_id: e.person_id,
                        amount: -Number(e.amount),
                        transaction_type: e.transaction_type === 'Sale' ? 'Refund' : e.transaction_type === 'Purchase' ? 'Recovery' : 'Reversal',
                        notes: `${order.status} Reversal of ${e.transaction_type}`,
                    });
                });

                // Special case: If order was "Returned", we might have extra fees to charge.
                if (order.status === 'Returned' && (order.margin || 0) < 0) {
                    // This could be handled via the prompt's returnFee, but here we cover the generic return.
                }

                if (reversalEntries.length > 0) {
                    const { error: revError } = await supabase.from('ledger').insert(reversalEntries);
                    if (revError) throw revError;
                }
            }
        } else {
            const ledgerEntries: any[] = [];

            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.customerId || null,
                amount: sellingPrice + shippingCharges + pickupCharges, transaction_type: 'Sale', is_settled: false,
            });
            ledgerEntries.push({
                user_id: userId, order_id: orderId, person_id: order.vendorId || null,
                amount: -originalPrice, transaction_type: 'Purchase', is_settled: false,
            });
            if (!hasPickupPerson && shippingCharges > 0) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.vendorId || null,
                    amount: -shippingCharges, transaction_type: 'Expense', notes: 'Shipping charges', is_settled: false,
                });
            }
            if (hasPickupPerson && pickupCharges > 0) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId || null,
                    amount: -pickupCharges, transaction_type: 'Expense', notes: 'Pickup charges', is_settled: false,
                });
            }
            if (hasPickupPerson && shippingCharges > 0) {
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId || null,
                    amount: -shippingCharges, transaction_type: 'Expense', notes: 'Shipping charges', is_settled: false,
                });
            }
            if (paidByDriver && hasPickupPerson) {
                // Driver paid the vendor directly — mark the vendor's Purchase as settled immediately
                for (const e of ledgerEntries) {
                    if (e.person_id === order.vendorId && (e.transaction_type === 'Purchase' || (e.transaction_type === 'Expense' && e.notes === 'Shipping charges'))) {
                        e.is_settled = true;
                        e.settled_at = new Date().toISOString();
                    }
                }

                // AND create balancing entry for Vendor so their balance becomes 0
                // We use 'PaymentOut' because from shop perspective it's a payment made (even though via driver)
                ledgerEntries.push({
                    user_id: userId, order_id: orderId, person_id: order.vendorId || null,
                    amount: originalPrice, transaction_type: 'PaymentOut',
                    notes: 'Paid by pickup person', is_settled: true,
                    settled_at: new Date().toISOString()
                });

                // Also record the debt to the Pickup Person (Reimbursement)
                if (originalPrice > 0) {
                    ledgerEntries.push({
                        user_id: userId, order_id: orderId, person_id: order.pickupPersonId || null,
                        amount: -originalPrice, transaction_type: 'Expense',
                        notes: 'Product cost (paid by driver)', is_settled: false,
                    });
                }
            }
            if (order.customerPaymentStatus === 'Paid') {
                // Mark Sale as settled instead of adding a PaymentIn entry
                const saleEntry = ledgerEntries.find((e: any) => e.transaction_type === 'Sale' && e.person_id === (order.customerId || null));
                if (saleEntry) { saleEntry.is_settled = true; saleEntry.settled_at = new Date().toISOString(); }
            }
            if (order.vendorPaymentStatus === 'Paid' && !paidByDriver) {
                // Mark Purchase and Expense (shipping on vendor) as settled instead of adding PaymentOut entries
                for (const e of ledgerEntries) {
                    if (
                        e.person_id === (order.vendorId || null) &&
                        (e.transaction_type === 'Purchase' || e.transaction_type === 'Expense')
                    ) {
                        e.is_settled = true;
                        e.settled_at = new Date().toISOString();
                    }
                }
            }
            if (order.pickupPaymentStatus === 'Paid' && hasPickupPerson) {
                // Mark ALL Expense entries for pickup person as settled (pickup charges, shipping, and product cost if paidByDriver)
                for (const e of ledgerEntries) {
                    if (
                        e.person_id === (order.pickupPersonId || null) &&
                        e.transaction_type === 'Expense'
                    ) {
                        e.is_settled = true;
                        e.settled_at = new Date().toISOString();
                    }
                }
            }
            const { error: ledgerError } = await supabase.from('ledger').insert(ledgerEntries);
            if (ledgerError) throw ledgerError;
        }

        // === V2 ACCOUNTING INTEGRATION ===
        // 1. Cleanup old v2 transactions for this order
        const { error: v2DelError } = await supabase
            .from('v2_transactions')
            .delete()
            .eq('order_id', orderId);
        if (v2DelError) throw v2DelError;

        // 2. Generate new v2 transactions
        // If order is Canceled, we don't re-insert, effectively reversing the balance impact.
        if (order.status !== 'Canceled') {
            const v2Entries: any[] = [];
            const commonMetadata = { original_price: originalPrice, selling_price: sellingPrice, product_name: order.productName };

            // Core Sale/Purchase
            if (order.customerId) {
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.customerId,
                    amount: sellingPrice + shippingCharges + pickupCharges, type: 'due', direction: 'in',
                    description: `Sale: ${order.productName}`, payment_for: 'Sale', metadata: commonMetadata
                });
            }
            if (order.vendorId) {
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.vendorId,
                    amount: originalPrice, type: 'due', direction: 'out',
                    description: `Purchase: ${order.productName}`, payment_for: 'Purchase', metadata: commonMetadata
                });
            }

            // Expenses
            if (pickupCharges > 0 && order.pickupPersonId) {
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                    amount: pickupCharges, type: 'due', direction: 'out',
                    description: `Pickup: ${order.productName}`, payment_for: 'Expense', metadata: { ...commonMetadata, type: 'Pickup' }
                });
            }
            if (shippingCharges > 0) {
                const shipPersonId = order.pickupPersonId || order.vendorId;
                if (shipPersonId) {
                    v2Entries.push({
                        user_id: userId, order_id: orderId, person_id: shipPersonId,
                        amount: shippingCharges, type: 'due', direction: 'out',
                        description: `Shipping: ${order.productName}`, payment_for: 'Expense', metadata: { ...commonMetadata, type: 'Shipping' }
                    });
                }
            }

            // Settlements
            if (order.customerPaymentStatus === 'Paid' && order.customerId) {
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.customerId,
                    amount: sellingPrice + shippingCharges + pickupCharges, type: 'paid', direction: 'in',
                    description: `Settle Sale: ${order.productName}`, payment_for: 'Payment',
                    paid_at: new Date().toISOString()
                });
            }

            // Driver Paid Logic
            if (paidByDriver && order.pickupPersonId && order.vendorId) {
                // Settles vendor purchase
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.vendorId,
                    amount: originalPrice, type: 'paid', direction: 'out',
                    description: `Settled by Driver: ${order.productName}`, payment_for: 'Payment',
                    paid_at: new Date().toISOString()
                });
                // Owe driver for the product cost
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                    amount: originalPrice, type: 'due', direction: 'out',
                    description: `Product Cost Reimb: ${order.productName}`, payment_for: 'Reimbursement'
                });
            }

            // Vendor Payment (not driver-paid)
            if (order.vendorPaymentStatus === 'Paid' && !paidByDriver && order.vendorId) {
                v2Entries.push({
                    user_id: userId, order_id: orderId, person_id: order.vendorId,
                    amount: originalPrice, type: 'paid', direction: 'out',
                    description: `Settle Purchase: ${order.productName}`, payment_for: 'Payment',
                    paid_at: new Date().toISOString()
                });
            }

            // Pickup/Shipping Settlements
            if (order.pickupPaymentStatus === 'Paid' && order.pickupPersonId) {
                if (pickupCharges > 0) {
                    v2Entries.push({
                        user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                        amount: pickupCharges, type: 'paid', direction: 'out',
                        description: `Settle Pickup: ${order.productName}`, payment_for: 'Payment',
                        paid_at: new Date().toISOString()
                    });
                }
                if (shippingCharges > 0) {
                    v2Entries.push({
                        user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                        amount: shippingCharges, type: 'paid', direction: 'out',
                        description: `Settle Shipping: ${order.productName}`, payment_for: 'Payment',
                        paid_at: new Date().toISOString()
                    });
                }
                if (paidByDriver) {
                    v2Entries.push({
                        user_id: userId, order_id: orderId, person_id: order.pickupPersonId,
                        amount: originalPrice, type: 'paid', direction: 'out',
                        description: `Reimbursed Driver: ${order.productName}`, payment_for: 'Payment',
                        paid_at: new Date().toISOString()
                    });
                }
            }

            if (v2Entries.length > 0) {
                const { error: v2Error } = await supabase.from('v2_transactions').insert(v2Entries);
                if (v2Error) throw v2Error;
            }
        }
    },

    async getLedgerEntries(personId: string): Promise<LedgerEntry[]> {
        const { data, error } = await supabase
            .from('ledger')
            .select('*, order:orders(product:directory!product_id(name), status, quantity)')
            .eq('person_id', personId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return (data || []).map((item: any) => ({
            id: item.id, userId: item.user_id, orderId: item.order_id, personId: item.person_id,
            amount: Number(item.amount), transactionType: item.transaction_type as any, notes: item.notes,
            orderProductName: item.order?.product?.name, orderStatus: item.order?.status,
            orderQuantity: item.order?.quantity,
            createdAt: new Date(item.created_at).getTime(),
            isSettled: item.is_settled ?? false,
            settledAt: item.settled_at ? new Date(item.settled_at).getTime() : undefined,
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
            transaction_type: entry.transactionType, notes: entry.notes,
            is_settled: false,
        }]);
        if (error) throw error;

        // --- V2 ACCOUNTING INTEGRATION ---
        const direction = entry.transactionType === 'PaymentIn' ? 'in' : 'out';
        const amount = Math.abs(Number(entry.amount));

        await this.addV2Transaction({
            userId,
            personId: entry.personId || '',
            amount,
            type: 'paid',
            direction,
            description: entry.notes || `${entry.transactionType}`,
            paymentFor: 'Payment',
            paidAt: new Date().toISOString()
        });

        // Automatically try to settle pending orders with the new balance
        await this.autoSettleEntries(entry.personId || '', userId);
    },

    async autoSettleEntries(personId: string, userId: string): Promise<void> {
        // 0. Fetch person type to know which status field to update later
        const { data: person } = await supabase.from('directory').select('type').eq('id', personId).single();
        if (!person) return;

        // 1. Fetch all ledger entries for this person
        const { data: entries, error } = await supabase
            .from('ledger')
            .select('id, amount, is_settled, order_id')
            .eq('person_id', personId)
            .order('created_at', { ascending: true });

        if (error || !entries) return;

        // 2. Separate into manual (Payments) and unsettled order-linked entries
        const manualEntries = entries.filter((e: any) => e.order_id === null);
        const unsettledOrders = entries.filter((e: any) => e.order_id !== null && !e.is_settled);

        if (unsettledOrders.length === 0) return;

        // 3. FIFO Match: youngest payments vs oldest orders
        const toSettle: string[] = [];
        const orderIdsToUpdate: string[] = [];

        // Track which manual entries to settle
        const unsettledManual = manualEntries.filter(e => !e.is_settled);
        let manualBalance = unsettledManual.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

        for (const orderEntry of unsettledOrders) {
            const amount = Number(orderEntry.amount);
            // If manual balance is opposite sign (credit) and covers the order amount
            if (manualBalance !== 0 && (manualBalance > 0 !== amount > 0)) {
                if (Math.abs(manualBalance) >= Math.abs(amount)) {
                    toSettle.push(orderEntry.id);
                    if (orderEntry.order_id) orderIdsToUpdate.push(orderEntry.order_id);
                    manualBalance += amount;

                    // If balance exactly hits zero, we can likely settle the manual entries too
                    // To be safe, we only mark manual entries as settled if the TOTAL manual balance is now zero
                    if (manualBalance === 0) {
                        unsettledManual.forEach(m => toSettle.push(m.id));
                    }
                } else {
                    // Insufficient balance to cover this entire order
                    break;
                }
            }
        }

        if (toSettle.length > 0) {
            // Update ledger entries
            await supabase
                .from('ledger')
                .update({ is_settled: true, settled_at: new Date().toISOString() })
                .in('id', toSettle);

            // Sync with orders table so edits don't revert settlement
            if (orderIdsToUpdate.length > 0) {
                const statusField = person.type === 'Customer' ? 'customer_payment_status'
                    : person.type === 'Vendor' ? 'vendor_payment_status'
                        : 'pickup_payment_status';

                await supabase
                    .from('orders')
                    .update({ [statusField]: 'Paid' })
                    .in('id', orderIdsToUpdate);
            }
        }
    },

    async bulkDeleteOrders(ids: string[]): Promise<void> {
        if (!ids.length) return;

        // As requested, delete the orders but do NOT touch any payment or other entries 
        // that might have been settled previously.
        const { error } = await supabase
            .from('orders')
            .delete()
            .in('id', ids);

        if (error) throw error;
    },

    async processOrderCancel(orderId: string, userId: string, options: { refundFromShop: boolean, refundFromStaff: boolean }): Promise<void> {
        const order = await this.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        await this.saveOrder({ ...order, status: 'Canceled' }, userId);

        if (options.refundFromShop && order.vendorId) {
            const amount = order.originalPrice;
            await supabase.from('ledger').insert([{
                user_id: userId, person_id: order.vendorId, order_id: orderId,
                amount: amount, // Recovery of funds from vendor (reduces our debt, so positive)
                transaction_type: 'PaymentIn', notes: 'Shop Refund (Cancel)'
            }]);

            // V2 Equivalent
            await this.addV2Transaction({
                userId,
                personId: order.vendorId,
                orderId,
                amount: Math.abs(amount),
                type: 'paid',
                direction: 'in', // Refund from vendor is money IN
                description: 'Shop Refund (Cancel)',
                paymentFor: 'Payment',
                paidAt: new Date().toISOString()
            });
        }
    },

    async processOrderReturn(orderId: string, userId: string, returnFee: number): Promise<void> {
        const order = await this.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        await this.saveOrder({ ...order, status: 'Returned' }, userId);

        if (returnFee > 0) {
            await supabase.from('ledger').insert([{
                user_id: userId, person_id: order.customerId, order_id: orderId,
                amount: returnFee, // Fee charged to customer (increases their debt, so positive)
                transaction_type: 'Expense', notes: 'Order Return Fee'
            }]);

            // V2 Equivalent
            await this.addV2Transaction({
                userId,
                personId: order.customerId || '',
                orderId,
                amount: returnFee,
                type: 'due',
                direction: 'in', // Fee charged to customer is money due IN
                description: 'Order Return Fee',
                paymentFor: 'Expense'
            });
        }
    },

    async updateOrderPaymentStatus(orderId: string, field: 'vendor' | 'customer' | 'pickup', status: 'Paid' | 'Udhar'): Promise<void> {
        const fieldMap: Record<string, string> = { vendor: 'vendor_payment_status', customer: 'customer_payment_status', pickup: 'pickup_payment_status' };

        // 1. Fetch the full order first to get amount and person details
        const { data: fullOrder, error: fetchError } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (fetchError) throw fetchError;

        // 2. If marking as Paid, always record a corresponding Payment entry in the ledger
        if (status === 'Paid') {
            let amount = 0;
            let type: any = 'PaymentIn';
            let personId = '';

            if (field === 'customer') {
                amount = -(Number(fullOrder.selling_price) + Number(fullOrder.shipping_charges || 0) + Number(fullOrder.pickup_charges || 0)); // PaymentIn (Customer pays us)
                type = 'PaymentIn';
                personId = fullOrder.customer_id;
            } else if (field === 'vendor') {
                amount = Number(fullOrder.original_price); // PaymentOut (We pay vendor, reduces our debt)
                type = 'PaymentOut';
                personId = fullOrder.vendor_id;
            } else if (field === 'pickup') {
                amount = Number(fullOrder.pickup_charges || 0) + Number(fullOrder.shipping_charges || 0);
                type = 'PaymentOut';
                personId = fullOrder.pickup_person_id;
            }

            if (personId) {
                const { error: paymentError } = await supabase.from('ledger').insert([{
                    user_id: fullOrder.user_id, person_id: personId, order_id: orderId, amount,
                    transaction_type: type, notes: `Settled with "Mark Paid" (Order #${orderId.slice(0, 4)})`,
                    is_settled: false,
                }]);
                if (paymentError) throw paymentError;
            }
        }

        // 3. Update the order table status
        const { error: updateError } = await supabase.from('orders').update({ [fieldMap[field]]: status }).eq('id', orderId);
        if (updateError) throw updateError;

        // 4. Rebuild the ledger entries for this order (to set is_settled = true)
        await this.saveOrder({
            id: fullOrder.id, date: fullOrder.date, productId: fullOrder.product_id, customerId: fullOrder.customer_id, vendorId: fullOrder.vendor_id,
            originalPrice: Number(fullOrder.original_price), sellingPrice: Number(fullOrder.selling_price),
            paidByDriver: fullOrder.paid_by_driver, pickupPersonId: fullOrder.pickup_person_id,
            trackingId: fullOrder.tracking_id, courierName: fullOrder.courier_name,
            pickupCharges: Number(fullOrder.pickup_charges), shippingCharges: Number(fullOrder.shipping_charges),
            status: fullOrder.status, notes: fullOrder.notes,
            vendorPaymentStatus: field === 'vendor' ? status : fullOrder.vendor_payment_status,
            customerPaymentStatus: field === 'customer' ? status : fullOrder.customer_payment_status,
            pickupPaymentStatus: field === 'pickup' ? status : fullOrder.pickup_payment_status,
        }, fullOrder.user_id);
    },

    async updateLedgerEntry(id: string, notes: string): Promise<void> {
        const { error } = await supabase.from('ledger').update({ notes }).eq('id', id);
        if (error) throw error;
    },

    async deleteLedgerEntry(id: string): Promise<void> {
        const { error } = await supabase.from('ledger').delete().eq('id', id);
        if (error) throw error;
    },

    async settleLedgerEntry(id: string, userId: string): Promise<void> {
        // Fetch the entry first to check if it's manual (no order_id)
        const { data: entry, error: fetchErr } = await supabase
            .from('ledger')
            .select('order_id, amount, person_id')
            .eq('id', id)
            .single();
        if (fetchErr) throw fetchErr;

        const now = new Date().toISOString();

        if (!entry.order_id) {
            // Manual entry: create counter payment record to balance the account
            const amount = Number(entry.amount);
            const counterType = amount > 0 ? 'PaymentIn' : 'PaymentOut';
            const { error: insertErr } = await supabase.from('ledger').insert([{
                user_id: userId,
                person_id: entry.person_id,
                amount: -amount,
                transaction_type: counterType,
                notes: 'Quick settle',
                is_settled: false, // Manual entries are always "unsettled" to maintain balance integrity
            }]);
            if (insertErr) throw insertErr;

            // V2 Accounting: Manual counter-entry sync
            await this.addV2Transaction({
                userId,
                personId: entry.person_id,
                amount: Math.abs(amount),
                type: 'paid',
                direction: amount > 0 ? 'in' : 'out', // Match the positive balancing direction
                description: 'Quick settle (counter-entry)',
                paymentFor: 'Payment',
                paidAt: now
            });
        } else {
            // Order-linked entry: mark as settled
            const { error: updateErr } = await supabase
                .from('ledger')
                .update({ is_settled: true, settled_at: now })
                .eq('id', id);
            if (updateErr) throw updateErr;

            // V2 Accounting: Mark corresponding transaction as paid
            await supabase.from('v2_transactions')
                .update({ type: 'paid', paid_at: now })
                .eq('order_id', entry.order_id)
                .eq('person_id', entry.person_id)
                .eq('user_id', userId);
        }
    },

    async settleAllForPerson(personId: string, userId: string): Promise<void> {
        const now = new Date().toISOString();

        // Fetch all unsettled entries for this person
        const { data: unsettled, error: fetchErr } = await supabase
            .from('ledger')
            .select('id, amount, order_id')
            .eq('person_id', personId)
            .eq('is_settled', false);
        if (fetchErr) throw fetchErr;
        if (!unsettled || unsettled.length === 0) return;

        const orderLinked = unsettled.filter((e: any) => !!e.order_id);
        const manual = unsettled.filter((e: any) => !e.order_id);

        // Order-linked entries: just mark as settled (no new entry — order tracks status)
        if (orderLinked.length > 0) {
            const ids = orderLinked.map((e: any) => e.id);
            const { error } = await supabase
                .from('ledger')
                .update({ is_settled: true, settled_at: now })
                .in('id', ids);
            if (error) throw error;

            // V2 Accounting: Mark corresponding transactions as paid
            // We group by order_id to minimize calls
            const orderIds = Array.from(new Set(orderLinked.map((e: any) => e.order_id)));
            await supabase.from('v2_transactions')
                .update({ type: 'paid', paid_at: now })
                .in('order_id', orderIds)
                .eq('person_id', personId)
                .eq('user_id', userId);
        }

        // Manual entries: create a counter balance record
        if (manual.length > 0) {
            const netAmount = manual.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            if (netAmount !== 0) {
                const counterType = netAmount > 0 ? 'PaymentIn' : 'PaymentOut';
                const { error: insertErr } = await supabase.from('ledger').insert([{
                    user_id: userId,
                    person_id: personId,
                    amount: -netAmount,
                    transaction_type: counterType,
                    notes: 'Settlement',
                    is_settled: false,
                }]);
                if (insertErr) throw insertErr;

                // V2 Accounting: Counter-entry sync
                await this.addV2Transaction({
                    userId,
                    personId,
                    amount: Math.abs(netAmount),
                    type: 'paid',
                    direction: netAmount > 0 ? 'in' : 'out', // Counter-entry mirrors the net balance
                    description: 'Settlement (counter-entry)',
                    paymentFor: 'Payment',
                    paidAt: now
                });
            }
            // We do NOT mark original manual entries as settled. 
            // They remain in the history as balanced entries.
        }
    },

    async getDirectoryWithBalances(userId: string): Promise<DirectoryItem[]> {
        const { data: directoryData, error: directoryError } = await supabase
            .from('directory')
            .select('*, v2_ledger:v2_transactions(amount, direction)')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (directoryError) return [];
        return (directoryData || []).map((item: any) => ({
            ...item,
            balance: (item.v2_ledger || [])
                .reduce((acc: number, t: any) => t.direction === 'in' ? acc + Number(t.amount) : acc - Number(t.amount), 0),
            createdAt: new Date(item.created_at).getTime(),
            isActive: item.is_active
        })) as DirectoryItem[];
    },

    async getTransactions(userId: string): Promise<Transaction[]> {
        // 1. Fetch Orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*, customer:directory!customer_id(name), product:directory!product_id(name), vendor:directory!vendor_id(name), pickup_person:directory!pickup_person_id(name)')
            .eq('user_id', userId);

        // 2. Fetch V2 Transactions (Manual Entries)
        const { data: v2Ledger, error: v2Error } = await supabase
            .from('v2_transactions')
            .select('*, person:directory!person_id(name)')
            .eq('user_id', userId)
            .is('order_id', null); // Only fetch manual entries to avoid duplicates with order listings

        if (ordersError) {
            console.error('Error fetching orders for transactions:', ordersError);
        }
        if (v2Error) {
            console.error('Error fetching V2 ledger for transactions:', v2Error);
        }

        const normalizedOrders: Transaction[] = (orders || []).map((o: any) => {
            const { margin, percentage } = calculateMargin(Number(o.original_price), Number(o.selling_price), Number(o.pickup_charges), Number(o.shipping_charges));
            return {
                id: o.id,
                date: o.date,
                type: 'Sale', // Default as Sale for order listing
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
                statusHistory: o.status_history,
                quantity: o.quantity || 1,
                unitOriginalPrice: Number(o.unit_original_price || o.original_price),
                unitSellingPrice: Number(o.unit_selling_price || o.selling_price),
                createdAt: new Date(o.created_at).getTime(),
            };
        });

        const normalizedLedger: Transaction[] = (v2Ledger || []).map((l: any) => {
            // Map transaction mapping to Transaction type
            let type: Transaction['type'] = 'Expense';
            if (l.payment_for === 'Payment') {
                type = 'Payment';
            } else if (l.payment_for === 'Sale') {
                type = 'Sale';
            } else if (l.payment_for === 'Purchase') {
                type = 'Purchase';
            } else if (l.payment_for === 'Reimbursement') {
                type = 'Reimbursement';
            }

            return {
                id: l.id,
                date: l.transaction_date,
                type,
                customerName: (type === 'Payment' || type === 'Sale') && l.person?.name ? l.person?.name : undefined,
                vendorName: (type === 'Payment' || type === 'Purchase') && l.person?.name ? l.person?.name : undefined,
                productName: l.description || 'Manual Entry',
                amount: Number(l.amount),
                notes: l.description,
                createdAt: new Date(l.transaction_time).getTime(),
            };
        });

        // Combine and sort by createdAt descending
        return [...normalizedOrders, ...normalizedLedger].sort((a, b) => b.createdAt - a.createdAt);
    },

    async getDirectory(userId: string): Promise<DirectoryItem[]> {
        const { data, error } = await supabase.from('directory').select('*').eq('user_id', userId).eq('is_active', true).order('name');
        if (error) return [];
        return (data || []).map((item: any) => ({
            ...item,
            createdAt: new Date(item.created_at).getTime(),
            isActive: item.is_active
        })) as DirectoryItem[];
    },

    async saveDirectoryItem(item: Partial<DirectoryItem>, userId: string): Promise<void> {
        const payload = { user_id: userId, name: item.name, type: item.type, address: item.address, phone: item.phone };
        const { error } = item.id ? await supabase.from('directory').update(payload).eq('id', item.id) : await supabase.from('directory').insert([payload]);
        if (error) throw error;
    },

    async softDeleteDirectoryItem(id: string): Promise<void> {
        const { error } = await supabase.from('directory').update({ is_active: false }).eq('id', id);
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
        const currentHistory = Array.isArray(order.status_history) ? order.status_history : [];
        const newHistory = [...currentHistory, {
            status: status as any,
            date: new Date().toISOString()
        }];

        const orderData: Order = {
            id: order.id, userId: order.user_id, date: order.date, productId: order.product_id, productName: order.product?.name || 'Unknown',
            customerId: order.customer_id, customerName: order.customer?.name || 'Unknown', vendorId: order.vendor_id, vendorName: order.vendor?.name || 'Unknown',
            originalPrice: Number(order.original_price), sellingPrice: Number(order.selling_price), margin: Number(order.margin),
            paidByDriver: order.paid_by_driver, pickupPersonId: order.pickup_person_id, pickupPersonName: order.pickup_person?.name,
            trackingId: order.tracking_id, courierName: order.courier_name, pickupCharges: Number(order.pickup_charges), shippingCharges: Number(order.shipping_charges),
            status: status as any,
            notes: order.notes, customerPaymentStatus: order.customer_payment_status, vendorPaymentStatus: order.vendor_payment_status,
            pickupPaymentStatus: order.pickup_payment_status,
            statusHistory: newHistory,
            quantity: order.quantity || 1,
            unitOriginalPrice: Number(order.unit_original_price || order.original_price),
            unitSellingPrice: Number(order.unit_selling_price || order.selling_price),
            createdAt: new Date(order.created_at).getTime(),
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

    // --- Demo Data Seeding ---
    async seedDemoData(userId: string): Promise<void> {
        // 1. Directory Data
        const directory = [
            { name: 'Bombay Selection', type: 'Vendor' },
            { name: 'Laxmithree Sarees', type: 'Vendor' },
            { name: 'Siyaram Fabrics', type: 'Vendor' },
            { name: 'Surat Textiles', type: 'Vendor' },
            { name: 'Anjali Sharma', type: 'Customer' },
            { name: 'Rohan Mehta', type: 'Customer' },
            { name: 'Priya Patel', type: 'Customer' },
            { name: 'Vikram Singh', type: 'Customer' },
            { name: 'Sunita Gupta', type: 'Customer' },
            { name: 'Silk Saree', type: 'Product' },
            { name: 'Cotton Kurti', type: 'Product' },
            { name: 'Designer Lehenga', type: 'Product' },
            { name: 'Men’s Suit', type: 'Product' },
            { name: 'Dupatta Set', type: 'Product' },
            { name: 'Bridal Gown', type: 'Product' },
            { name: 'Rahul Express', type: 'Pickup Person' },
            { name: 'Suresh Delivery', type: 'Pickup Person' },
            { name: 'Metro Pickup', type: 'Pickup Person' },
        ];

        const { data: createdItems, error: dirError } = await supabase
            .from('directory')
            .upsert(directory.map(item => ({ ...item, user_id: userId })), { onConflict: 'user_id,name,type' })
            .select();

        if (dirError) throw dirError;

        const getItems = (type: string) => (createdItems || []).filter((i: any) => i.type === type);
        const vendors = getItems('Vendor');
        const customers = getItems('Customer');
        const products = getItems('Product');
        const pickups = getItems('Pickup Person');

        // 2. Orders Data (Generate 10 realistic orders)
        const statuses: OrderStatus[] = ['Pending', 'Booked', 'Shipped', 'Delivered'];
        const paymentStatuses: ('Paid' | 'Udhar')[] = ['Paid', 'Udhar'];

        for (let i = 0; i < 15; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const vendor = vendors[Math.floor(Math.random() * vendors.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Dates within last 2 weeks
            const d = new Date();
            d.setDate(d.getDate() - Math.floor(Math.random() * 14));
            const dateStr = d.toLocaleDateString('en-GB');

            const originalPrice = 2000 + Math.floor(Math.random() * 5000);
            const sellingPrice = originalPrice + 500 + Math.floor(Math.random() * 2000);

            const hasPickup = Math.random() > 0.3;
            const pickup = hasPickup ? pickups[Math.floor(Math.random() * pickups.length)] : null;
            const pickupCharges = hasPickup ? 50 + Math.floor(Math.random() * 100) : 0;
            const shippingCharges = 100 + Math.floor(Math.random() * 200);

            const order: Partial<Order> = {
                date: dateStr,
                productId: product.id,
                productName: product.name,
                customerId: customer.id,
                customerName: customer.name,
                vendorId: vendor.id,
                vendorName: vendor.name,
                originalPrice,
                sellingPrice,
                status,
                customerPaymentStatus: paymentStatuses[Math.floor(Math.random() * 2)],
                vendorPaymentStatus: paymentStatuses[Math.floor(Math.random() * 2)],
                pickupPersonId: pickup?.id,
                pickupPersonName: pickup?.name,
                pickupCharges,
                shippingCharges,
                pickupPaymentStatus: 'Paid',
                notes: `System generated demo order #${i + 1}`,
                courierName: status !== 'Pending' ? 'Delhivery' : '',
                trackingId: status !== 'Pending' ? `AWB${Math.floor(100000 + Math.random() * 900000)}` : '',
            };

            await this.saveOrder(order, userId);
        }
    },

    // --- Expense Services ---
    async getExpenses(userId: string): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching expenses:', error);
            return [];
        }
        return (data || []).map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            date: item.date,
            title: item.title,
            amount: Number(item.amount),
            category: item.category || 'Other',
            notes: item.notes,
            createdAt: new Date(item.created_at).getTime(),
        })) as Expense[];
    },

    async saveExpense(expense: Partial<Expense>, userId: string): Promise<void> {
        const payload = {
            user_id: userId,
            date: expense.date,
            title: expense.title,
            amount: expense.amount,
            category: expense.category || 'Other',
            notes: expense.notes || null,
        };
        if (expense.id) {
            const { error } = await supabase.from('expenses').update(payload).eq('id', expense.id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
            if (error) throw error;
            expense.id = data.id;
        }

        // V2 Accounting: Business Expense is a manual "out" payment
        // Remove existing if update, then re-insert to ensure sync
        await supabase.from('v2_transactions').delete().eq('expense_id', expense.id);

        await this.addV2Transaction({
            userId,
            personId: '', // No specific person for general business expenses
            amount: Number(expense.amount),
            type: 'paid',
            direction: 'out',
            description: `Expense: ${expense.title}`,
            paymentFor: 'Expense',
            expenseId: expense.id,
            paidAt: new Date().toISOString()
        });
    },

    async deleteExpense(id: string): Promise<void> {
        // 1. Delete associated V2 transaction first (referential integrity or just cleanup)
        await supabase.from('v2_transactions').delete().eq('expense_id', id);

        // 2. Delete the expense record
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
    },

    async getExpensesForPeriod(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching expenses for period:', error);
            return [];
        }
        return (data || []).map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            date: item.date,
            title: item.title,
            amount: Number(item.amount),
            category: item.category || 'Other',
            notes: item.notes,
            createdAt: new Date(item.created_at).getTime(),
        })) as Expense[];
    },

    // --- Accounting v2 Services ---
    async addV2Transaction(data: {
        userId: string,
        personId: string,
        amount: number,
        type: 'paid' | 'due',
        direction: 'in' | 'out',
        date?: string,
        description?: string,
        paymentFor?: string,
        orderId?: string,
        expenseId?: string,
        paidAt?: string,
        metadata?: any
    }) {
        const { error } = await supabase
            .from('v2_transactions')
            .insert([{
                user_id: data.userId,
                person_id: data.personId,
                amount: data.amount,
                type: data.type,
                direction: data.direction,
                transaction_date: data.date || new Date().toISOString().split('T')[0],
                description: data.description,
                payment_for: data.paymentFor,
                order_id: data.orderId,
                expense_id: data.expenseId,
                paid_at: data.paidAt,
                metadata: data.metadata || {}
            }]);
        if (error) throw error;
    },

    async getV2Transactions(userId: string) {
        const { data, error } = await supabase
            .from('v2_transactions')
            .select('*, person:directory!person_id(name)')
            .eq('user_id', userId)
            .order('transaction_time', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getV2LedgerByPerson(personId: string): Promise<LedgerEntry[]> {
        const { data, error } = await supabase
            .from('v2_transactions')
            .select('*')
            .eq('person_id', personId)
            .order('transaction_time', { ascending: false });
        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            orderId: item.order_id,
            personId: item.person_id,
            amount: item.direction === 'in' ? Number(item.amount) : -Number(item.amount),
            transactionType: (item.payment_for === 'Sale' ? 'Sale' :
                item.payment_for === 'Purchase' ? 'Purchase' :
                    item.payment_for === 'Reimbursement' ? 'Reimbursement' :
                        item.payment_for === 'Expense' ? 'Expense' :
                            item.direction === 'in' ? 'PaymentIn' : 'PaymentOut') as any,
            notes: item.description,
            orderProductName: item.metadata?.product_name,
            createdAt: new Date(item.transaction_time).getTime(),
            isSettled: item.type === 'paid',
            settledAt: item.paid_at ? new Date(item.paid_at).getTime() : undefined,
        }));
    },

    async getV2LedgerByOrder(orderId: string): Promise<(LedgerEntry & { personName?: string })[]> {
        const { data, error } = await supabase
            .from('v2_transactions')
            .select('*, person:directory!person_id(name)')
            .eq('order_id', orderId)
            .order('transaction_time', { ascending: true });
        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            orderId: item.order_id,
            personId: item.person_id,
            personName: item.person?.name,
            amount: item.direction === 'in' ? Number(item.amount) : -Number(item.amount),
            transactionType: (item.payment_for === 'Sale' ? 'Sale' :
                item.payment_for === 'Purchase' ? 'Purchase' :
                    item.payment_for === 'Reimbursement' ? 'Reimbursement' :
                        item.payment_for === 'Expense' ? 'Expense' :
                            item.direction === 'in' ? 'PaymentIn' : 'PaymentOut') as any,
            notes: item.description,
            createdAt: new Date(item.transaction_time).getTime(),
            isSettled: item.type === 'paid',
            settledAt: item.paid_at ? new Date(item.paid_at).getTime() : undefined,
        }));
    },
};
