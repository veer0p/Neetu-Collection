import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { DirectoryItem, LedgerEntry } from '../utils/types';
import { ArrowLeft, Plus, IndianRupee, FileText, TrendingUp, TrendingDown, X, Trash2, Lock } from 'lucide-react-native';

import { useRoute } from '@react-navigation/native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useResponsive } from '../hooks/useResponsive';

export default function AccountDetail({ navigation }: { navigation: any }) {
    const route = useRoute();
    const { person } = route.params as { person: DirectoryItem };
    const { userId } = useTransactions();
    const { isDark } = useTheme();
    const { isWeb } = useResponsive();


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
    const [deleteEntryVisible, setDeleteEntryVisible] = useState(false);
    const [deleteEntry, setDeleteEntry] = useState<LedgerEntry | null>(null);
    const [deleteEntryLoading, setDeleteEntryLoading] = useState(false);

    useEffect(() => { loadLedger(); }, []);
    useFocusEffect(useCallback(() => { loadLedger(); }, []));

    const loadLedger = async () => {
        setLoading(true);
        const data = await supabaseService.getLedgerEntries(person.id);

        // Calculate the TRUE balance from unfiltered data
        const total = data.reduce((acc, curr) => acc + curr.amount, 0);
        setFullBalance(total);

        // For Vendor accounts: hide entries that are internally settled by driver
        // (PaymentOut entries with "Paid by driver" notes are intermediary bookkeeping)
        // For Pickup Person accounts: show all entries (they need full visibility)
        const filteredData = data.filter(entry => {
            // Hide "Paid by driver" PaymentOut from vendor view — this was settled by pickup person, not shop owner directly
            if (person.type === 'Vendor' && entry.transactionType === 'PaymentOut' && entry.notes === 'Paid by driver') {
                return false;
            }
            return true;
        });
        setLedger(filteredData);
        setLoading(false);
    };

    const handleAddPayment = async () => {
        if (!userId || !paymentForm.amount) return;
        const amount = parseFloat(paymentForm.amount);
        const finalAmount = paymentForm.type === 'PaymentIn' ? -amount : amount;
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

    const handleEntryPress = (item: LedgerEntry) => {
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
        if (!userId || !settleEntry) return;
        setSettleLoading(true);

        try {
            if (settleEntry.orderId) {
                let field: 'customer' | 'vendor' | 'pickup' = 'customer';
                if (settleEntry.transactionType === 'Purchase') field = 'vendor';
                else if (settleEntry.transactionType === 'Reimbursement' || settleEntry.transactionType === 'Expense') field = 'pickup';
                await supabaseService.updateOrderPaymentStatus(settleEntry.orderId, field, 'Paid');
            } else {
                const isReceivable = settleEntry.amount > 0;
                const settleType = isReceivable ? 'PaymentIn' : 'PaymentOut';
                const settleAmount = -settleEntry.amount;
                await supabaseService.addPayment({
                    personId: person.id, amount: settleAmount,
                    transactionType: settleType,
                    notes: `Quick settle: ${settleEntry.transactionType}${settleEntry.orderProductName ? ' - ' + settleEntry.orderProductName : ''}`
                }, userId);
            }
            await loadLedger();
            setConfirmSettleVisible(false);
        } catch (e) {
            console.error('Quick settle failed:', e);
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
                {/* Header */}
                <View className="px-6 pt-4 pb-2 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface dark:bg-surface-dark rounded-xl mr-3">
                        <ArrowLeft color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl" numberOfLines={1}>{person.name}</Text>
                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{person.type}</Text>
                    </View>
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
                            {fullBalance > 0 ? "You are owed" : fullBalance < 0 ? "You owe" : "Settled ✓"}
                        </Text>
                    </Card>
                </View>

                {/* Tabs - Fixed: using inline style height to prevent blown up pills */}
                <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {filterTypes.map(t => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setTypeFilter(t)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 999,
                                    backgroundColor: typeFilter === t
                                        ? (isDark ? '#818CF8' : '#4F46E5')
                                        : (isDark ? '#1E293B' : '#F8F9FB'),
                                }}
                            >
                                <Text style={{
                                    fontSize: 12,
                                    fontFamily: 'PlusJakartaSans_600SemiBold',
                                    color: typeFilter === t ? '#FFFFFF' : (isDark ? '#94A3B8' : '#6B7280'),
                                }}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Ledger List */}
                {loading ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" /></View>
                ) : (
                    <FlatList
                        data={ledger.filter(e => typeFilter === 'All' || e.transactionType === typeFilter)}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: isWeb ? 40 : 100 }}
                        renderItem={({ item, index }) => {
                            const isInflow = item.amount > 0;
                            const isActionable = ['Sale', 'Purchase', 'Reimbursement', 'Expense'].includes(item.transactionType);
                            const alreadySettled = isActionable && item.orderId
                                ? ledger.some(e =>
                                    e.orderId === item.orderId &&
                                    (e.transactionType === 'PaymentIn' || e.transactionType === 'PaymentOut')
                                )
                                : false;
                            const isCanceled = item.orderStatus === 'Canceled';

                            return (
                                <TouchableOpacity
                                    onPress={() => handleEntryPress(item)}
                                    activeOpacity={0.6}
                                    style={{
                                        flexDirection: 'row', alignItems: 'center',
                                        paddingVertical: 14,
                                        borderTopWidth: index > 0 ? 1 : 0,
                                        borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                                    }}
                                >
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
                                                }}> · {item.orderProductName}</Text>
                                            ) : null}
                                        </Text>

                                        {/* Line 2: date + status pill or action button (all inline) */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
                                            <Text style={{
                                                fontFamily: 'PlusJakartaSans_400Regular',
                                                fontSize: 11,
                                                color: isDark ? '#64748B' : '#94A3B8',
                                            }}>
                                                {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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

                                    {/* Right: amount + delete/lock */}
                                    <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                                        <Text style={{
                                            fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15,
                                            color: isInflow ? '#10B981' : '#EF4444',
                                        }}>
                                            {isInflow ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
                                        </Text>
                                        <View style={{ marginTop: 4 }}>
                                            {!item.orderId ? (
                                                <TouchableOpacity
                                                    onPress={(e) => { e.stopPropagation(); handleDeleteEntry(item); }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    style={{
                                                        width: 24, height: 24, borderRadius: 6,
                                                        backgroundColor: 'rgba(239,68,68,0.10)',
                                                        alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    <Trash2 size={11} color="#EF4444" />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                                    <Lock size={11} color={isDark ? '#94A3B8' : '#6B7280'} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
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
                                        className={cn("flex-1 py-3 rounded-xl items-center", paymentForm.type === 'PaymentIn' ? "bg-success" : "bg-transparent")}
                                    >
                                        <Text className={cn("font-sans-bold text-xs", paymentForm.type === 'PaymentIn' ? "text-white" : "text-secondary dark:text-secondary-dark")}>
                                            IN
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setPaymentForm({ ...paymentForm, type: 'PaymentOut' })}
                                        className={cn("flex-1 py-3 rounded-xl items-center", paymentForm.type === 'PaymentOut' ? "bg-danger" : "bg-transparent")}
                                    >
                                        <Text className={cn("font-sans-bold text-xs", paymentForm.type === 'PaymentOut' ? "text-white" : "text-secondary dark:text-secondary-dark")}>
                                            OUT
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
                                        (selectedEntry?.amount || 0) < 0 ? "text-success" : "text-danger"
                                    )}>₹{Math.abs(selectedEntry?.amount || 0).toLocaleString()}</Text>
                                </View>
                            </View>
                            <Button variant="secondary" onPress={() => setOrderModalVisible(false)} className="w-full">
                                <Text className="text-secondary dark:text-secondary-dark font-sans-bold">Close</Text>
                            </Button>
                        </Card>
                    </View>
                </Modal>
            </SafeAreaView>

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
                title="Delete Transaction?"
                message="This will permanently delete this manual payment entry. This cannot be undone."
                onConfirm={confirmDeleteEntry}
                onCancel={() => setDeleteEntryVisible(false)}
                confirmText="Delete"
                type="danger"
                loading={deleteEntryLoading}
            />
        </Background >
    );
}

