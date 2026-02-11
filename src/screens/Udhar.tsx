import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { useTransactions } from '../hooks/useTransactions';
import { Wallet, Clock, CheckCircle2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';

type UdharTab = 'RECEIVE' | 'PAY';

export default function Udhar() {
    const { transactions, loading, refresh, updatePaymentStatus, stats } = useTransactions();
    const [activeTab, setActiveTab] = useState<UdharTab>('RECEIVE');
    const [confirmDialog, setConfirmDialog] = useState<{ visible: boolean, id: string, vendor: string, customer: string }>({
        visible: false, id: '', vendor: '', customer: ''
    });
    const [successVisible, setSuccessVisible] = useState(false);

    const receivableList = transactions.filter(t => t.customerPaymentStatus === 'Udhar');
    const payableList = transactions.filter(t => t.vendorPaymentStatus === 'Udhar');

    const currentList = activeTab === 'RECEIVE' ? receivableList : payableList;
    const currentTotal = activeTab === 'RECEIVE' ? stats.receivableUdhar : stats.payableUdhar;

    const handleMarkAsPaid = (id: string, vendor: string, customer: string) => {
        setConfirmDialog({ visible: true, id, vendor, customer });
    };

    const onConfirmPayment = async () => {
        const { id } = confirmDialog;
        await updatePaymentStatus(id, activeTab === 'RECEIVE' ? 'customer' : 'vendor', 'Paid');
        setConfirmDialog({ ...confirmDialog, visible: false });
        setSuccessVisible(true);
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4">
                    <Text className="text-white font-sans-bold text-2xl">Udhar Management</Text>

                    {/* Tabs */}
                    <View className="flex-row bg-white/10 border border-white/20 p-1 rounded-2xl mt-4">
                        <TouchableOpacity
                            onPress={() => setActiveTab('RECEIVE')}
                            className={cn(
                                "flex-1 flex-row py-3 rounded-xl items-center justify-center gap-2",
                                activeTab === 'RECEIVE' ? "bg-emerald-500" : "transparent"
                            )}
                        >
                            <ArrowDownCircle size={16} color={activeTab === 'RECEIVE' ? "white" : "#94a3b8"} />
                            <Text className={cn(
                                "font-sans-bold text-xs",
                                activeTab === 'RECEIVE' ? "text-white" : "text-gray-400"
                            )}>TO RECEIVE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('PAY')}
                            className={cn(
                                "flex-1 flex-row py-3 rounded-xl items-center justify-center gap-2",
                                activeTab === 'PAY' ? "bg-orange-500" : "transparent"
                            )}
                        >
                            <ArrowUpCircle size={16} color={activeTab === 'PAY' ? "white" : "#94a3b8"} />
                            <Text className={cn(
                                "font-sans-bold text-xs",
                                activeTab === 'PAY' ? "text-white" : "text-gray-400"
                            )}>TO PAY</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Total Outstanding for Current Tab */}
                    <GlassCard className={cn(
                        "mt-6 py-6 border-2",
                        activeTab === 'RECEIVE' ? "bg-emerald-500/15 border-emerald-500/40" : "bg-orange-500/15 border-orange-500/40"
                    )}>
                        <View className="items-center">
                            <Text className={cn(
                                "font-sans-medium text-xs uppercase tracking-widest",
                                activeTab === 'RECEIVE' ? "text-emerald-300" : "text-orange-300"
                            )}>
                                {activeTab === 'RECEIVE' ? "Amount to Collect" : "Amount to Pay"}
                            </Text>
                            <Text className="text-white font-sans-bold text-4xl mt-1">₹{currentTotal.toLocaleString()}</Text>
                            <View className={cn(
                                "flex-row items-center mt-2 px-3 py-1 rounded-full",
                                activeTab === 'RECEIVE' ? "bg-emerald-500/20" : "bg-orange-500/20"
                            )}>
                                <Clock size={12} color={activeTab === 'RECEIVE' ? "#34d399" : "#fb923c"} />
                                <Text className={cn(
                                    "font-sans-bold text-[10px] ml-1",
                                    activeTab === 'RECEIVE' ? "text-emerald-400" : "text-orange-400"
                                )}>
                                    {currentList.length} Pending {activeTab === 'RECEIVE' ? 'Collections' : 'Payments'}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </View>

                <FlatList
                    data={currentList}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 }}
                    onRefresh={refresh}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <CheckCircle2 size={48} color="#10b981" opacity={0.5} />
                            <Text className="text-gray-500 font-sans mt-4 text-center">
                                {activeTab === 'RECEIVE' ? "All customer payments collected!" : "All vendor bills paid!"}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <GlassCard className="mb-4">
                            <View className="flex-row justify-between items-center">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <Text className="text-white font-sans-bold text-base" numberOfLines={1}>
                                            {activeTab === 'RECEIVE' ? item.customerName : item.vendorName}
                                        </Text>
                                        <View className="bg-white/10 px-1.5 py-0.5 rounded">
                                            <Text className="text-gray-400 text-[8px] font-sans-bold">
                                                {activeTab === 'RECEIVE' ? 'CUSTOMER' : 'VENDOR'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-400 font-sans text-xs" numberOfLines={1}>
                                        {item.productName} • {activeTab === 'RECEIVE' ? item.vendorName : item.customerName}
                                    </Text>
                                    <View className="flex-row items-center mt-2">
                                        <Clock size={10} color="#64748b" />
                                        <Text className="text-gray-500 font-sans text-[10px] ml-1">Ref: {item.date}</Text>
                                    </View>
                                </View>

                                <View className="items-end">
                                    <Text className={cn(
                                        "font-sans-bold text-xl",
                                        activeTab === 'RECEIVE' ? "text-emerald-400" : "text-orange-400"
                                    )}>₹{activeTab === 'RECEIVE' ? item.sellingPrice : item.originalPrice}</Text>
                                    <TouchableOpacity
                                        onPress={() => handleMarkAsPaid(item.id, item.vendorName, item.customerName)}
                                        className={cn(
                                            "mt-3 px-4 py-2 rounded-xl border active:opacity-70",
                                            activeTab === 'RECEIVE' ? "bg-emerald-500/20 border-emerald-500/30" : "bg-orange-500/20 border-orange-500/30"
                                        )}
                                    >
                                        <Text className="text-white font-sans-bold text-xs">
                                            {activeTab === 'RECEIVE' ? 'Collect' : 'Mark Paid'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </GlassCard>
                    )}
                />
            </SafeAreaView>

            <ConfirmDialog
                visible={confirmDialog.visible}
                title={activeTab === 'RECEIVE' ? 'Confirm Collection' : 'Confirm Payment'}
                message={activeTab === 'RECEIVE'
                    ? `Mark amount from "${confirmDialog.customer}" as collected?`
                    : `Mark amount to "${confirmDialog.vendor}" as paid?`
                }
                confirmText={activeTab === 'RECEIVE' ? 'Collected' : 'Paid'}
                onConfirm={onConfirmPayment}
                onCancel={() => setConfirmDialog({ ...confirmDialog, visible: false })}
            />

            <ConfirmDialog
                visible={successVisible}
                title="Status Updated"
                message="The payment status has been successfully updated in your records."
                confirmText="Great"
                cancelText=""
                onConfirm={() => setSuccessVisible(false)}
                onCancel={() => setSuccessVisible(false)}
            />
        </Background>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
