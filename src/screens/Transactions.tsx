import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { Search, ChevronRight } from 'lucide-react-native';
import { BottomSheetPicker, PickerOption } from '../components/BottomSheetPicker';

type StatusFilter = 'All' | 'Pending' | 'Booked' | 'Shipped' | 'Delivered' | 'Canceled';

const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

const getDateLabel = (dateStr: string): string => {
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Transactions() {
    const { orders, loading, refresh, updateOrderStatus } = useTransactions();
    const navigation = useNavigation<any>();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

    const statusOptions: PickerOption[] = [
        { label: 'Booked', value: 'Booked', color: '#4F46E5' },
        { label: 'Shipped', value: 'Shipped', color: '#4F46E5' },
        { label: 'Delivered', value: 'Delivered', color: '#10B981' },
        { label: 'Canceled', value: 'Canceled', color: '#EF4444' },
    ];

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try { await updateOrderStatus(orderId, newStatus); }
        catch (e) { console.error('Status update failed:', e); }
        finally { setUpdatingId(null); }
    };

    const filtered = useMemo(() => orders.filter((item: any) => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            item.productName.toLowerCase().includes(q) ||
            item.customerName.toLowerCase().includes(q) ||
            item.vendorName.toLowerCase().includes(q) ||
            (item.trackingId && item.trackingId.toLowerCase().includes(q));
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchSearch && matchStatus;
    }), [orders, search, statusFilter]);

    // Group by date
    const grouped = useMemo(() => {
        const groups: { label: string; data: any[] }[] = [];
        const map = new Map<string, any[]>();

        filtered.forEach(item => {
            const label = getDateLabel(item.date);
            if (!map.has(label)) {
                map.set(label, []);
                groups.push({ label, data: map.get(label)! });
            }
            map.get(label)!.push(item);
        });
        return groups;
    }, [filtered]);

    const statusChips: StatusFilter[] = ['All', 'Booked', 'Shipped', 'Delivered', 'Canceled'];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Delivered': return { bg: 'bg-success/10', text: 'text-success' };
            case 'Shipped': return { bg: 'bg-accent/10', text: 'text-accent' };
            case 'Booked': return { bg: 'bg-warning/10', text: 'text-warning' };
            case 'Canceled': return { bg: 'bg-danger/10', text: 'text-danger' };
            default: return { bg: 'bg-surface', text: 'text-secondary' };
        }
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-4">Orders</Text>

                    {/* Search */}
                    <View className="flex-row items-center bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl px-4 h-12 mb-3">
                        <Search size={18} color="#9CA3AF" />
                        <TextInput
                            placeholder="Search orders..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 ml-3 text-primary dark:text-primary-dark font-sans text-sm"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Status chips */}
                    <View className="flex-row gap-2">
                        {statusChips.map(s => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setStatusFilter(s)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full",
                                    statusFilter === s ? "bg-accent" : "bg-surface dark:bg-surface-dark"
                                )}
                            >
                                <Text className={cn(
                                    "font-sans-semibold text-xs",
                                    statusFilter === s ? "text-white" : "text-secondary dark:text-secondary-dark"
                                )}>
                                    {s === 'All' ? `All (${orders.length})` : s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <FlatList
                    data={grouped}
                    keyExtractor={item => item.label}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                    onRefresh={refresh}
                    refreshing={loading}
                    renderItem={({ item: group }) => (
                        <View className="mb-4">
                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider mb-2 mt-2">{group.label}</Text>
                            <Card className="px-4 py-0">
                                {group.data.map((item: any, i: number) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => navigation.navigate('OrderDetail', { order: item })}
                                        className={cn("py-3", i > 0 && "border-t border-divider dark:border-divider-dark")}
                                    >
                                        <View className="flex-row items-center">
                                            <View className="flex-1">
                                                <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm" numberOfLines={1}>{item.productName}</Text>
                                                <View className="flex-row items-center mt-1 gap-2">
                                                    <View className={cn("w-2 h-2 rounded-full",
                                                        item.customerPaymentStatus === 'Paid' ? 'bg-success' : 'bg-warning'
                                                    )} />
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{item.customerName}</Text>
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">→</Text>
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{item.vendorName}</Text>
                                                </View>
                                            </View>
                                            <View className="items-end ml-3">
                                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">₹{Number(item.sellingPrice).toLocaleString()}</Text>
                                                <TouchableOpacity
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrder(item);
                                                        setPickerVisible(true);
                                                    }}
                                                    disabled={updatingId === item.id}
                                                    className={cn("mt-1 px-2 py-0.5 rounded-full", getStatusStyle(item.status).bg)}
                                                >
                                                    {updatingId === item.id ? (
                                                        <ActivityIndicator size={10} color="#4F46E5" />
                                                    ) : (
                                                        <Text className={cn("font-sans-semibold text-[10px]", getStatusStyle(item.status).text)}>
                                                            {item.status || 'Pending'}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </Card>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">No orders found</Text>
                        </View>
                    }
                />

                <BottomSheetPicker
                    visible={pickerVisible}
                    onClose={() => setPickerVisible(false)}
                    title="Change Status"
                    options={statusOptions}
                    selectedValue={selectedOrder?.status}
                    onSelect={(val) => {
                        if (selectedOrder) handleStatusChange(selectedOrder.id, val);
                    }}
                />
            </SafeAreaView>
        </Background>
    );
}
