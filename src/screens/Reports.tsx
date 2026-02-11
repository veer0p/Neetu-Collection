import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { BentoGrid, BentoItem } from '../components/BentoGrid';
import { useTransactions } from '../hooks/useTransactions';
import { Package, Users, ArrowUpCircle, ArrowDownCircle, TrendingUp, Wallet } from 'lucide-react-native';

export default function Reports() {
    const { transactions, stats } = useTransactions();

    // Find top products (now searching all unified transactions)
    const productCounts: Record<string, { count: number, revenue: number }> = {};
    transactions.forEach(t => {
        if (!productCounts[t.productName]) {
            productCounts[t.productName] = { count: 0, revenue: 0 };
        }
        productCounts[t.productName].count += 1;
        productCounts[t.productName].revenue += t.sellingPrice;
    });

    const topProducts = Object.entries(productCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Find best customers
    const customerStats: Record<string, { count: number, spent: number }> = {};
    transactions.forEach(t => {
        if (!customerStats[t.customerName]) {
            customerStats[t.customerName] = { count: 0, spent: 0 };
        }
        customerStats[t.customerName].count += 1;
        customerStats[t.customerName].spent += t.sellingPrice;
    });

    const topCustomers = Object.entries(customerStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

    const marginPercentage = stats.totalRevenue > 0
        ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
        : '0';

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-6 py-4">
                        <Text className="text-white font-sans-bold text-2xl">Business Insights</Text>
                        <Text className="text-gray-400 font-sans text-sm mt-1">Unified performance analytics</Text>
                    </View>

                    {/* Financial Summary */}
                    <View className="px-6 mb-4">
                        <GlassCard className="bg-indigo-500/15 border-indigo-500/30 p-5">
                            <Text className="text-gray-400 font-sans-medium text-xs uppercase tracking-widest mb-4">Net Financial Position</Text>

                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <View className="flex-row items-center mb-1">
                                        <Wallet size={14} color="#818cf8" />
                                        <Text className="text-indigo-200 font-sans-bold text-lg ml-2">₹{stats.netCashPosition.toLocaleString()}</Text>
                                    </View>
                                    <Text className="text-gray-500 font-sans text-[10px]">Net Cash Flow Outstanding</Text>
                                </View>
                                <View className="bg-indigo-500/20 px-3 py-1 rounded-full">
                                    <Text className="text-indigo-300 font-sans-bold text-[10px]">Total Balance</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <ArrowDownCircle size={14} color="#34d399" />
                                    <Text className="text-gray-400 font-sans ml-2">Receivables (Customer)</Text>
                                </View>
                                <Text className="text-emerald-400 font-sans-bold text-sm">₹{stats.receivableUdhar.toLocaleString()}</Text>
                            </View>

                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <ArrowUpCircle size={14} color="#fb923c" />
                                    <Text className="text-gray-400 font-sans ml-2">Payables (Vendor)</Text>
                                </View>
                                <Text className="text-orange-400 font-sans-bold text-sm">₹{stats.payableUdhar.toLocaleString()}</Text>
                            </View>
                        </GlassCard>
                    </View>

                    {/* Key Metrics Bento */}
                    <BentoGrid>
                        <BentoItem size="md">
                            <GlassCard className="bg-emerald-500/15 border-emerald-500/30 py-5">
                                <Text className="text-emerald-300 font-sans-medium text-[10px] uppercase tracking-wider">Gross Profit</Text>
                                <Text className="text-white font-sans-bold text-xl mt-1">₹{stats.totalProfit.toLocaleString()}</Text>
                                <View className="flex-row items-center mt-2">
                                    <TrendingUp size={10} color="#34d399" />
                                    <Text className="text-emerald-400/80 font-sans text-[10px] ml-1">{marginPercentage}% Avg Margin</Text>
                                </View>
                            </GlassCard>
                        </BentoItem>

                        <BentoItem size="md">
                            <GlassCard className="bg-blue-500/15 border-blue-500/30 py-5">
                                <Text className="text-blue-300 font-sans-medium text-[10px] uppercase tracking-wider">Order Volume</Text>
                                <Text className="text-white font-sans-bold text-xl mt-1">{stats.totalOrders}</Text>
                                <Text className="text-blue-400/60 font-sans text-[10px] mt-2">Total Unified Entries</Text>
                            </GlassCard>
                        </BentoItem>
                    </BentoGrid>

                    {/* Top Selling Products */}
                    <View className="px-6 mt-8">
                        <View className="flex-row items-center mb-4">
                            <Package size={20} color="#818cf8" />
                            <Text className="text-white font-sans-bold text-lg ml-2">Top Selling Products</Text>
                        </View>

                        <GlassCard className="p-0 overflow-hidden">
                            {topProducts.map((p, i) => (
                                <View
                                    key={p.name}
                                    className={cn(
                                        "flex-row items-center justify-between p-4",
                                        i < topProducts.length - 1 && "border-b border-white/10"
                                    )}
                                >
                                    <View className="flex-1 mr-4">
                                        <Text className="text-white font-sans-medium text-sm" numberOfLines={1}>{p.name}</Text>
                                        <Text className="text-gray-500 font-sans text-xs mt-0.5">{p.count} units sold</Text>
                                    </View>
                                    <Text className="text-indigo-400 font-sans-bold text-sm">₹{p.revenue.toLocaleString()}</Text>
                                </View>
                            ))}
                            {topProducts.length === 0 && (
                                <View className="py-10 items-center">
                                    <Text className="text-gray-500 font-sans">No product data available</Text>
                                </View>
                            )}
                        </GlassCard>
                    </View>

                    {/* Best Customers */}
                    <View className="px-6 mt-8">
                        <View className="flex-row items-center mb-4">
                            <Users size={20} color="#a855f7" />
                            <Text className="text-white font-sans-bold text-lg ml-2">Best Customers</Text>
                        </View>

                        <GlassCard className="p-0 overflow-hidden">
                            {topCustomers.map((s, i) => (
                                <View
                                    key={s.name}
                                    className={cn(
                                        "flex-row items-center justify-between p-4",
                                        i < topCustomers.length - 1 && "border-b border-white/5"
                                    )}
                                >
                                    <View className="flex-1 mr-4">
                                        <Text className="text-white font-sans-medium text-sm" numberOfLines={1}>{s.name}</Text>
                                        <Text className="text-gray-500 font-sans text-xs mt-0.5">{s.count} orders</Text>
                                    </View>
                                    <Text className="text-purple-400 font-sans-bold text-sm">₹{s.spent.toLocaleString()}</Text>
                                </View>
                            ))}
                            {topCustomers.length === 0 && (
                                <View className="py-10 items-center">
                                    <Text className="text-gray-500 font-sans">No customer data available</Text>
                                </View>
                            )}
                        </GlassCard>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
