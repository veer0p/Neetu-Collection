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
import { ArrowLeft, Plus, IndianRupee, FileText, TrendingUp, TrendingDown, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cn } from '../utils/cn';

export default function AccountDetail() {
    const navigation = useNavigation();
    const route = useRoute();
    const { person } = route.params as { person: DirectoryItem };
    const { userId } = useTransactions();

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

    useEffect(() => { loadLedger(); }, []);
    useFocusEffect(useCallback(() => { loadLedger(); }, []));

    const loadLedger = async () => {
        setLoading(true);
        const data = await supabaseService.getLedgerEntries(person.id);
        setLedger(data);
        setLoading(false);
    };

    const handleAddPayment = async () => {
        if (!userId || !paymentForm.amount) return;
        const amount = parseFloat(paymentForm.amount);
        // Balance logic: PaymentIn reduces what they owe (if positive balance) 
        // Or increases what we owe them (if negative balance)
        // Wait, the ledger convention is: Sale = positive, Purchase = negative, PaymentIn = negative, PaymentOut = positive
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

    const currentBalance = ledger.reduce((acc, curr) => acc + curr.amount, 0);
    const filterTypes = ['All', 'Sale', 'Purchase', 'PaymentIn', 'PaymentOut'];

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 pt-4 pb-2 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface dark:bg-surface-dark rounded-xl mr-3">
                        <ArrowLeft color="#4F46E5" size={20} />
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
                            currentBalance > 0 ? "text-danger" : currentBalance < 0 ? "text-success" : "text-primary dark:text-primary-dark"
                        )}>
                            ₹{Math.abs(currentBalance).toLocaleString()}
                        </Text>
                        <Text className={cn("font-sans-semibold text-xs mt-1",
                            currentBalance > 0 ? "text-danger" : currentBalance < 0 ? "text-success" : "text-secondary dark:text-secondary-dark"
                        )}>
                            {currentBalance > 0 ? "You are owed" : currentBalance < 0 ? "You owe" : "Settled"}
                        </Text>
                    </Card>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-4" contentContainerStyle={{ gap: 8 }}>
                    {filterTypes.map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTypeFilter(t)}
                            className={cn(
                                "px-4 py-2 rounded-full",
                                typeFilter === t ? "bg-accent" : "bg-surface dark:bg-surface-dark"
                            )}
                        >
                            <Text className={cn(
                                "font-sans-semibold text-xs",
                                typeFilter === t ? "text-white" : "text-secondary dark:text-secondary-dark"
                            )}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Ledger List */}
                {loading ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator color="#4F46E5" size="large" /></View>
                ) : (
                    <FlatList
                        data={ledger.filter(e => typeFilter === 'All' || e.transactionType === typeFilter)}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => handleEntryPress(item)}
                                className={cn("flex-row items-center py-4", index > 0 && "border-t border-divider dark:border-divider-dark")}
                            >
                                <View className={cn(
                                    "w-10 h-10 rounded-xl items-center justify-center mr-4",
                                    item.amount < 0 ? "bg-success/10" : "bg-danger/10"
                                )}>
                                    {item.amount < 0 ? <TrendingUp size={20} color="#10B981" /> : <TrendingDown size={20} color="#EF4444" />}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">{item.transactionType}</Text>
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-0.5" numberOfLines={1}>{item.notes || 'No notes'}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className={cn("font-sans-bold text-base", item.amount < 0 ? "text-success" : "text-danger")}>
                                        {item.amount < 0 ? '-' : '+'}₹{Math.abs(item.amount).toLocaleString()}
                                    </Text>
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] mt-0.5">
                                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
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
                                    <X size={18} color="#9CA3AF" />
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
        </Background>
    );
}
