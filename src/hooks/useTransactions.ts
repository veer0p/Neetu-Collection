import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../utils/types';
import { supabaseService } from '../store/supabaseService';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
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
        const data = await supabaseService.getTransactions(currentUserId as string);
        setTransactions(data);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const addTransaction = async (transaction: Transaction) => {
        if (!userId) return;
        await supabaseService.addTransaction(transaction, userId);
        await fetchTransactions();
    };

    const updatePaymentStatus = async (id: string, target: 'vendor' | 'customer', status: 'Paid' | 'Udhar') => {
        await supabaseService.updateTransaction(id, target, status);
        await fetchTransactions();
    };

    const stats = {
        totalRevenue: transactions.reduce((acc, t) => acc + t.sellingPrice, 0),
        totalProfit: transactions.reduce((acc, t) => acc + t.margin, 0),
        totalPurchaseCosts: transactions.reduce((acc, t) => acc + t.originalPrice, 0),

        // Receivables (Customer owes you)
        receivableUdhar: transactions
            .filter(t => t.customerPaymentStatus === 'Udhar')
            .reduce((acc, t) => acc + t.sellingPrice, 0),
        receivableCount: transactions.filter(t => t.customerPaymentStatus === 'Udhar').length,

        // Payables (You owe vendor)
        payableUdhar: transactions
            .filter(t => t.vendorPaymentStatus === 'Udhar')
            .reduce((acc, t) => acc + t.originalPrice, 0),
        payableCount: transactions.filter(t => t.vendorPaymentStatus === 'Udhar').length,

        netCashPosition: 0,
        totalOrders: transactions.length,
    };

    stats.netCashPosition = stats.receivableUdhar - stats.payableUdhar;

    return {
        transactions,
        loading,
        userId,
        stats,
        addTransaction,
        updatePaymentStatus,
        refresh: fetchTransactions,
    };
};
