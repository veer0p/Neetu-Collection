import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, BackHandler, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { Search, ChevronRight, ChevronDown, X, Trash2, RotateCcw, Check, Plus } from 'lucide-react-native';
import { BottomSheetPicker, PickerOption } from '../components/BottomSheetPicker';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { supabaseService } from '../store/supabaseService';
import { Modal } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ConfirmDialog } from '../components/ConfirmDialog';

type StatusFilter = 'All' | 'Pending' | 'Booked' | 'Shipped' | 'Delivered' | 'Canceled' | 'Returned';

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
    const { isWeb, desktopContainerStyle } = useResponsive();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                    return true;
                }
                return false;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [selectionMode])
    );
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'Cancel' | 'Return'>('Cancel');
    const [refundFromShop, setRefundFromShop] = useState(true);
    const [refundFromStaff, setRefundFromStaff] = useState(true);
    const [returnFee, setReturnFee] = useState('0');
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

    const statusOptions: PickerOption[] = [
        { label: 'Booked', value: 'Booked', color: isDark ? '#FBBF24' : '#F59E0B' },
        { label: 'Shipped', value: 'Shipped', color: isDark ? '#818CF8' : '#4F46E5' },
        { label: 'Delivered', value: 'Delivered', color: isDark ? '#34D399' : '#10B981' },
        { label: 'Canceled', value: 'Canceled', color: isDark ? '#F87171' : '#EF4444' },
        { label: 'Returned', value: 'Returned', color: isDark ? '#94A3B8' : '#6B7280' },
    ];

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try { await updateOrderStatus(orderId, newStatus); }
        catch (e) { console.error('Status update failed:', e); }
        finally { setUpdatingId(null); }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            if (newSelected.size === 0) setSelectionMode(false);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleLongPress = (id: string) => {
        setSelectionMode(true);
        const newSelected = new Set(selectedIds);
        newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleDateSelection = (label: string) => {
        const group = grouped.find(g => g.label === label);
        if (!group) return;
        const idsInGroup = group.data.map(o => o.id);
        const newSelected = new Set(selectedIds);
        const allSelected = idsInGroup.every(id => newSelected.has(id));

        if (allSelected) {
            idsInGroup.forEach(id => newSelected.delete(id));
            if (newSelected.size === 0) setSelectionMode(false);
        } else {
            setSelectionMode(true);
            idsInGroup.forEach(id => newSelected.add(id));
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        setDeleteDialogVisible(true);
    };

    const confirmBulkDelete = async () => {
        setBulkActionLoading(true);
        try {
            await supabaseService.bulkDeleteOrders(Array.from(selectedIds));
            setSelectionMode(false);
            setSelectedIds(new Set());
            setDeleteDialogVisible(false);
            await refresh();
        } catch (e) {
            console.error('Bulk delete failed:', e);
            alert('Delete failed');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleBulkAction = (type: 'Cancel' | 'Return') => {
        setActionType(type);
        setActionModalVisible(true);
    };

    const confirmBulkAction = async () => {
        setBulkActionLoading(true);
        try {
            const user = await supabaseService.getCurrentUser();
            if (!user) throw new Error('Session lost');

            const ids = Array.from(selectedIds);
            for (const id of ids) {
                if (actionType === 'Cancel') {
                    await supabaseService.processOrderCancel(id, user.id, { refundFromShop, refundFromStaff });
                } else {
                    await supabaseService.processOrderReturn(id, user.id, parseFloat(returnFee) || 0);
                }
            }
            setSelectionMode(false);
            setSelectedIds(new Set());
            setActionModalVisible(false);
            await refresh();
        } catch (e: any) {
            console.error('Bulk action failed:', e);
            alert('Action failed: ' + e.message);
        } finally {
            setBulkActionLoading(false);
        }
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

    const statusChips: StatusFilter[] = ['All', 'Booked', 'Shipped', 'Delivered', 'Canceled', 'Returned'];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Delivered': return { bg: 'bg-success/10', text: 'text-success dark:text-success-dark', color: isDark ? '#34D399' : '#10B981' };
            case 'Shipped': return { bg: 'bg-accent/10', text: 'text-accent dark:text-accent-dark', color: isDark ? '#818CF8' : '#4F46E5' };
            case 'Booked': return { bg: 'bg-warning/10', text: 'text-warning dark:text-warning-dark', color: isDark ? '#FBBF24' : '#F59E0B' };
            case 'Canceled': return { bg: 'bg-danger/10', text: 'text-danger dark:text-danger-dark', color: isDark ? '#F87171' : '#EF4444' };
            case 'Returned': return { bg: 'bg-warning/10', text: 'text-warning dark:text-warning-dark', color: isDark ? '#FBBF24' : '#F59E0B' };
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
                <View style={[{ flex: 1, width: '100%' }, desktopContainerStyle]}>
                    <View className="px-6 pt-4 pb-2">
                    {selectionMode ? (
                        <View className="-mx-6 px-6 py-2 mb-4 bg-accent/10 flex-row items-center">
                            <TouchableOpacity onPress={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 mr-3">
                                <X color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                            </TouchableOpacity>
                            <Text className="flex-1 text-primary dark:text-primary-dark font-sans-bold text-lg">
                                {selectedIds.size} Selected
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-4">Orders</Text>
                    )}

                    {/* Search and Filters */}
                    <View className="flex-row items-center gap-3 mb-3">
                        {!selectionMode && (
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
                        )}
                    </View>

                    {/* Status chips */}
                    <View className="-mx-6">
                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4, gap: 10 }}
                        >
                            {statusChips.map(s => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => setStatusFilter(s)}
                                    style={{
                                        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 1,
                                        backgroundColor: statusFilter === s ? '#4F46E5' : (isDark ? '#1E293B' : '#FFFFFF'),
                                        borderColor: statusFilter === s ? '#4F46E5' : (isDark ? '#334155' : '#E2E8F0'),
                                    }}
                                >
                                    <Text style={{
                                        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10,
                                        textTransform: 'uppercase', letterSpacing: 1.5,
                                        color: statusFilter === s ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                                    }}>
                                        {s === 'All' ? `All (${filtered.length})` : s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <FlatList
                    data={grouped}
                    keyExtractor={item => item.label}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: isWeb ? 40 : 100 }}
                    onRefresh={refresh}
                    refreshing={loading}
                    renderItem={({ item: group }) => (
                        <View className="mb-4">
                            <View className="flex-row items-center mb-2 mt-2">
                                <Text className="flex-1 text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider">{group.label}</Text>
                                {selectionMode && (
                                    <TouchableOpacity
                                        onPress={() => toggleDateSelection(group.label)}
                                        className="px-4 py-2 bg-accent/10 rounded-xl border border-accent/20"
                                    >
                                        <Text className="text-accent font-sans-bold text-[10px] uppercase tracking-wider">Select Date</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Card className="px-4 py-0">
                                {group.data.map((item: any, i: number) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => {
                                            if (selectionMode) toggleSelection(item.id);
                                            else navigation.navigate('OrderDetail', { order: item });
                                        }}
                                        onLongPress={() => handleLongPress(item.id)}
                                        delayLongPress={300}
                                        activeOpacity={0.6}
                                        className={cn(
                                            "py-3 flex-row items-center",
                                            i > 0 && "border-t border-divider dark:border-divider-dark",
                                            selectionMode && selectedIds.has(item.id) && (isDark ? 'bg-accent/10' : 'bg-accent/5')
                                        )}
                                    >
                                        {/* Selection Checkbox */}
                                        {selectionMode && (
                                            <View className="mr-3">
                                                {selectedIds.has(item.id) ? (
                                                    <View className="w-5 h-5 rounded-full bg-accent items-center justify-center">
                                                        <Check color="white" size={12} strokeWidth={3} />
                                                    </View>
                                                ) : (
                                                    <View className="w-5 h-5 rounded-full border-2 border-secondary/30" />
                                                )}
                                            </View>
                                        )}
                                        <View className="flex-row items-center flex-1">
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
                                                    {/* Quick advance button */}
                                                    {STATUS_FLOW[item.status] && !selectionMode && (
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
                                                            if (selectionMode) {
                                                                e.stopPropagation();
                                                                toggleSelection(item.id);
                                                                return;
                                                            }
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

                {/* Bulk Action Footer */}
                {selectionMode && (
                    <View
                        className="absolute bottom-28 left-6 right-6 bg-surface dark:bg-surface-dark p-4 rounded-3xl flex-row items-center justify-between shadow-2xl border border-secondary/10"
                        style={{ elevation: 10 }}
                    >
                        <TouchableOpacity
                            onPress={() => handleBulkAction('Cancel')}
                            className="bg-danger/10 h-14 rounded-2xl flex-1 mr-2 flex-row items-center justify-center border border-danger/20"
                        >
                            <X color="#EF4444" size={18} />
                            <Text className="text-danger font-sans-bold ml-2">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleBulkAction('Return')}
                            className="bg-warning/10 h-14 rounded-2xl flex-1 mx-2 flex-row items-center justify-center border border-warning/20"
                        >
                            <RotateCcw color="#F59E0B" size={18} />
                            <Text className="text-warning font-sans-bold ml-2">Return</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleBulkDelete}
                            className="bg-danger h-14 rounded-2xl flex-row items-center justify-center flex-1 ml-2 shadow-sm shadow-danger/20"
                        >
                            <Trash2 color="#FFFFFF" size={18} />
                            <Text className="text-white font-sans-bold ml-2">Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action Modal */}
                <Modal visible={actionModalVisible} transparent animationType="fade">
                    <View className="flex-1 bg-black/50 justify-center p-6">
                        <Card className="p-6">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">{actionType} Order</Text>
                                <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                                    <X color={isDark ? '#94A3B8' : '#6B7280'} size={20} />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-sm mb-6">
                                {actionType === 'Cancel'
                                    ? "This will issue a full refund to the customer and recoup logistics costs from staff."
                                    : "This will refund the product price only. You can also specify a return fee."}
                            </Text>

                            {actionType === 'Cancel' ? (
                                <View className="gap-4 mb-6">
                                    <TouchableOpacity
                                        onPress={() => setRefundFromShop(!refundFromShop)}
                                        className="flex-row items-center"
                                    >
                                        <View className={cn("w-5 h-5 rounded border-2 mr-3 items-center justify-center",
                                            refundFromShop ? "bg-accent border-accent" : "border-divider"
                                        )}>
                                            {refundFromShop && <Check color="white" size={12} strokeWidth={3} />}
                                        </View>
                                        <View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm">Refund Product Case?</Text>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px]">Product cost paid back to customer</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setRefundFromStaff(!refundFromStaff)}
                                        className="flex-row items-center"
                                    >
                                        <View className={cn("w-5 h-5 rounded border-2 mr-3 items-center justify-center",
                                            refundFromStaff ? "bg-accent border-accent" : "border-divider"
                                        )}>
                                            {refundFromStaff && <Check color="white" size={12} strokeWidth={3} />}
                                        </View>
                                        <View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm">Recoup Logistics?</Text>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px]">Recoup shipping/pickup price from staff ledgers</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="mb-6">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-semibold text-xs mb-2">RETURN FEE (Deducted from refund)</Text>
                                    <Input
                                        value={returnFee}
                                        onChangeText={setReturnFee}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            )}

                            <View className="flex-row gap-3">
                                <Button
                                    className="flex-1" variant="outline"
                                    onPress={() => setActionModalVisible(false)}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    className="flex-1" loading={bulkActionLoading}
                                    variant={actionType === 'Cancel' ? 'danger' : 'primary'}
                                    onPress={confirmBulkAction}
                                >
                                    Confirm {actionType}
                                </Button>
                            </View>
                        </Card>
                    </View>
                </Modal>
                </View>
            </SafeAreaView>
            <ConfirmDialog
                visible={deleteDialogVisible}
                title="Delete Orders?"
                message={`Are you sure you want to delete ${selectedIds.size} orders? This will remove all associated ledger records.`}
                onConfirm={confirmBulkDelete}
                onCancel={() => setDeleteDialogVisible(false)}
                confirmText="Delete"
                type="danger"
                loading={bulkActionLoading}
            />
        </Background >
    );
}
