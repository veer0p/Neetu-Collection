import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { AlertTriangle, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard({ onLogout, user, navigation }: { onLogout: () => void; user: any; navigation: any }) {
    const { userId } = useTransactions();
    const { isDark } = useTheme();
    const [stats, setStats] = useState({
        netPosition: 0,
        receivable: 0,
        payable: 0,
        receivableCount: 0,
        payableCount: 0,
        thisWeekProfit: 0,
        lastWeekProfit: 0,
        alerts: [] as { message: string }[],
        recentOrders: [] as any[],
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [directory, transactions] = await Promise.all([
                supabaseService.getDirectoryWithBalances(userId),
                supabaseService.getTransactions(userId),
            ]);

            const receivableAccounts = directory.filter((a: any) => a.balance > 0);
            const payableAccounts = directory.filter((a: any) => a.balance < 0);
            const receivable = receivableAccounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
            const payable = Math.abs(payableAccounts.reduce((s: number, a: any) => s + (a.balance || 0), 0));

            const parseDate = (dateStr: string) => {
                const parts = dateStr?.split('/');
                if (parts?.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                return new Date(dateStr);
            };

            const now = new Date();
            const thisWeekStart = new Date(now);
            thisWeekStart.setDate(now.getDate() - now.getDay());
            thisWeekStart.setHours(0, 0, 0, 0);
            const lastWeekStart = new Date(thisWeekStart);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);

            const thisWeekOrders = transactions.filter((t: any) => {
                const d = parseDate(t.date);
                return d >= thisWeekStart && t.status !== 'Canceled';
            });
            const lastWeekOrders = transactions.filter((t: any) => {
                const d = parseDate(t.date);
                return d >= lastWeekStart && d < thisWeekStart && t.status !== 'Canceled';
            });

            const thisWeekProfit = thisWeekOrders.reduce((s: number, t: any) => s + (Number(t.margin) || 0), 0);
            const lastWeekProfit = lastWeekOrders.reduce((s: number, t: any) => s + (Number(t.margin) || 0), 0);

            // Alerts
            const alerts: { message: string }[] = [];
            const oldPending = transactions.filter((t: any) => {
                const d = parseDate(t.date);
                const days = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
                return (t.status === 'Booked' || t.status === 'Shipped') && days > 5;
            });
            if (oldPending.length > 0) {
                alerts.push({ message: `${oldPending.length} order${oldPending.length > 1 ? 's' : ''} undelivered >5 days` });
            }
            const highReceivable = directory.filter((a: any) => a.balance > 10000)
                .sort((a: any, b: any) => b.balance - a.balance)[0];
            if (highReceivable && highReceivable.balance !== undefined) {
                alerts.push({ message: `₹${highReceivable.balance.toLocaleString()} overdue from ${highReceivable.name}` });
            }

            // Recent orders (last 5)
            const recentOrders = transactions
                .filter((t: any) => t.status !== 'Canceled')
                .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, 5)
                .map((t: any) => ({
                    ...t,
                    product: t.productName,
                    customer: t.customerName,
                    amount: t.sellingPrice,
                }));

            setStats({
                netPosition: receivable - payable,
                receivable,
                payable,
                receivableCount: receivableAccounts.length,
                payableCount: payableAccounts.length,
                thisWeekProfit,
                lastWeekProfit,
                alerts,
                recentOrders,
            });
        } catch (e) {
            console.error('Dashboard load error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadStats(); }, [userId]));
    const onRefresh = () => { setRefreshing(true); loadStats(); };

    const weekChange = stats.lastWeekProfit > 0
        ? Math.round(((stats.thisWeekProfit - stats.lastWeekProfit) / stats.lastWeekProfit) * 100)
        : 0;

    const paymentDot = (status: string) => (
        <View className={cn("w-2 h-2 rounded-full", status === 'Paid' ? 'bg-success' : 'bg-warning')} />
    );

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#818CF8' : '#4F46E5'} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Header */}
                    <View className="px-6 pt-4 pb-2">
                        <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">Hi {user?.name || 'there'} 👋</Text>
                    </View>

                    {loading && !refreshing ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" />
                        </View>
                    ) : (
                        <View className="px-6">
                            {/* Net Position Hero */}
                            <Card className="mb-4 p-6">
                                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs uppercase tracking-wider mb-1">Net Position</Text>
                                <Text className={cn(
                                    "font-sans-bold text-4xl",
                                    stats.netPosition >= 0 ? "text-success" : "text-danger"
                                )}>
                                    ₹{Math.abs(stats.netPosition).toLocaleString()}
                                </Text>
                                {stats.netPosition < 0 && (
                                    <Text className="text-danger font-sans text-xs mt-1">You owe more than you're owed</Text>
                                )}

                                {/* Week profit */}
                                <View className="flex-row items-center mt-3 pt-3 border-t border-divider dark:border-divider-dark">
                                    {weekChange !== 0 && (
                                        weekChange > 0
                                            ? <TrendingUp size={14} color={isDark ? '#34D399' : '#10B981'} />
                                            : <TrendingDown size={14} color={isDark ? '#F87171' : '#EF4444'} />
                                    )}
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs ml-1">
                                        ₹{stats.thisWeekProfit.toLocaleString()} profit this week
                                        {weekChange !== 0 && ` (${weekChange > 0 ? '+' : ''}${weekChange}%)`}
                                    </Text>
                                </View>
                            </Card>

                            {/* To Collect / To Pay */}
                            <View className="flex-row gap-3 mb-4">
                                <TouchableOpacity
                                    className="flex-1"
                                    onPress={() => navigation.navigate('Ledger')}
                                >
                                    <Card className="p-4">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mb-1">To Collect</Text>
                                        <Text className="text-success font-sans-bold text-xl">₹{stats.receivable.toLocaleString()}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">{stats.receivableCount} people</Text>
                                    </Card>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1"
                                    onPress={() => navigation.navigate('Ledger')}
                                >
                                    <Card className="p-4">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mb-1">To Pay</Text>
                                        <Text className="text-danger font-sans-bold text-xl">₹{stats.payable.toLocaleString()}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">{stats.payableCount} vendors</Text>
                                    </Card>
                                </TouchableOpacity>
                            </View>

                            {/* Alerts */}
                            {stats.alerts.length > 0 && (
                                <View className="mb-4">
                                    <View className="flex-row items-center mb-2">
                                        <AlertTriangle size={16} color={isDark ? '#FBBF24' : '#F59E0B'} />
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm ml-2">Needs Attention</Text>
                                    </View>
                                    <Card className="p-4">
                                        {stats.alerts.map((a, i) => (
                                            <View key={i} className={cn("flex-row items-center py-2", i > 0 && "border-t border-divider dark:border-divider-dark")}>
                                                <View className="w-1.5 h-1.5 rounded-full bg-warning mr-3" />
                                                <Text className="text-primary dark:text-primary-dark font-sans text-sm flex-1">{a.message}</Text>
                                            </View>
                                        ))}
                                    </Card>
                                </View>
                            )}

                            {/* Recent Orders */}
                            {stats.recentOrders.length > 0 && (
                                <View className="mb-4">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">Recent Orders</Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                                            <Text className="text-accent font-sans-semibold text-xs">See all</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Card className="px-4 py-0">
                                        {stats.recentOrders.map((order, i) => (
                                            <TouchableOpacity
                                                key={order.id}
                                                onPress={() => navigation.navigate('OrderDetail', { order: order })}
                                                className={cn("flex-row items-center py-3", i > 0 && "border-t border-divider dark:border-divider-dark")}
                                            >
                                                <View className="flex-1">
                                                    <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm">{order.product}</Text>
                                                    <View className="flex-row items-center mt-1 gap-2">
                                                        {paymentDot(order.payment)}
                                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{order.customer}</Text>
                                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">•</Text>
                                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">₹{Number(order.amount).toLocaleString()}</Text>
                                                    </View>
                                                </View>
                                                <View className="items-end">
                                                    <Text className={cn(
                                                        "font-sans-semibold text-xs px-2 py-1 rounded-full",
                                                        order.status === 'Delivered' ? "bg-success/10 text-success dark:text-success-dark" :
                                                            order.status === 'Shipped' ? "bg-accent/10 text-accent dark:text-accent-dark" :
                                                                order.status === 'Booked' ? "bg-warning/10 text-warning dark:text-warning-dark" :
                                                                    "bg-secondary/10 text-secondary dark:text-secondary-dark"
                                                    )}>{order.status}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </Card>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
