import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { useTransactions } from '../hooks/useTransactions';
import { Wallet, Clock, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../utils/cn';

type UdharTab = 'RECEIVE' | 'PAY';

export default function Udhar() {
    const { transactions, loading, refresh, updatePaymentStatus, stats } = useTransactions();
    const [activeTab, setActiveTab] = useState<UdharTab>('RECEIVE');
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{ visible: boolean, id: string, vendor: string, customer: string, target?: 'vendor' | 'pickup' }>({
        visible: false, id: '', vendor: '', customer: '', target: 'vendor'
    });
    const [successVisible, setSuccessVisible] = useState(false);

    const allReceivables = transactions.filter(t => t.customerPaymentStatus === 'Udhar');
    const allPayables = transactions.filter(t => t.vendorPaymentStatus === 'Udhar' || (t.paidByDriver && t.pickupPaymentStatus === 'Udhar'));

    const filteredReceivables = allReceivables.filter(t =>
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredPayables = allPayables.filter(t =>
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.pickupPersonName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentList = activeTab === 'RECEIVE' ? filteredReceivables : filteredPayables;
    const currentTotal = activeTab === 'RECEIVE'
        ? stats.receivableUdhar
        : allPayables.reduce((acc, t) => acc + (t.paidByDriver && t.pickupPaymentStatus === 'Udhar' ? t.originalPrice : (t.vendorPaymentStatus === 'Udhar' ? t.originalPrice : 0)), 0);

    const handleMarkAsPaid = (item: any) => {
        const isDriverPayment = activeTab === 'PAY' && item.paidByDriver && item.pickupPaymentStatus === 'Udhar';
        setConfirmDialog({
            visible: true,
            id: item.id,
            vendor: isDriverPayment ? (item.pickupPersonName || 'Driver') : item.vendorName,
            customer: item.customerName,
            target: isDriverPayment ? 'pickup' : 'vendor'
        });
    };

    const onConfirmPayment = async () => {
        const { id, target } = confirmDialog;
        await updatePaymentStatus(id, activeTab === 'RECEIVE' ? 'customer' : (target || 'vendor'), 'Paid');
        setConfirmDialog({ ...confirmDialog, visible: false });
        setSuccessVisible(true);
    };

    const renderHeader = () => (
        <View className="py-4">
            {/* Tabs */}
            <View className="flex-row bg-white/10 border border-white/20 p-1 rounded-2xl mt-2">
                <TouchableOpacity
                    onPress={() => {
                        setActiveTab('RECEIVE');
                        setSearchQuery('');
                    }}
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
                    onPress={() => {
                        setActiveTab('PAY');
                        setSearchQuery('');
                    }}
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

            {/* Search Bar (Moved under tabs) */}
            <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mt-4">
                <Search size={20} color="#94a3b8" />
                <TextInput
                    placeholder="Search by name..."
                    placeholderTextColor="#64748b"
                    className="flex-1 ml-3 text-white font-sans"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Total Outstanding for Current Tab */}
            <GlassCard
                blur={false}
                className={cn(
                    "mt-6 py-6 border-2",
                    activeTab === 'RECEIVE' ? "bg-emerald-500/15 border-emerald-500/40" : "bg-orange-500/15 border-orange-500/40"
                )}
            >
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
    );

    return (
        <Background>
            <View className="flex-1">
                <FlatList
                    data={currentList}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
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
                        <GlassCard className="mb-4" blur={false}>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <Text className="text-white font-sans-bold text-base" numberOfLines={1}>
                                            {activeTab === 'RECEIVE'
                                                ? item.customerName
                                                : (item.paidByDriver && item.pickupPaymentStatus === 'Udhar'
                                                    ? item.pickupPersonName
                                                    : item.vendorName)}
                                        </Text>
                                        <View className="bg-white/10 px-1.5 py-0.5 rounded">
                                            <Text className="text-gray-400 text-[8px] font-sans-bold">
                                                {activeTab === 'RECEIVE'
                                                    ? 'CUSTOMER'
                                                    : (item.paidByDriver && item.pickupPaymentStatus === 'Udhar' ? 'DRIVER' : 'VENDOR')}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-400 font-sans text-xs" numberOfLines={1}>
                                        {item.productName} • {activeTab === 'RECEIVE'
                                            ? item.vendorName
                                            : (item.paidByDriver && item.pickupPaymentStatus === 'Udhar' ? `FOR Shop: ${item.vendorName}` : item.customerName)}
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
                                        onPress={() => handleMarkAsPaid(item)}
                                        className={cn(
                                            "mt-3 px-4 py-2 rounded-xl border active:opacity-70",
                                            activeTab === 'RECEIVE' ? "bg-emerald-500/20 border-emerald-500/30" : "bg-orange-500/20 border-orange-500/30"
                                        )}
                                    >
                                        <Text className="text-white font-sans-bold text-xs">
                                            {activeTab === 'RECEIVE' ? 'Collect' : (item.paidByDriver && item.pickupPaymentStatus === 'Udhar' ? 'Pay Driver' : 'Mark Paid')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </GlassCard>
                    )}
                />
            </View>

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


