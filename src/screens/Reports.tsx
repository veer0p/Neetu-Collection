import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { BentoGrid, BentoItem } from '../components/BentoGrid';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { Package, Users, TrendingUp, DollarSign, Calendar, ChevronRight } from 'lucide-react-native';
import { cn } from '../utils/cn';
import { Transaction } from '../utils/types';

export default function Reports() {
    const { userId } = useTransactions();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const data = await supabaseService.getTransactions(userId);
            setTransactions(data);
        } catch (error) {
            console.error('Error loading reports data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    // Analytics Logic
    const totalRevenue = transactions.reduce((acc, t) => acc + t.sellingPrice, 0);
    const totalProfit = transactions.reduce((acc, t) => acc + t.margin, 0);
    const avgMargin = transactions.length > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top Products
    const productStats = transactions.reduce((acc, t) => {
        if (!acc[t.productName]) acc[t.productName] = { count: 0, profit: 0 };
        acc[t.productName].count++;
        acc[t.productName].profit += t.margin;
        return acc;
    }, {} as Record<string, { count: number, profit: number }>);

    const topProducts = Object.entries(productStats)
        .map(([name, stat]) => ({ name, ...stat }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    // Top Customers
    const customerStats = transactions.reduce((acc, t) => {
        if (!acc[t.customerName]) acc[t.customerName] = { revenue: 0, count: 0 };
        acc[t.customerName].revenue += t.sellingPrice;
        acc[t.customerName].count++;
        return acc;
    }, {} as Record<string, { revenue: number, count: number }>);

    const topCustomers = Object.entries(customerStats)
        .map(([name, stat]) => ({ name, ...stat }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 border-b border-white/5 bg-slate-900/50">
                    <Text className="text-white font-sans-bold text-2xl">Financial Reports</Text>
                    <Text className="text-gray-400 font-sans text-xs mt-1">Deep analysis of your collection business</Text>
                </View>

                <ScrollView
                    className="flex-1 px-6 pt-6"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#6366f1" />
                    }
                >
                    {loading && !refreshing ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color="#6366f1" size="large" />
                        </View>
                    ) : (
                        <>
                            {/* Key Metrics Bento */}
                            <BentoGrid>
                                <BentoItem
                                    title="Avg. Margin"
                                    value={`${avgMargin.toFixed(1)}%`}
                                    icon={<TrendingUp color="#34d399" size={24} />}
                                    className="col-span-1"
                                />
                                <BentoItem
                                    title="Profit/Order"
                                    value={`₹${(transactions.length ? totalProfit / transactions.length : 0).toFixed(0)}`}
                                    icon={<DollarSign color="#818cf8" size={24} />}
                                    className="col-span-1"
                                />
                            </BentoGrid>

                            {/* Top Products Section */}
                            <View className="mt-8">
                                <View className="flex-row justify-between items-end mb-4">
                                    <View className="flex-row items-center">
                                        <Package size={20} color="#818cf8" className="mr-2" />
                                        <Text className="text-white font-sans-bold text-lg">Most Profitable Items</Text>
                                    </View>
                                </View>
                                <GlassCard className="bg-white/5 border-white/5 p-4">
                                    {topProducts.map((p, i) => (
                                        <View key={p.name} className={cn("flex-row items-center py-3", i !== 0 && "border-t border-white/5")}>
                                            <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                                                <Text className="text-indigo-300 font-sans-bold text-xs">{i + 1}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-sans-bold text-sm">{p.name}</Text>
                                                <Text className="text-gray-500 font-sans text-[10px]">{p.count} sales</Text>
                                            </View>
                                            <Text className="text-emerald-400 font-sans-bold text-sm">+₹{p.profit.toLocaleString()}</Text>
                                        </View>
                                    ))}
                                    {topProducts.length === 0 && (
                                        <Text className="text-gray-500 text-center py-4">No data available</Text>
                                    )}
                                </GlassCard>
                            </View>

                            {/* Best Customers */}
                            <View className="mt-8 mb-10">
                                <View className="flex-row justify-between items-end mb-4">
                                    <View className="flex-row items-center">
                                        <Users size={20} color="#34d399" className="mr-2" />
                                        <Text className="text-white font-sans-bold text-lg">Valuable Customers</Text>
                                    </View>
                                </View>
                                <GlassCard className="bg-white/5 border-white/5 p-4">
                                    {topCustomers.map((c, i) => (
                                        <View key={c.name} className={cn("flex-row items-center py-3", i !== 0 && "border-t border-white/5")}>
                                            <View className="flex-1">
                                                <Text className="text-white font-sans-bold text-sm">{c.name}</Text>
                                                <Text className="text-gray-500 font-sans text-[10px]">{c.count} orders placed</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-white font-sans-medium text-sm">₹{c.revenue.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    ))}
                                    {topCustomers.length === 0 && (
                                        <Text className="text-gray-500 text-center py-4">No data available</Text>
                                    )}
                                </GlassCard>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
