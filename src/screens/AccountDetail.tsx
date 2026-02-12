import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { Input } from '../components/Input';
import { Button } from '../components/Button'; // Assuming Button accepts style props or className
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { DirectoryItem, LedgerEntry } from '../utils/types';
import { ArrowLeft, Plus, IndianRupee, FileText, Calendar, TrendingUp, TrendingDown, X } from 'lucide-react-native';
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
        amount: '',
        type: 'PaymentOut' as 'PaymentIn' | 'PaymentOut',
        notes: ''
    });

    useEffect(() => {
        loadLedger();
    }, []);

    const loadLedger = async () => {
        setLoading(true);
        const data = await supabaseService.getLedgerEntries(person.id);
        setLedger(data);
        setLoading(false);
    };

    const handleAddPayment = async () => {
        if (!userId || !paymentForm.amount) return;

        const amount = parseFloat(paymentForm.amount);
        // PaymentIn = customer pays us (reduces their debt to us - Positive balance reduces? No, 
        // if they owe us 1000 and pay 500, we should record -500 to bring balance to 500.
        // So PaymentIn = Negative amount in ledger.
        // PaymentOut = we pay vendor (reduces our debt to them - Negative balance becomes less negative).
        // If we owe 1000 (-1000) and pay 500, we record +500 to bring balance to -500.
        // So PaymentOut = Positive amount in ledger.

        const finalAmount = paymentForm.type === 'PaymentIn' ? -amount : amount;

        await supabaseService.addPayment({
            personId: person.id,
            amount: finalAmount,
            transactionType: paymentForm.type,
            notes: paymentForm.notes
        }, userId);

        setModalVisible(false);
        setPaymentForm({ amount: '', type: 'PaymentOut', notes: '' });
        loadLedger();
    };

    const currentBalance = ledger.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <Background>
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-white/5 bg-slate-900/50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-white/10 rounded-full">
                        <ArrowLeft color="white" size={20} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white font-sans-bold text-lg" numberOfLines={1}>{person.name}</Text>
                        <View className="flex-row items-center">
                            <View className={cn("w-2 h-2 rounded-full mr-2", person.type === 'Customer' ? "bg-emerald-400" : "bg-indigo-400")} />
                            <Text className="text-gray-400 font-sans text-xs">{person.type}</Text>
                        </View>
                    </View>
                    {/* Action Button in Header */}
                    <TouchableOpacity
                        onPress={() => {
                            setPaymentForm({ ...paymentForm, type: person.type === 'Customer' ? 'PaymentIn' : 'PaymentOut' });
                            setModalVisible(true);
                        }}
                        className="bg-indigo-500 px-3 py-2 rounded-full flex-row items-center"
                    >
                        <Plus color="white" size={16} />
                        <Text className="text-white font-sans-bold text-xs ml-1">Pay</Text>
                    </TouchableOpacity>
                </View>

                {/* Balance Card */}
                <View className="px-6 py-6">
                    <GlassCard className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/20">
                        <View className="items-center py-4">
                            <Text className="text-gray-300 font-sans text-xs tracking-widest mb-2">CURRENT BALANCE</Text>
                            <Text className={cn(
                                "text-4xl font-sans-bold mb-1",
                                currentBalance > 0 ? "text-emerald-400" : currentBalance < 0 ? "text-rose-400" : "text-white"
                            )}>
                                ₹{Math.abs(currentBalance).toLocaleString()}
                            </Text>
                            <View className={cn(
                                "px-3 py-1 rounded-full mt-2",
                                currentBalance > 0 ? "bg-emerald-500/20" : currentBalance < 0 ? "bg-rose-500/20" : "bg-gray-500/20"
                            )}>
                                <Text className={cn(
                                    "font-sans-bold text-[10px]",
                                    currentBalance > 0 ? "text-emerald-300" : currentBalance < 0 ? "text-rose-300" : "text-gray-300"
                                )}>
                                    {currentBalance > 0 ? 'RECEIVABLE (THEY OWE YOU)' : currentBalance < 0 ? 'PAYABLE (YOU OWE THEM)' : 'SETTLED'}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* Ledger Title */}
                <View className="px-6 pb-2">
                    <Text className="text-gray-400 font-sans-bold text-xs uppercase tracking-wider">Transaction History</Text>
                </View>

                {/* Ledger List */}
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#6366f1" size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={ledger}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center mb-3">
                                {/* Icon Column */}
                                <View className="mr-3">
                                    <View className={cn(
                                        "w-10 h-10 rounded-full items-center justify-center",
                                        item.amount > 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                                    )}>
                                        {item.amount > 0 ?
                                            <TrendingUp size={18} color="#34d399" /> :
                                            <TrendingDown size={18} color="#f87171" />
                                        }
                                    </View>
                                </View>

                                {/* Card Column */}
                                <GlassCard className="flex-1 py-3 px-4 bg-white/5 border-white/5">
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-white font-sans-bold text-sm">{item.transactionType}</Text>
                                            <Text className="text-gray-500 font-sans text-[10px] mt-0.5">
                                                {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className={cn(
                                                "font-sans-bold text-base",
                                                item.amount > 0 ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                                            </Text>
                                            {item.notes ? (
                                                <Text className="text-gray-500 font-sans text-[10px] mt-0.5 italic max-w-[100px]" numberOfLines={1}>
                                                    {item.notes}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </GlassCard>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 opacity-50">
                                <FileText size={48} color="gray" />
                                <Text className="text-gray-500 font-sans text-sm mt-4">No transactions found</Text>
                            </View>
                        }
                    />
                )}

                {/* Payment Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View className="flex-1 justify-end bg-black/80">
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            activeOpacity={1}
                            onPress={() => setModalVisible(false)}
                        />
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                            <View className="bg-slate-900 rounded-t-[30px] p-6 pb-8 border-t border-white/10 shadow-2xl shadow-indigo-500/20">
                                <View className="items-center mb-6">
                                    <View className="w-12 h-1.5 bg-gray-600/50 rounded-full mb-6" />
                                    <Text className="text-white font-sans-bold text-xl">Record New Payment</Text>
                                    <Text className="text-gray-400 text-xs mt-1">Update the ledger balance manually</Text>
                                </View>

                                <View className="flex-row mb-6 bg-slate-800 p-1 rounded-2xl border border-white/5">
                                    <TouchableOpacity
                                        onPress={() => setPaymentForm({ ...paymentForm, type: 'PaymentIn' })}
                                        className={cn("flex-1 py-3 rounded-xl items-center", paymentForm.type === 'PaymentIn' ? "bg-emerald-600" : "bg-transparent")}
                                    >
                                        <Text className={cn("font-sans-bold text-xs", paymentForm.type === 'PaymentIn' ? "text-white" : "text-gray-400")}>PAYMENT IN (+)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setPaymentForm({ ...paymentForm, type: 'PaymentOut' })}
                                        className={cn("flex-1 py-3 rounded-xl items-center", paymentForm.type === 'PaymentOut' ? "bg-rose-600" : "bg-transparent")}
                                    >
                                        <Text className={cn("font-sans-bold text-xs", paymentForm.type === 'PaymentOut' ? "text-white" : "text-gray-400")}>PAYMENT OUT (-)</Text>
                                    </TouchableOpacity>
                                </View>

                                <Input
                                    label="Amount (₹)"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    leftIcon={<IndianRupee size={18} color="#94a3b8" />}
                                    value={paymentForm.amount}
                                    onChangeText={text => setPaymentForm({ ...paymentForm, amount: text })}
                                    containerClassName="mb-4"
                                />

                                <Input
                                    label="Notes (Optional)"
                                    placeholder="e.g. UPI Ref, Cash, etc."
                                    leftIcon={<FileText size={18} color="#94a3b8" />}
                                    value={paymentForm.notes}
                                    onChangeText={text => setPaymentForm({ ...paymentForm, notes: text })}
                                />

                                <TouchableOpacity
                                    onPress={handleAddPayment}
                                    className={cn(
                                        "mt-6 py-4 rounded-xl items-center shadow-lg",
                                        paymentForm.type === 'PaymentIn' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                                    )}
                                >
                                    <Text className="text-white font-sans-bold text-base">Confirm Payment</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </SafeAreaView>
        </Background>
    );
}
