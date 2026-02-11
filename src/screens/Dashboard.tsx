import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { BentoGrid, BentoItem } from '../components/BentoGrid';
import { useTransactions } from '../hooks/useTransactions';
import { IndianRupee, ShoppingBag, CreditCard, TrendingUp, Database, ArrowUpCircle, ArrowDownCircle, Wallet, ShoppingCart, LogOut } from 'lucide-react-native';
import { seedDummyData } from '../utils/seed';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Dashboard({ onLogout, user, ...props }: { onLogout: () => void, user: any } & any) {
    const { stats, loading, refresh, transactions, userId } = useTransactions();
    const [seedDialogVisible, setSeedDialogVisible] = useState(false);
    const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);

    const handleLogout = () => {
        setLogoutDialogVisible(true);
    };

    const recentTransactions = transactions.slice(0, 5);

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#6366f1" />
                    }
                >
                    <View className="px-6 py-4 flex-row justify-between items-center">
                        <View>
                            <Text className="text-gray-400 font-sans text-sm">Welcome back,</Text>
                            <Text className="text-white font-sans-bold text-2xl">{user?.name || 'Neetu Collection'}</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity
                                onPress={() => setSeedDialogVisible(true)}
                                className="bg-white/10 p-3 rounded-2xl border border-white/20"
                            >
                                <Database color="#94a3b8" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleLogout}
                                className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20"
                            >
                                <LogOut color="#f87171" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bento Stats */}
                    <BentoGrid className="mt-4">
                        <BentoItem size="full">
                            <GlassCard className="bg-indigo-500/15 border-indigo-500/30">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-indigo-300 font-sans-medium text-sm">Net Cash Position</Text>
                                        <Text className="text-white font-sans-bold text-3xl mt-1">₹{stats.netCashPosition.toLocaleString()}</Text>
                                        <Text className="text-indigo-400/80 font-sans text-xs mt-1">Receivables - Payables</Text>
                                    </View>
                                    <View className="bg-indigo-500/20 p-3 rounded-2xl">
                                        <Wallet color="#818cf8" size={24} />
                                    </View>
                                </View>
                            </GlassCard>
                        </BentoItem>

                        <BentoItem size="md">
                            <GlassCard className="bg-emerald-500/15 border-emerald-500/30">
                                <View className="flex-row items-center gap-1 mb-1">
                                    <ArrowDownCircle size={14} color="#34d399" />
                                    <Text className="text-emerald-300 font-sans-medium text-xs">To Receive</Text>
                                </View>
                                <Text className="text-white font-sans-bold text-xl mt-1">₹{stats.receivableUdhar.toLocaleString()}</Text>
                                <Text className="text-emerald-400/80 font-sans text-[10px] mt-1">{stats.receivableCount} customer udhars</Text>
                            </GlassCard>
                        </BentoItem>

                        <BentoItem size="md">
                            <GlassCard className="bg-orange-500/15 border-orange-500/30">
                                <View className="flex-row items-center gap-1 mb-1">
                                    <ArrowUpCircle size={14} color="#fb923c" />
                                    <Text className="text-orange-300 font-sans-medium text-xs">To Pay</Text>
                                </View>
                                <Text className="text-white font-sans-bold text-xl mt-1">₹{stats.payableUdhar.toLocaleString()}</Text>
                                <Text className="text-orange-400/80 font-sans text-[10px] mt-1">{stats.payableCount} vendor udhars</Text>
                            </GlassCard>
                        </BentoItem>
                    </BentoGrid>

                    <View className="px-6 mt-6 flex-row gap-4">
                        <View className="flex-1 bg-white/10 border border-white/20 p-4 rounded-2xl">
                            <Text className="text-gray-400 font-sans text-xs">Total Sales</Text>
                            <Text className="text-white font-sans-bold text-lg mt-1">₹{stats.totalRevenue.toLocaleString()}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 border border-white/20 p-4 rounded-2xl">
                            <Text className="text-gray-400 font-sans text-xs">Total Profit</Text>
                            <Text className="text-white font-sans-bold text-lg mt-1">₹{stats.totalProfit.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Recent Transactions */}
                    <View className="px-6 mt-8">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white font-sans-bold text-lg">Recent Entries</Text>
                            <Text className="text-indigo-400 font-sans-medium text-sm">See All</Text>
                        </View>

                        {recentTransactions.map((item) => (
                            <GlassCard key={item.id} className="mb-3 px-4 py-3">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="bg-indigo-500/10 p-2 rounded-xl mr-3">
                                            <ShoppingBag color="#818cf8" size={20} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-sans-bold text-sm" numberOfLines={1}>{item.customerName}</Text>
                                            <Text className="text-gray-400 font-sans text-[10px]" numberOfLines={1}>{item.productName} • {item.vendorName}</Text>
                                            <View className="flex-row items-center mt-1 gap-2">
                                                <View className={cn(
                                                    "px-1.5 py-0.5 rounded-md",
                                                    item.vendorPaymentStatus === 'Paid' ? "bg-emerald-500/10" : "bg-orange-500/10"
                                                )}>
                                                    <Text className={cn(
                                                        "text-[7px] font-sans-bold",
                                                        item.vendorPaymentStatus === 'Paid' ? "text-emerald-400" : "text-orange-400"
                                                    )}>V: {(item.vendorPaymentStatus || 'Paid').toUpperCase()}</Text>
                                                </View>
                                                <View className={cn(
                                                    "px-1.5 py-0.5 rounded-md",
                                                    item.customerPaymentStatus === 'Paid' ? "bg-emerald-500/10" : "bg-orange-500/10"
                                                )}>
                                                    <Text className={cn(
                                                        "text-[7px] font-sans-bold",
                                                        item.customerPaymentStatus === 'Paid' ? "text-emerald-400" : "text-orange-400"
                                                    )}>C: {(item.customerPaymentStatus || 'Paid').toUpperCase()}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white font-sans-bold text-sm">₹{item.sellingPrice}</Text>
                                        <Text className="text-emerald-400 font-sans-bold text-[10px] mt-1">₹{item.margin} profit</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        ))}

                        {recentTransactions.length === 0 && (
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-500 font-sans">No transactions yet</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            <ConfirmDialog
                visible={seedDialogVisible}
                title="Seed Dummy Data"
                message="This will add sample transactions and vendors to your app. This is great for testing!"
                confirmText="Seed Data"
                onConfirm={async () => {
                    if (!userId) return;
                    setSeedDialogVisible(false);
                    await seedDummyData(userId);
                    refresh();
                    setSuccessDialogVisible(true);
                }}
                onCancel={() => setSeedDialogVisible(false)}
            />

            <ConfirmDialog
                visible={logoutDialogVisible}
                title="Sign Out"
                message="Are you sure you want to sign out of Neetu Collection?"
                confirmText="Sign Out"
                type="danger"
                onConfirm={() => {
                    setLogoutDialogVisible(false);
                    onLogout();
                }}
                onCancel={() => setLogoutDialogVisible(false)}
            />

            <ConfirmDialog
                visible={successDialogVisible}
                title="Success"
                message="Sample data has been added successfully!"
                confirmText="Great"
                cancelText=""
                onConfirm={() => setSuccessDialogVisible(false)}
                onCancel={() => setSuccessDialogVisible(false)}
            />
        </Background>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
