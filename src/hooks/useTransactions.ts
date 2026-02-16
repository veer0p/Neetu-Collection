import { useState, useEffect, useCallback } from 'react';
import { Transaction, Order, DirectoryItem } from '../utils/types';
import { supabaseService } from '../store/supabaseService';

export const useTransactions = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [accounts, setAccounts] = useState<DirectoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        let currentUserId = userId;
        if (!currentUserId) {
            const user = await supabaseService.getCurrentUser();
            if (!user) {
                setLoading(false);
                return;
            }
            currentUserId = user.id;
            setUserId(currentUserId);
        }

        setLoading(true);
        const [ordersData, accountsData] = await Promise.all([
            supabaseService.getOrders(currentUserId as string),
            supabaseService.getDirectoryWithBalances(currentUserId as string)
        ]);
        setOrders(ordersData);
        setAccounts(accountsData);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = {
        totalRevenue: orders.reduce((acc, t) => acc + t.sellingPrice, 0),
        totalProfit: orders.reduce((acc, t) => acc + t.margin, 0),

        // Receivables (Positive balance)
        receivableUdhar: accounts
            .filter(a => a.balance && a.balance > 0)
            .reduce((acc, a) => acc + (a.balance || 0), 0),
        receivableCount: accounts.filter(a => a.balance && a.balance > 0).length,

        // Payables (Negative balance)
        payableUdhar: Math.abs(accounts
            .filter(a => a.balance && a.balance < 0)
            .reduce((acc, a) => acc + (a.balance || 0), 0)),
        payableCount: accounts.filter(a => a.balance && a.balance < 0).length,

        netCashPosition: accounts.reduce((acc, a) => acc + (a.balance || 0), 0),
        totalOrders: orders.length,
    };

    const updatePaymentStatus = useCallback(async (
        orderId: string,
        target: 'vendor' | 'customer' | 'pickup',
        status: 'Paid' | 'Udhar'
    ) => {
        try {
            await supabaseService.updateOrderPaymentStatus(orderId, target, status);
            await fetchData();
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }, [fetchData]);

    const deleteOrder = useCallback(async (orderId: string) => {
        try {
            await supabaseService.deleteOrder(orderId);
            await fetchData();
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    }, [fetchData]);

    const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
        try {
            await supabaseService.updateOrderStatus(orderId, status);
            await fetchData();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }, [fetchData]);

    return {
        transactions: orders as any, // Cast for legacy component compatibility
        orders,
        accounts,
        loading,
        userId,
        stats,
        refresh: fetchData,
        updatePaymentStatus,
        deleteOrder,
        updateOrderStatus,
    };
};
