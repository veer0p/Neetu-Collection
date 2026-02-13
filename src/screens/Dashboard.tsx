import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { BentoGrid, BentoItem } from '../components/BentoGrid';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { IndianRupee, ShoppingBag, CreditCard, TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle, Menu, RefreshCw } from 'lucide-react-native';
import { cn } from '../utils/cn';

export default function Dashboard({ onLogout, user, navigation }: { onLogout: () => void, user: any, navigation: any }) {
    const { userId } = useTransactions();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        receivable: 0,
        payable: 0,
        orderCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [directory, transactions] = await Promise.all([
                supabaseService.getDirectoryWithBalances(userId),
                supabaseService.getTransactions(userId)
            ]);

            const receivable = directory.reduce((acc, item) => ((item as any).balance || 0) > 0 ? acc + (item as any).balance : acc, 0);
            const payable = Math.abs(directory.reduce((acc, item) => ((item as any).balance || 0) < 0 ? acc + (item as any).balance : acc, 0));
            const totalSales = transactions.reduce((acc, t) => acc + t.sellingPrice, 0);
            const totalProfit = transactions.reduce((acc, t) => acc + t.margin, 0);

            setStats({
                totalSales,
                totalProfit,
                receivable,
                payable,
                orderCount: transactions.length
            });
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [userId]);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 font-sans text-sm">Welcome back,</Text>
                        <Text className="text-white font-sans-bold text-2xl">{user?.name || 'Admin'}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation?.openDrawer()}
                        className="p-3 bg-white/10 rounded-2xl border border-white/10"
                    >
                        <Menu color="white" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                >
                    {loading && !refreshing ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color="#6366f1" size="large" />
                        </View>
                    ) : (
                        <>
                            {/* Primary Profit Card */}
                            <View className="mb-6">
                                <GlassCard className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-indigo-500/30 p-6">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-indigo-200 font-sans-bold text-sm uppercase tracking-widest">Net Profit</Text>
                                        <View className="p-2 bg-indigo-500/20 rounded-xl">
                                            <TrendingUp color="#818cf8" size={20} />
                                        </View>
                                    </View>
                                    <Text className="text-white font-sans-bold text-4xl mb-1">₹{stats.totalProfit.toLocaleString()}</Text>
                                    <Text className="text-indigo-300 font-sans text-xs">Total earnings across {stats.orderCount} orders</Text>
                                </GlassCard>
                            </View>

                            {/* Bento Grid Stats */}
                            <BentoGrid>
                                <BentoItem
                                    title="Total Sales"
                                    value={`₹${stats.totalSales.toLocaleString()}`}
                                    icon={<ShoppingBag color="#34d399" size={24} />}
                                    trend="+12%"
                                    className="col-span-1"
                                />
                                <BentoItem
                                    title="Receivables"
                                    value={`₹${stats.receivable.toLocaleString()}`}
                                    icon={<ArrowUpCircle color="#fbbf24" size={24} />}
                                    description="Customers owe you"
                                    className="col-span-1"
                                />
                                <BentoItem
                                    title="Payables"
                                    value={`₹${stats.payable.toLocaleString()}`}
                                    icon={<ArrowDownCircle color="#f87171" size={24} />}
                                    description="You owe vendors"
                                    className="col-span-1"
                                />
                                <BentoItem
                                    title="Active Orders"
                                    value={stats.orderCount.toString()}
                                    icon={<CreditCard color="#60a5fa" size={24} />}
                                    className="col-span-1"
                                />
                            </BentoGrid>

                            {/* Quick Actions / Recent Activity Placeholder */}
                            <View className="mt-8 mb-10">
                                <Text className="text-white font-sans-bold text-lg mb-4">Quick Links</Text>
                                <View className="flex-row gap-4">
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('AddEntry')}
                                        className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5 items-center"
                                    >
                                        <View className="w-12 h-12 bg-indigo-500/20 rounded-2xl items-center justify-center mb-2">
                                            <Wallet color="#818cf8" size={24} />
                                        </View>
                                        <Text className="text-white font-sans-bold text-xs uppercase text-center">New Order</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Accounts')}
                                        className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/5 items-center"
                                    >
                                        <View className="w-12 h-12 bg-emerald-500/20 rounded-2xl items-center justify-center mb-2">
                                            <RefreshCw color="#34d399" size={24} />
                                        </View>
                                        <Text className="text-white font-sans-bold text-xs uppercase text-center">Accounts</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
