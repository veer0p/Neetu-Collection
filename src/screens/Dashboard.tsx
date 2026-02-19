import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import {
    AlertTriangle, ChevronRight, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownLeft, Wallet, BarChart3, Package,
} from 'lucide-react-native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
        thisMonthProfit: 0,
        totalOrders: 0,
        thisWeekOrders: 0,
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
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const activeTransactions = transactions.filter((t: any) => t.status !== 'Canceled');

            const thisWeekOrders = activeTransactions.filter((t: any) => {
                const d = parseDate(t.date);
                return d >= thisWeekStart;
            });
            const lastWeekOrders = activeTransactions.filter((t: any) => {
                const d = parseDate(t.date);
                return d >= lastWeekStart && d < thisWeekStart;
            });
            const thisMonthOrders = activeTransactions.filter((t: any) => {
                const d = parseDate(t.date);
                return d >= thisMonthStart;
            });

            const thisWeekProfit = thisWeekOrders.reduce((s: number, t: any) => s + (Number(t.margin) || 0), 0);
            const lastWeekProfit = lastWeekOrders.reduce((s: number, t: any) => s + (Number(t.margin) || 0), 0);
            const thisMonthProfit = thisMonthOrders.reduce((s: number, t: any) => s + (Number(t.margin) || 0), 0);

            // Alerts
            const alerts: { message: string }[] = [];
            const oldPending = activeTransactions.filter((t: any) => {
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
            const recentOrders = activeTransactions
                .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, 5)
                .map((t: any) => ({
                    ...t,
                    product: t.productName,
                    customer: t.customerName,
                    amount: t.sellingPrice,
                    payment: t.customerPaymentStatus,
                }));

            setStats({
                netPosition: receivable - payable,
                receivable,
                payable,
                receivableCount: receivableAccounts.length,
                payableCount: payableAccounts.length,
                thisWeekProfit,
                lastWeekProfit,
                thisMonthProfit,
                totalOrders: activeTransactions.length,
                thisWeekOrders: thisWeekOrders.length,
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

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

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
                        <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">{greeting()}</Text>
                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mt-0.5">{user?.name || 'there'} 👋</Text>
                    </View>

                    {loading && !refreshing ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" />
                        </View>
                    ) : (
                        <View className="px-6">
                            {/* Hero Profit Card - Refined Solid Minimalist UI */}
                            <View style={{
                                borderRadius: 24,
                                backgroundColor: isDark ? '#1E293B' : '#4F46E5',
                                marginBottom: 20,
                                padding: 24,
                                shadowColor: isDark ? '#000' : '#4F46E5',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: isDark ? 0.3 : 0.2,
                                shadowRadius: 20,
                                elevation: 12,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                            }}>
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                                        Monthly Profit
                                    </Text>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                                            {stats.totalOrders} {stats.totalOrders === 1 ? 'Order' : 'Orders'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ color: '#FFFFFF', fontSize: 44, fontFamily: 'PlusJakartaSans_800ExtraBold', marginBottom: 4, letterSpacing: -0.5 }}>
                                    ₹{stats.thisMonthProfit.toLocaleString()}
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                                    {weekChange !== 0 && (
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: weekChange > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: 10,
                                            marginRight: 10,
                                        }}>
                                            {weekChange > 0
                                                ? <TrendingUp size={14} color="#34D399" />
                                                : <TrendingDown size={14} color="#F87171" />
                                            }
                                            <Text style={{ color: weekChange > 0 ? '#34D399' : '#F87171', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', marginLeft: 4 }}>
                                                {weekChange > 0 ? '+' : ''}{weekChange}%
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>
                                        ₹{stats.thisWeekProfit.toLocaleString()} this week
                                    </Text>
                                </View>
                            </View>

                            {/* Quick Stats */}
                            <View className="flex-row gap-3 mb-4">
                                <TouchableOpacity
                                    className="flex-1"
                                    onPress={() => navigation.navigate('Ledger')}
                                    activeOpacity={0.7}
                                >
                                    <Card className="p-4">
                                        <View className="flex-row items-center mb-2">
                                            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                                <ArrowDownLeft size={16} color={isDark ? '#34D399' : '#10B981'} />
                                            </View>
                                        </View>
                                        <Text className="text-success font-sans-bold text-xl">₹{stats.receivable.toLocaleString()}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[11px] mt-1">{stats.receivableCount} people owe you</Text>
                                    </Card>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1"
                                    onPress={() => navigation.navigate('Ledger')}
                                    activeOpacity={0.7}
                                >
                                    <Card className="p-4">
                                        <View className="flex-row items-center mb-2">
                                            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                                <ArrowUpRight size={16} color={isDark ? '#F87171' : '#EF4444'} />
                                            </View>
                                        </View>
                                        <Text className="text-danger font-sans-bold text-xl">₹{stats.payable.toLocaleString()}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[11px] mt-1">You owe {stats.payableCount} vendors</Text>
                                    </Card>
                                </TouchableOpacity>
                            </View>

                            {/* Net Position */}
                            <TouchableOpacity onPress={() => navigation.navigate('Ledger')} activeOpacity={0.7}>
                                <Card className="mb-4 p-4 flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Wallet size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                                        </View>
                                        <View>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Net Position</Text>
                                            <Text className={cn(
                                                "font-sans-bold text-lg",
                                                stats.netPosition >= 0 ? "text-success" : "text-danger"
                                            )}>
                                                ₹{Math.abs(stats.netPosition).toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className={cn("font-sans text-xs mr-1", stats.netPosition >= 0 ? "text-success" : "text-danger")}>
                                            {stats.netPosition >= 0 ? 'Net positive' : 'Net negative'}
                                        </Text>
                                        <ChevronRight size={14} color={isDark ? '#94A3B8' : '#9CA3AF'} />
                                    </View>
                                </Card>
                            </TouchableOpacity>

                            {/* Alerts */}
                            {stats.alerts.length > 0 && (
                                <View className="mb-4">
                                    <View className="flex-row items-center mb-2">
                                        <AlertTriangle size={16} color={isDark ? '#FBBF24' : '#F59E0B'} />
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm ml-2">Needs Attention</Text>
                                    </View>
                                    <Card className="p-4">
                                        {stats.alerts.map((a, i) => (
                                            <View key={i} className={cn("flex-row items-center py-2.5", i > 0 && "border-t border-divider dark:border-divider-dark")}>
                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? '#FBBF24' : '#F59E0B', marginRight: 12 }} />
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
                                        <TouchableOpacity onPress={() => navigation.navigate('Orders')} className="flex-row items-center">
                                            <Text className="text-accent dark:text-accent-dark font-sans-semibold text-xs mr-1">See all</Text>
                                            <ChevronRight size={14} color={isDark ? '#818CF8' : '#4F46E5'} />
                                        </TouchableOpacity>
                                    </View>
                                    <Card className="px-4 py-0">
                                        {stats.recentOrders.map((order, i) => (
                                            <TouchableOpacity
                                                key={order.id}
                                                onPress={() => navigation.navigate('OrderDetail', { order: order })}
                                                className={cn("flex-row items-center py-3.5", i > 0 && "border-t border-divider dark:border-divider-dark")}
                                            >
                                                <View style={{
                                                    width: 36, height: 36, borderRadius: 10,
                                                    backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(79,70,229,0.08)',
                                                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                                                }}>
                                                    <Package size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                                                </View>
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
                                                        "font-sans-semibold text-[10px] px-2.5 py-1 rounded-full overflow-hidden",
                                                        order.status === 'Delivered' ? "bg-success/10 text-success" :
                                                            order.status === 'Shipped' ? "bg-accent/10 text-accent" :
                                                                order.status === 'Booked' ? "bg-warning/10 text-warning" :
                                                                    "bg-secondary/10 text-secondary"
                                                    )}>{order.status}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </Card>
                                </View>
                            )}

                            {/* Quick Actions */}
                            <View className="mb-4">
                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm mb-2">Quick Actions</Text>
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Add')}
                                        className="flex-1"
                                        activeOpacity={0.7}
                                    >
                                        <Card className="p-4 items-center">
                                            <View style={{
                                                width: 44, height: 44, borderRadius: 14,
                                                backgroundColor: isDark ? '#818CF8' : '#4F46E5',
                                                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                                            }}>
                                                <Package size={20} color="#FFFFFF" />
                                            </View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-xs">New Order</Text>
                                        </Card>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Ledger')}
                                        className="flex-1"
                                        activeOpacity={0.7}
                                    >
                                        <Card className="p-4 items-center">
                                            <View style={{
                                                width: 44, height: 44, borderRadius: 14,
                                                backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.1)',
                                                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                                            }}>
                                                <Wallet size={20} color={isDark ? '#34D399' : '#10B981'} />
                                            </View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-xs">Ledger</Text>
                                        </Card>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Insights')}
                                        className="flex-1"
                                        activeOpacity={0.7}
                                    >
                                        <Card className="p-4 items-center">
                                            <View style={{
                                                width: 44, height: 44, borderRadius: 14,
                                                backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.1)',
                                                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                                            }}>
                                                <BarChart3 size={20} color={isDark ? '#FBBF24' : '#F59E0B'} />
                                            </View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-xs">Insights</Text>
                                        </Card>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
