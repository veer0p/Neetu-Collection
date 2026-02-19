import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { Search, ChevronRight, ChevronDown } from 'lucide-react-native';
import { BottomSheetPicker, PickerOption } from '../components/BottomSheetPicker';
import { useTheme } from '../context/ThemeContext';

type StatusFilter = 'All' | 'Pending' | 'Booked' | 'Shipped' | 'Delivered' | 'Canceled';

const STATUS_FLOW: Record<string, string> = {
    'Booked': 'Shipped',
    'Shipped': 'Delivered',
};

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

export default function Transactions({ navigation }: { navigation: any }) {
    const { orders, loading, refresh, updateOrderStatus } = useTransactions();
    const { isDark } = useTheme();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const [directOnly, setDirectOnly] = useState(false);

    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

    const statusOptions: PickerOption[] = [
        { label: 'Booked', value: 'Booked', color: isDark ? '#FBBF24' : '#F59E0B' },
        { label: 'Shipped', value: 'Shipped', color: isDark ? '#818CF8' : '#4F46E5' },
        { label: 'Delivered', value: 'Delivered', color: isDark ? '#34D399' : '#10B981' },
        { label: 'Canceled', value: 'Canceled', color: isDark ? '#F87171' : '#EF4444' },
    ];

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try { await updateOrderStatus(orderId, newStatus); }
        catch (e) { console.error('Status update failed:', e); }
        finally { setUpdatingId(null); }
    };

    const handleQuickAdvance = async (item: any) => {
        const nextStatus = STATUS_FLOW[item.status];
        if (nextStatus) {
            await handleStatusChange(item.id, nextStatus);
        }
    };

    const filtered = useMemo(() => orders.filter((item: any) => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            item.productName.toLowerCase().includes(q) ||
            item.customerName.toLowerCase().includes(q) ||
            item.vendorName.toLowerCase().includes(q) ||
            (item.trackingId && item.trackingId.toLowerCase().includes(q));
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;

        // Direct Only filter: exclude if pickupPersonId exists
        const matchDirect = !directOnly || !item.pickupPersonId;

        return matchSearch && matchStatus && matchDirect;
    }), [orders, search, statusFilter, directOnly]);

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
            case 'Delivered': return { bg: 'bg-success/10', text: 'text-success dark:text-success-dark', color: isDark ? '#34D399' : '#10B981' };
            case 'Shipped': return { bg: 'bg-accent/10', text: 'text-accent dark:text-accent-dark', color: isDark ? '#818CF8' : '#4F46E5' };
            case 'Booked': return { bg: 'bg-warning/10', text: 'text-warning dark:text-warning-dark', color: isDark ? '#FBBF24' : '#F59E0B' };
            case 'Canceled': return { bg: 'bg-danger/10', text: 'text-danger dark:text-danger-dark', color: isDark ? '#F87171' : '#EF4444' };
            default: return { bg: 'bg-surface dark:bg-surface-dark', text: 'text-secondary dark:text-secondary-dark', color: '#9CA3AF' };
        }
    };

    const getNextLabel = (status: string) => {
        const next = STATUS_FLOW[status];
        if (!next) return null;
        return next === 'Shipped' ? '→ Ship' : '→ Deliver';
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-4">Orders</Text>

                    {/* Search and Filters */}
                    <View className="flex-row items-center gap-3 mb-3">
                        <View className="flex-1 flex-row items-center bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl px-4 h-12">
                            <Search size={18} color="#9CA3AF" />
                            <TextInput
                                placeholder="Search orders..."
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 ml-3 text-primary dark:text-primary-dark font-sans text-sm"
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={() => setDirectOnly(!directOnly)}
                            className={cn(
                                "px-4 h-12 rounded-2xl border items-center justify-center",
                                directOnly
                                    ? "bg-accent border-accent"
                                    : "bg-surface dark:bg-surface-dark border-divider dark:border-divider-dark"
                            )}
                        >
                            <Text className={cn(
                                "font-sans-bold text-xs",
                                directOnly ? "text-white" : "text-secondary dark:text-secondary-dark"
                            )}>Direct</Text>
                        </TouchableOpacity>
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
                                    {s === 'All' ? `All (${filtered.length})` : s}
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
                                                <View className="flex-row items-center gap-2 mt-2">
                                                    {/* Quick advance button - Made more prominent */}
                                                    {STATUS_FLOW[item.status] && (
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleQuickAdvance(item);
                                                            }}
                                                            disabled={updatingId === item.id}
                                                            className="px-3 py-1 rounded-lg bg-accent/20 border border-accent/30"
                                                            activeOpacity={0.6}
                                                        >
                                                            <Text className="text-accent dark:text-accent-dark font-sans-bold text-[11px] uppercase tracking-tighter">
                                                                {getNextLabel(item.status)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                    {/* Status badge with dropdown */}
                                                    <TouchableOpacity
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrder(item);
                                                            setPickerVisible(true);
                                                        }}
                                                        disabled={updatingId === item.id}
                                                        className={cn("flex-row items-center px-2 py-1 rounded-lg", getStatusStyle(item.status).bg)}
                                                        activeOpacity={0.7}
                                                    >
                                                        {updatingId === item.id ? (
                                                            <ActivityIndicator size={10} color={isDark ? '#818CF8' : '#4F46E5'} />
                                                        ) : (
                                                            <>
                                                                <Text className={cn("font-sans-bold text-[10px] uppercase", getStatusStyle(item.status).text)}>
                                                                    {item.status || 'Pending'}
                                                                </Text>
                                                                <ChevronDown size={10} color={getStatusStyle(item.status).color} style={{ marginLeft: 3 }} />
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
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
