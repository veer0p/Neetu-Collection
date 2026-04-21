import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { DirectoryItem, LedgerEntry } from '../utils/types';
import {
    ArrowLeft, Plus, IndianRupee, FileText, TrendingUp, TrendingDown,
    X, Trash2, Lock, Check, Circle, AlertTriangle, RotateCcw, Share2, ChevronRight
} from 'lucide-react-native';
import { ledgerExporter } from '../utils/ledgerExporter';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useResponsive } from '../hooks/useResponsive';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AccountDetail({ navigation, route }: { navigation: any, route: any }) {
    const { person } = route.params as { person: DirectoryItem };
    const { userId } = useTransactions();
    const { isDark } = useTheme();
    const { isWeb, desktopContainerStyle } = useResponsive();


    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '', type: 'PaymentOut' as 'PaymentIn' | 'PaymentOut', notes: ''
    });
    const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [editNotes, setEditNotes] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [fullBalance, setFullBalance] = useState(0);
    const [confirmSettleVisible, setConfirmSettleVisible] = useState(false);
    const [settleEntry, setSettleEntry] = useState<LedgerEntry | null>(null);
    const [settleLoading, setSettleLoading] = useState(false);
    const [deleteEntryLoading, setDeleteEntryLoading] = useState(false);
    const [deleteEntryVisible, setDeleteEntryVisible] = useState(false);
    const [deleteEntry, setDeleteEntry] = useState<LedgerEntry | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    const [shareType, setShareType] = useState<'Full' | 'Udhar'>('Full');
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'danger' | 'warning' | 'info' }>({
        visible: false, title: '', message: '', type: 'info'
    });

    useEffect(() => { loadLedger(); loadProfile(); }, []);
    useFocusEffect(useCallback(() => { loadLedger(); loadProfile(); }, [userId]));

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

    const loadProfile = async () => {
        if (!userId) return;
        const profile = await supabaseService.getProfile(userId);
        setCurrentUserProfile(profile);
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            let dataToShare = [...ledger];

            // 1. Filter by Date Range
            dataToShare = ledger.filter(e => {
                const txDate = new Date(e.createdAt);
                return txDate >= startDate && txDate <= endDate;
            });

            // 2. Filter by Type
            if (shareType === 'Udhar') {
                dataToShare = dataToShare.filter(e => !e.isSettled);
            }

            // Sort by date ascending for PDF
            dataToShare.sort((a, b) => a.createdAt - b.createdAt);

            if (dataToShare.length === 0) {
                setAlertConfig({
                    visible: true,
                    title: 'No Data',
                    message: 'No transactions found for the selected range.',
                    type: 'warning'
                });
                return;
            }

            await ledgerExporter.shareStatement(
                person.name,
                dataToShare,
                currentUserProfile?.upi_id,
                'Neetu Collection',
                shareType === 'Udhar',
                person.type as any
            );
            setShareModalVisible(false);
        } catch (e) {
            console.error('Share failed:', e);
            setAlertConfig({
                visible: true,
                title: 'Generation Failed',
                message: 'Could not create the statement. Please try again.',
                type: 'danger'
            });
        } finally {
            setSharing(false);
        }
    };

    const setQuickRange = (type: 'Today' | 'Week' | 'Month' | 'All') => {
        const end = new Date();
        let start = new Date();
        switch (type) {
            case 'Today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'Week':
                start.setDate(end.getDate() - 7);
                break;
            case 'Month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'All':
                start = new Date(0); // Beginning of time
                break;
        }
        setStartDate(start);
        setEndDate(end);
    };

    const loadLedger = async () => {
        setLoading(true);
        const data = await supabaseService.getV2LedgerByPerson(person.id);

        // Net Balance: Sum of all entries to maintain a correct running balance.
        const total = data.reduce((acc: number, curr: any) => acc + curr.amount, 0);
        setFullBalance(total);

        // For Vendor accounts: hide entries that are internally settled by driver
        // (PaymentOut entries with "Paid by driver" notes are intermediary bookkeeping)
        // For Pickup Person accounts: show all entries (they need full visibility)
        // For all accounts, show all entries for full transparency
        const filteredData = data;
        setLedger(filteredData);
        setLoading(false);
    };

    // Helper: Group entries by date for "Select by Date" functionality
    const groupedLedger = ledger.reduce((acc: any, item) => {
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown';
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(item);
        return acc;
    }, {});

    const toggleDateSelection = (dateStr: string) => {
        const idsInDate = groupedLedger[dateStr]
            .map((item: LedgerEntry) => item.orderId ? `order:${item.orderId}` : `entry:${item.id}`);

        const newSelected = new Set(selectedIds);
        const allSelected = idsInDate.every((id: string) => newSelected.has(id));

        if (allSelected) {
            idsInDate.forEach((id: string) => newSelected.delete(id));
            if (newSelected.size === 0) setSelectionMode(false);
        } else {
            setSelectionMode(true);
            idsInDate.forEach((id: string) => newSelected.add(id));
        }
        setSelectedIds(newSelected);
    };

    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'Cancel' | 'Return'>('Cancel');
    const [refundFromShop, setRefundFromShop] = useState(true);
    const [refundFromStaff, setRefundFromStaff] = useState(true);
    const [returnFee, setReturnFee] = useState('0');

    const handleBulkAction = (type: 'Cancel' | 'Return') => {
        setActionType(type);
        setActionModalVisible(true);
    };

    const confirmBulkAction = async () => {
        setBulkActionLoading(true);
        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                if (actionType === 'Cancel') {
                    await supabaseService.processOrderCancel(id.replace('order:', ''), userId!, { refundFromShop, refundFromStaff });
                } else {
                    await supabaseService.processOrderReturn(id, userId!, parseFloat(returnFee) || 0);
                }
            }
            setSelectionMode(false);
            setSelectedIds(new Set());
            setActionModalVisible(false);
            await loadLedger();
        } catch (e) {
            console.error('Bulk action failed:', e);
            alert('Action failed');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (!userId || !paymentForm.amount) return;
        const amount = parseFloat(paymentForm.amount);
        // Customer: PaymentIn (Receive) = Negative, PaymentOut (Refund) = Positive
        // Vendor/Pickup: PaymentOut (Pay them) = Positive (reduces debt), PaymentIn (Refund from them) = Positive
        // Note: For Vendors, balance is negative, so adding positive reduces absolute debt.
        let finalAmount = paymentForm.type === 'PaymentIn' ? -amount : amount;

        // Correcting for Vendor/Pickup: Receive (PaymentIn) should also be positive to reduce negative balance
        if (person.type !== 'Customer' && paymentForm.type === 'PaymentIn') {
            finalAmount = amount;
        }

        await supabaseService.addPayment({
            personId: person.id, amount: finalAmount,
            transactionType: paymentForm.type, notes: paymentForm.notes
        }, userId);
        setModalVisible(false);
        setPaymentForm({ amount: '', type: 'PaymentOut', notes: '' });
        loadLedger();
    };

    const handleUpdateNotes = async () => {
        if (!selectedEntry) return;
        await supabaseService.updateLedgerEntry(selectedEntry.id, editNotes);
        setEditModalVisible(false);
        loadLedger();
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

    const handleLongPress = (item: LedgerEntry) => {
        setSelectionMode(true);
        const id = item.orderId ? `order:${item.orderId}` : `entry:${item.id}`;
        const newSelected = new Set(selectedIds);
        newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setDeleteEntryVisible(true);
    };

    const confirmBulkDelete = async () => {
        setBulkActionLoading(true);
        try {
            const orderIds: string[] = [];
            const entryIds: string[] = [];

            selectedIds.forEach(id => {
                if (id.startsWith('order:')) orderIds.push(id.replace('order:', ''));
                else if (id.startsWith('entry:')) entryIds.push(id.replace('entry:', ''));
            });

            if (orderIds.length > 0) await supabaseService.bulkDeleteOrders(orderIds);
            if (entryIds.length > 0) {
                for (const id of entryIds) {
                    await supabaseService.deleteLedgerEntry(id);
                }
            }

            setSelectionMode(false);
            setSelectedIds(new Set());
            setDeleteEntryVisible(false);
            await loadLedger();
        } catch (e) {
            console.error('Bulk delete failed:', e);
            alert('Delete failed');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleEntryPress = (item: LedgerEntry) => {
        const id = item.orderId ? `order:${item.orderId}` : `entry:${item.id}`;
        if (selectionMode) {
            toggleSelection(id);
            return;
        }
        setSelectedEntry(item);
        if (item.orderId) { setOrderModalVisible(true); }
        else { setEditNotes(item.notes || ''); setEditModalVisible(true); }
    };

    const handleQuickSettle = async (item: LedgerEntry) => {
        // If entry is linked to an order, use idempotent rebuild via updateOrderPaymentStatus
        if (item.orderId) {
            setSettleEntry(item);
            setConfirmSettleVisible(true);
        } else {
            // For manual ledger entries (no orderId), still use addPayment
            setSettleEntry(item);
            setConfirmSettleVisible(true);
        }
    };

    const confirmEntrySettle = async () => {
        if (!userId || !settleEntry) {
            if (!userId) alert('Error: User session not found. Please log in again.');
            return;
        }
        setSettleLoading(true);

        try {
            if (settleEntry.orderId) {
                let field: 'customer' | 'vendor' | 'pickup' = 'customer';
                if (settleEntry.transactionType === 'Purchase') field = 'vendor';
                else if (settleEntry.transactionType === 'Expense') {
                    field = person.type === 'Vendor' ? 'vendor' : 'pickup';
                }
                await supabaseService.updateOrderPaymentStatus(settleEntry.orderId, field, 'Paid');
            } else {
                await supabaseService.settleLedgerEntry(settleEntry.id, userId);
            }
            // Close modal immediately for a responsive feel
            setConfirmSettleVisible(false);
            await loadLedger();
        } catch (e: any) {
            console.error('Quick settle failed:', e);
            alert('Error: ' + (e.message || 'Settlement failed'));
            setConfirmSettleVisible(false);
        } finally {
            setSettleLoading(false);
        }
    };

    const handleDeleteEntry = (item: LedgerEntry) => {
        setDeleteEntry(item);
        setDeleteEntryVisible(true);
    };

    const confirmDeleteEntry = async () => {
        if (!deleteEntry) return;
        setDeleteEntryLoading(true);
        try {
            await supabaseService.deleteLedgerEntry(deleteEntry.id);
            await loadLedger();
            setDeleteEntryVisible(false);
        } catch (e) {
            console.error('Delete entry failed:', e);
        } finally {
            setDeleteEntryLoading(false);
        }
    };



    const filterTypes = ['All', 'Sale', 'Purchase', 'PaymentIn', 'PaymentOut'];

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View style={[{ flex: 1, width: '100%' }, desktopContainerStyle]}>
                    {/* Header */}
                    {selectionMode ? (
                        <View className="px-6 pt-4 pb-2 flex-row items-center bg-accent/10">
                            <TouchableOpacity onPress={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 mr-3">
                                <X color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                            </TouchableOpacity>
                            <Text className="flex-1 text-primary dark:text-primary-dark font-sans-bold text-lg">
                                {selectedIds.size} Selected
                            </Text>
                        </View>
                    ) : (
                        <View className="px-6 pt-4 pb-2 flex-row items-center">
                            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface dark:bg-surface-dark rounded-xl mr-3">
                                <ArrowLeft color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                            </TouchableOpacity>
                            <View className="flex-1">
                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl" numberOfLines={1}>{person.name}</Text>
                                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{person.type}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShareModalVisible(true)}
                                className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-full mr-2 border border-divider dark:border-divider-dark"
                            >
                                <Share2 color={isDark ? '#818CF8' : '#4F46E5'} size={18} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setPaymentForm({ ...paymentForm, type: person.type === 'Customer' ? 'PaymentIn' : 'PaymentOut' });
                                    setModalVisible(true);
                                }}
                                className="bg-accent px-4 py-2 rounded-full flex-row items-center"
                            >
                                <Plus color="white" size={16} />
                                <Text className="text-white font-sans-bold text-xs ml-1">Pay</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Balance */}
                    <View className="px-6 py-4">
                        <Card className="p-5 items-center">
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs uppercase tracking-wider mb-1">Current Balance</Text>
                            <Text className={cn(
                                "text-4xl font-sans-bold",
                                fullBalance > 0 ? "text-success" : fullBalance < 0 ? "text-danger" : "text-primary dark:text-primary-dark"
                            )}>
                                ₹{Math.abs(fullBalance).toLocaleString()}
                            </Text>
                            <Text className={cn("font-sans-semibold text-xs mt-1",
                                fullBalance > 0 ? "text-success" : fullBalance < 0 ? "text-danger" : "text-secondary dark:text-secondary-dark"
                            )}>
                                {fullBalance > 0 ? "You are owed" : fullBalance < 0 ? "You owe" : "Settled "}
                            </Text>
                        </Card>
                    </View>

                    {/* Tabs - Horizontal Scroll Filters */}
                    <View className="-mx-6 mb-3">
                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4, gap: 10 }}
                        >
                            {filterTypes.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => setTypeFilter(t)}
                                    style={{
                                        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 1,
                                        backgroundColor: typeFilter === t ? '#4F46E5' : (isDark ? '#1E293B' : '#FFFFFF'),
                                        borderColor: typeFilter === t ? '#4F46E5' : (isDark ? '#334155' : '#E2E8F0'),
                                    }}
                                >
                                    <Text style={{
                                        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10,
                                        textTransform: 'uppercase', letterSpacing: 1.5,
                                        color: typeFilter === t ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                                    }}>
                                        {t}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Ledger List */}
                    {loading ? (
                        <View className="flex-1 justify-center items-center"><ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" /></View>
                    ) : (
                        <FlatList
                            data={(() => {
                                const filtered = ledger.filter(e => typeFilter === 'All' || e.transactionType === typeFilter);
                                // Insert Date Headers into the flat list for selection
                                const result: any[] = [];
                                let lastDate = '';
                                filtered.forEach(item => {
                                    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';
                                    if (dateStr !== lastDate) {
                                        result.push({ isHeader: true, dateStr, originalDate: item.createdAt });
                                        lastDate = dateStr;
                                    }
                                    result.push(item);
                                });
                                return result;
                            })()}
                            keyExtractor={(item, index) => item.isHeader ? `header-${item.dateStr}` : item.id}
                            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: isWeb ? 40 : 100 }}
                            renderItem={({ item, index }) => {
                                if (item.isHeader) {
                                    return (
                                        <View className="flex-row items-center py-4 mt-2">
                                            <Text className="flex-1 text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-widest">{item.dateStr}</Text>
                                            {selectionMode && (
                                                <TouchableOpacity
                                                    onPress={() => toggleDateSelection(new Date(item.originalDate).toLocaleDateString())}
                                                    className="px-3 py-1 bg-accent/10 rounded-lg border border-accent/20"
                                                >
                                                    <Text className="text-accent font-sans-bold text-[10px]">Select Date</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                }
                                // Debt-increasing transactions: 
                                // For Customers: Sale, PaymentOut (Money to customer), Reversal (Refund to them) increases what they owe us.
                                // For Vendors: Purchase, Expense, PaymentIn (Refund from them) increases our debt to them (makes balance more negative).
                                const debtIncTypes = person.type === 'Customer'
                                    ? ['Sale', 'PaymentOut', 'Reversal']
                                    : ['Purchase', 'Expense', 'PaymentIn'];

                                const isDebtInc = debtIncTypes.includes(item.transactionType);
                                const isInflow = !isDebtInc;
                                const isActionable = ['Sale', 'Purchase', 'Expense'].includes(item.transactionType);

                                // Only order-linked entries use the "isSettled" flag to hide from balance.
                                // Manual entries are always considered part of the active running history.
                                const alreadySettled = isActionable && item.orderId && (item.isSettled === true);
                                const isCanceled = item.orderStatus === 'Canceled';

                                // Time display: for settled entries show payment time; for others show entry creation time
                                const displayTime = alreadySettled && item.settledAt ? item.settledAt : item.createdAt;

                                const selectionId = item.orderId ? `order:${item.orderId}` : `entry:${item.id}`;
                                const isSelected = selectedIds.has(selectionId);

                                return (
                                    <Card className={cn("mb-3 border border-black/5 dark:border-white/5", selectionMode && isSelected ? (isDark ? 'bg-accent/20' : 'bg-accent/10') : '')} style={{ padding: 0 }}>
                                        <TouchableOpacity
                                            onPress={() => handleEntryPress(item)}
                                            onLongPress={() => handleLongPress(item)}
                                            activeOpacity={0.6}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center',
                                                paddingVertical: 16,
                                                paddingHorizontal: 16
                                            }}
                                        >
                                            {/* Selection Checkbox */}
                                            {
                                                selectionMode && (
                                                    <View className="mr-3">
                                                        {selectedIds.has(selectionId) ? (
                                                            <View className="w-5 h-5 rounded-full bg-accent items-center justify-center">
                                                                <Check color="white" size={12} strokeWidth={3} />
                                                            </View>
                                                        ) : (
                                                            <View className="w-5 h-5 rounded-full border-2 border-secondary/30" />
                                                        )}
                                                    </View>
                                                )
                                            }

                                            {/* Left icon */}
                                            <View style={{
                                                width: 38, height: 38, borderRadius: 10,
                                                backgroundColor: isInflow ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                                                alignItems: 'center', justifyContent: 'center', marginRight: 12,
                                            }}>
                                                {isInflow
                                                    ? <TrendingUp size={18} color="#10B981" />
                                                    : <TrendingDown size={18} color="#EF4444" />
                                                }
                                            </View>

                                            {/* Center: type + sub-line (product/notes + date + status) */}
                                            <View style={{ flex: 1 }}>
                                                {/* Line 1: transaction type */}
                                                <Text style={{
                                                    fontFamily: 'PlusJakartaSans_600SemiBold',
                                                    fontSize: 13,
                                                    color: isDark ? '#F1F5F9' : '#0F172A',
                                                }} numberOfLines={1}>
                                                    {item.transactionType}
                                                    {item.orderId && item.orderProductName ? (
                                                        <Text style={{
                                                            fontFamily: 'PlusJakartaSans_400Regular',
                                                            fontSize: 12,
                                                            color: isDark ? '#818CF8' : '#4F46E5',
                                                        }}> · {item.orderProductName}{item.orderQuantity ? ` (x${item.orderQuantity})` : ''}</Text>
                                                    ) : null}
                                                </Text>

                                                {/* Line 2: date + time + status pill or action button (all inline) */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
                                                    <Text style={{
                                                        fontFamily: 'PlusJakartaSans_400Regular',
                                                        fontSize: 11,
                                                        color: isDark ? '#64748B' : '#94A3B8',
                                                    }}>
                                                        {new Date(displayTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        {' '}
                                                        <Text style={{ fontSize: 10 }}>
                                                            {new Date(displayTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </Text>
                                                    </Text>

                                                    {item.notes && !item.orderId ? (
                                                        <Text style={{
                                                            fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11,
                                                            color: isDark ? '#64748B' : '#94A3B8',
                                                        }} numberOfLines={1}>· {item.notes}</Text>
                                                    ) : null}

                                                    {/* Status or action — inline */}
                                                    {isActionable && isCanceled && (
                                                        <View style={{
                                                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                                                            backgroundColor: 'rgba(239,68,68,0.10)',
                                                        }}>
                                                            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: '#EF4444', letterSpacing: 0.4 }}>
                                                                CANCELED
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {isActionable && !isCanceled && alreadySettled && (
                                                        <View style={{
                                                            flexDirection: 'row', alignItems: 'center', gap: 3,
                                                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                                                            backgroundColor: 'rgba(16,185,129,0.10)',
                                                        }}>
                                                            <View style={{ width: 4, height: 4, borderRadius: 99, backgroundColor: '#10B981' }} />
                                                            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: '#10B981', letterSpacing: 0.4 }}>
                                                                SETTLED
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {isActionable && !isCanceled && !alreadySettled && (
                                                        <TouchableOpacity
                                                            onPress={(e) => { e.stopPropagation(); handleQuickSettle(item); }}
                                                            activeOpacity={0.75}
                                                            style={{
                                                                flexDirection: 'row', alignItems: 'center', gap: 4,
                                                                paddingHorizontal: 8, paddingVertical: 3,
                                                                borderRadius: 6, borderWidth: 1,
                                                                borderColor: isInflow ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)',
                                                                backgroundColor: isInflow ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                                            }}
                                                        >
                                                            <Text style={{
                                                                fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.2,
                                                                color: isInflow ? '#10B981' : '#F59E0B',
                                                            }}>
                                                                {isInflow ? 'Mark Received' : 'Mark Paid'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Right: amount */}
                                            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                                                <Text style={{
                                                    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15,
                                                    color: isInflow ? '#10B981' : '#EF4444',
                                                }}>
                                                    {isInflow ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
                                                </Text>
                                                <View style={{ marginTop: 4 }}>
                                                    {item.orderId ? (
                                                        <Lock size={11} color={isDark ? '#475569' : '#CBD5E1'} style={{ opacity: 0.4 }} />
                                                    ) : (
                                                        <View style={{ width: 11, height: 11 }} />
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Card>
                                );
                            }}

                            ListEmptyComponent={
                                <View className="items-center py-20">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">No transactions</Text>
                                </View>
                            }
                        />
                    )}

                    {/* Modals */}
                    <Modal visible={modalVisible} animationType="slide" transparent>
                        <View className="flex-1 justify-end bg-black/40">
                            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
                            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                <View className="bg-white dark:bg-surface-dark rounded-t-3xl p-6 pb-8">
                                    <View className="items-center mb-6">
                                        <View className="w-12 h-1.5 bg-divider dark:bg-divider-dark rounded-full mb-6" />
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">Record Payment</Text>
                                    </View>

                                    <View className="flex-row mb-6 bg-surface dark:bg-background-dark p-1 rounded-2xl border border-divider dark:border-divider-dark">
                                        <TouchableOpacity
                                            onPress={() => setPaymentForm({ ...paymentForm, type: 'PaymentIn' })}
                                            style={{
                                                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                                                backgroundColor: paymentForm.type === 'PaymentIn' ? (person.type === 'Customer' ? '#10B981' : '#F59E0B') : 'transparent',
                                            }}
                                        >
                                            <Text style={{
                                                fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12,
                                                color: paymentForm.type === 'PaymentIn' ? '#FFFFFF' : '#94A3B8',
                                            }}>
                                                {person.type === 'Customer' ? 'RECEIVE' : 'REFUND from them'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setPaymentForm({ ...paymentForm, type: 'PaymentOut' })}
                                            style={{
                                                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                                                backgroundColor: paymentForm.type === 'PaymentOut' ? (person.type === 'Customer' ? '#EF4444' : '#10B981') : 'transparent',
                                            }}
                                        >
                                            <Text style={{
                                                fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12,
                                                color: paymentForm.type === 'PaymentOut' ? '#FFFFFF' : '#94A3B8',
                                            }}>
                                                {person.type === 'Customer' ? 'REFUND to them' : 'PAY them'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Input
                                        label="Amount (₹)"
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={paymentForm.amount}
                                        onChangeText={text => setPaymentForm({ ...paymentForm, amount: text })}
                                    />
                                    <Input
                                        label="Notes"
                                        placeholder="Add notes..."
                                        value={paymentForm.notes}
                                        onChangeText={text => setPaymentForm({ ...paymentForm, notes: text })}
                                    />

                                    <Button
                                        onPress={handleAddPayment}
                                        className="mt-4"
                                        variant={paymentForm.type === 'PaymentIn' ? 'primary' : 'danger'}
                                    >
                                        <Text className="text-white font-sans-bold">Confirm Payment</Text>
                                    </Button>
                                </View>
                            </KeyboardAvoidingView>
                        </View>
                    </Modal>

                    {/* Edit Note Modal */}
                    <Modal visible={editModalVisible} transparent animationType="fade">
                        <View className="flex-1 justify-center bg-black/40 px-6">
                            <Card className="p-6">
                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-lg mb-4">Edit Note</Text>
                                <Input placeholder="Add notes..." value={editNotes} onChangeText={setEditNotes} multiline />
                                <View className="flex-row gap-3 mt-6">
                                    <Button variant="secondary" onPress={() => setEditModalVisible(false)} className="flex-1">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans-bold">Cancel</Text>
                                    </Button>
                                    <Button onPress={handleUpdateNotes} className="flex-1">
                                        <Text className="text-white font-sans-bold">Save</Text>
                                    </Button>
                                </View>
                            </Card>
                        </View>
                    </Modal>

                    {/* Order Preview Modal */}
                    <Modal visible={orderModalVisible} transparent animationType="fade">
                        <View className="flex-1 justify-center bg-black/40 px-6">
                            <Card className="p-6">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs uppercase mb-1">Order Transaction</Text>
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">{selectedEntry?.orderProductName}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setOrderModalVisible(false)} className="p-2 bg-surface dark:bg-surface-dark rounded-full">
                                        <X size={18} color={isDark ? '#94A3B8' : '#9CA3AF'} />
                                    </TouchableOpacity>
                                </View>
                                <View className="gap-2 mb-6">
                                    <View className="flex-row justify-between p-3 bg-background dark:bg-background-dark rounded-xl">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">Type</Text>
                                        <Text className="text-accent font-sans-bold text-sm">{selectedEntry?.transactionType}</Text>
                                    </View>
                                    <View className="flex-row justify-between p-3 bg-background dark:bg-background-dark rounded-xl">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">Amount</Text>
                                        <Text className={cn("font-sans-bold text-lg",
                                            ['Sale', 'PaymentIn'].includes(selectedEntry?.transactionType || '') ? "text-success" : "text-danger"
                                        )}>
                                            {['Sale', 'PaymentIn'].includes(selectedEntry?.transactionType || '') ? '+' : '-'}
                                            ₹{Math.abs(selectedEntry?.amount || 0).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                                <Button variant="secondary" onPress={() => setOrderModalVisible(false)} className="w-full">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-bold">Close</Text>
                                </Button>
                            </Card>
                        </View>
                    </Modal>

                    {/* Bulk Action Footer */}
                    {selectionMode && (
                        <View
                            className="absolute bottom-10 left-6 right-6 bg-surface dark:bg-surface-dark p-4 rounded-3xl flex-row items-center justify-between border border-secondary/10"
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
                                className="bg-danger h-14 rounded-2xl flex-row items-center justify-center flex-1 ml-2"
                            >
                                <Trash2 color="#FFFFFF" size={18} />
                                <Text className="text-white font-sans-bold ml-2">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Date Pickers */}
                    {showPicker && (
                        <DateTimePicker
                            value={showPicker === 'start' ? startDate : endDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowPicker(null);
                                if (selectedDate) {
                                    if (showPicker === 'start') setStartDate(selectedDate);
                                    else setEndDate(selectedDate);
                                }
                            }}
                        />
                    )}

                    {/* Share Statement Modal */}
                    <Modal visible={shareModalVisible} animationType="slide" transparent>
                        <View className="flex-1 justify-end bg-black/40">
                            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShareModalVisible(false)} />
                            <View className="bg-white dark:bg-surface-dark rounded-t-[40px] p-8 pb-10">
                                <View className="items-center mb-8">
                                    <View className="w-16 h-1.5 bg-divider dark:bg-divider-dark rounded-full mb-8" />
                                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl">Share Statement</Text>
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-sm mt-1">Configure your PDF report</Text>
                                </View>

                                {/* Toggle Type */}
                                <View className="mb-8">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest mb-4 ml-1">Report Type</Text>
                                    <View className="flex-row bg-background dark:bg-background-dark p-1.5 rounded-2xl border border-divider dark:border-divider-dark">
                                        <TouchableOpacity
                                            onPress={() => setShareType('Udhar')}
                                            style={{
                                                flex: 1, paddingVertical: 14, borderRadius: 12,
                                                alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                                                backgroundColor: shareType === 'Udhar' ? '#4F46E5' : 'transparent',
                                            }}
                                        >
                                            <Text style={{
                                                fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14,
                                                color: shareType === 'Udhar' ? '#FFFFFF' : '#94A3B8',
                                            }}>Udhar Only</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setShareType('Full')}
                                            style={{
                                                flex: 1, paddingVertical: 14, borderRadius: 12,
                                                alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                                                backgroundColor: shareType === 'Full' ? '#4F46E5' : 'transparent',
                                            }}
                                        >
                                            <Text style={{
                                                fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14,
                                                color: shareType === 'Full' ? '#FFFFFF' : '#94A3B8',
                                            }}>Full Ledger</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Date Selection */}
                                <View className="mb-8">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest mb-4 ml-1">Date Range</Text>

                                    {/* Quick Options */}
                                    <View className="flex-row flex-wrap gap-2 mb-4">
                                        {['Today', 'Week', 'Month', 'All'].map((q) => (
                                            <TouchableOpacity
                                                key={q}
                                                onPress={() => setQuickRange(q as any)}
                                                className="px-4 py-2 bg-background dark:bg-background-dark border border-divider dark:border-divider-dark rounded-xl"
                                            >
                                                <Text className="text-secondary dark:text-secondary-dark font-sans-semibold text-xs">{q}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View className="flex-row items-center gap-3">
                                        <TouchableOpacity
                                            onPress={() => setShowPicker('start')}
                                            className="flex-1 bg-background dark:bg-background-dark p-4 rounded-2xl border border-divider dark:border-divider-dark"
                                        >
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] uppercase mb-1">Start Date</Text>
                                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">{startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
                                        </TouchableOpacity>
                                        <ChevronRight size={16} color="#94A3B8" />
                                        <TouchableOpacity
                                            onPress={() => setShowPicker('end')}
                                            className="flex-1 bg-background dark:bg-background-dark p-4 rounded-2xl border border-divider dark:border-divider-dark"
                                        >
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] uppercase mb-1">End Date</Text>
                                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">{endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Button
                                    onPress={handleShare}
                                    loading={sharing}
                                    className="h-16 rounded-2xl"
                                >
                                    <Share2 color="white" size={20} style={{ marginRight: 8 }} />
                                    <Text className="text-white font-sans-bold text-lg">Generate PDF</Text>
                                </Button>
                            </View>
                        </View>
                    </Modal>

                    <ConfirmDialog
                        visible={alertConfig.visible}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                        onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
                        onCancel={() => setAlertConfig({ ...alertConfig, visible: false })}
                        confirmText="Okay"
                        cancelText=""
                    />
                </View>
            </SafeAreaView>

            {/* Special Action Modal (Cancel/Return) */}
            <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <Card className="p-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">{actionType === 'Cancel' ? 'Cancel Orders' : 'Return Orders'}</Text>
                            <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                                <X color={isDark ? '#94A3B8' : '#6B7280'} size={20} />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-6">
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-sm mb-4">
                                Processing {selectedIds.size} orders. This will update statuses and generate refund entries as per your business logic.
                            </Text>

                            {actionType === 'Cancel' ? (
                                <View className="gap-3">
                                    <TouchableOpacity
                                        onPress={() => setRefundFromShop(!refundFromShop)}
                                        className="flex-row items-center p-4 bg-secondary/5 rounded-2xl"
                                    >
                                        <View className={cn("w-5 h-5 rounded border-2 items-center justify-center mr-3",
                                            refundFromShop ? "bg-accent border-accent" : "border-secondary/30")}>
                                            {refundFromShop && <Check color="white" size={12} strokeWidth={4} />}
                                        </View>
                                        <View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm">Get refund from shop?</Text>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px]">Adds PaymentIn from vendor for original price</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setRefundFromStaff(!refundFromStaff)}
                                        className="flex-row items-center p-4 bg-secondary/5 rounded-2xl"
                                    >
                                        <View className={cn("w-5 h-5 rounded border-2 items-center justify-center mr-3",
                                            refundFromStaff ? "bg-accent border-accent" : "border-secondary/30")}>
                                            {refundFromStaff && <Check color="white" size={12} strokeWidth={4} />}
                                        </View>
                                        <View>
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm">Recoup Logistics?</Text>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px]">Recoup shipping/pickup price from staff ledgers</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-semibold text-xs mb-2 uppercase">Return Fee (Per Order)</Text>
                                    <Input
                                        value={returnFee}
                                        onChangeText={setReturnFee}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-2 italic">
                                        * Product price will be refunded; shipping/pickup will not.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View className="flex-row gap-3">
                            <Button
                                className="flex-1" variant="outline"
                                onPress={() => setActionModalVisible(false)}
                            >
                                Go Back
                            </Button>
                            <Button
                                className="flex-1"
                                onPress={confirmBulkAction}
                                loading={bulkActionLoading}
                                variant={actionType === 'Cancel' ? 'danger' : 'primary'}
                            >
                                Confirm {actionType}
                            </Button>
                        </View>
                    </Card>
                </View>
            </Modal>

            <ConfirmDialog
                visible={confirmSettleVisible}
                title="Confirm Payment"
                message={`Mark ₹${Math.abs(settleEntry?.amount || 0).toLocaleString()} as ${settleEntry?.amount && settleEntry.amount > 0 ? 'Received' : 'Paid'}?`}
                onConfirm={confirmEntrySettle}
                onCancel={() => setConfirmSettleVisible(false)}
                confirmText={settleEntry?.amount && settleEntry.amount > 0 ? "Mark Received" : "Mark Paid"}
                type="success"
                loading={settleLoading}
            />
            <ConfirmDialog
                visible={deleteEntryVisible}
                title={selectionMode ? "Delete Multiple Entries?" : "Delete Transaction?"}
                message={selectionMode ? `Are you sure you want to delete ${selectedIds.size} transactions? This cannot be undone.` : "This will permanently delete this manual payment entry. This cannot be undone."}
                onConfirm={selectionMode ? confirmBulkDelete : confirmDeleteEntry}
                onCancel={() => setDeleteEntryVisible(false)}
                confirmText="Delete"
                type="danger"
                loading={deleteEntryLoading || bulkActionLoading}
            />
        </Background >
    );
}

