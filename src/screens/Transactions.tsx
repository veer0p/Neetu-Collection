import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { useTransactions } from '../hooks/useTransactions';
import { Search, Filter, ShoppingBag, Calendar, ShoppingCart, IndianRupee, User, UserPlus, Tag } from 'lucide-react-native';

type StatusFilter = 'All' | 'Customer Udhar' | 'Vendor Udhar' | 'All Paid';

export default function Transactions() {
    const { transactions, loading, refresh } = useTransactions();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

    const filteredTransactions = transactions.filter(item => {
        const matchesSearch =
            item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.trackingId && item.trackingId.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Customer Udhar' && item.customerPaymentStatus === 'Udhar') ||
            (statusFilter === 'Vendor Udhar' && item.vendorPaymentStatus === 'Udhar') ||
            (statusFilter === 'All Paid' && item.customerPaymentStatus === 'Paid' && item.vendorPaymentStatus === 'Paid');

        return matchesSearch && matchesStatus;
    });

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4">
                    <Text className="text-white font-sans-bold text-2xl">Sales History</Text>

                    {/* Search Bar */}
                    <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mt-4">
                        <Search size={20} color="#94a3b8" />
                        <TextInput
                            placeholder="Search customer, vendor, product..."
                            placeholderTextColor="#64748b"
                            className="flex-1 ml-3 text-white font-sans"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filters */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-1">
                        <View className="flex-row items-center px-1">
                            {['All', 'Customer Udhar', 'Vendor Udhar', 'All Paid'].map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => setStatusFilter(s as StatusFilter)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl mr-2 border",
                                        statusFilter === s ? "bg-indigo-500 border-indigo-400" : "bg-white/10 border-white/20"
                                    )}
                                >
                                    <Text className={cn(
                                        "font-sans-medium text-xs",
                                        statusFilter === s ? "text-white" : "text-gray-400"
                                    )}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredTransactions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 }}
                    onRefresh={refresh}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-500 font-sans">No matching entries found</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <GlassCard className="mb-4">
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center mb-1">
                                        <Text className="text-white font-sans-bold text-base" numberOfLines={1}>{item.customerName}</Text>
                                        <View className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded ml-2">
                                            <Text className="text-gray-400 text-[8px] font-sans-bold">Customer</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-400 font-sans text-xs" numberOfLines={1}>{item.productName}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <ShoppingCart size={10} color="#64748b" />
                                        <Text className="text-gray-500 font-sans text-[10px] ml-1">Vendor: {item.vendorName}</Text>
                                    </View>
                                </View>

                                <View className="items-end">
                                    <Text className="text-white font-sans-bold text-lg">₹{item.sellingPrice}</Text>
                                    <Text className="text-emerald-400 font-sans-bold text-[10px] mt-0.5">₹{item.margin} profit</Text>
                                </View>
                            </View>

                            {/* Status Badges Row */}
                            <View className="flex-row gap-3 py-3 border-t border-white/5 mt-1">
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-[8px] font-sans-bold mb-1 uppercase tracking-tighter">Vendor Payment</Text>
                                    <View className={cn(
                                        "px-2 py-1 rounded-lg border flex-row items-center justify-center",
                                        item.vendorPaymentStatus === 'Paid' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-orange-500/10 border-orange-500/20"
                                    )}>
                                        <Text className={cn(
                                            "text-[9px] font-sans-bold",
                                            item.vendorPaymentStatus === 'Paid' ? "text-emerald-400" : "text-orange-400"
                                        )}>{item.vendorPaymentStatus || 'Paid'}</Text>
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-[8px] font-sans-bold mb-1 uppercase tracking-tighter">Customer Payment</Text>
                                    <View className={cn(
                                        "px-2 py-1 rounded-lg border flex-row items-center justify-center",
                                        item.customerPaymentStatus === 'Paid' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-orange-500/10 border-orange-500/20"
                                    )}>
                                        <Text className={cn(
                                            "text-[9px] font-sans-bold",
                                            item.customerPaymentStatus === 'Paid' ? "text-emerald-400" : "text-orange-400"
                                        )}>{item.customerPaymentStatus || 'Paid'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row items-center mt-2 pt-2 border-t border-white/5">
                                <Calendar size={12} color="#64748b" />
                                <Text className="text-gray-500 font-sans text-[10px] ml-1">{item.date}</Text>
                                {item.trackingId && (
                                    <>
                                        <View className="w-[1px] h-2 bg-white/10 mx-3" />
                                        <Tag size={10} color="#64748b" />
                                        <Text className="text-gray-500 font-sans text-[10px] ml-1" numberOfLines={1}>{item.trackingId}</Text>
                                    </>
                                )}
                            </View>
                        </GlassCard>
                    )}
                />
            </SafeAreaView>
        </Background>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
