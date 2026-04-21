import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, ActivityIndicator,
    TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import {
    Plus, X, Receipt, Home as HomeIcon, Package, Truck,
    Briefcase, CircleDollarSign, HelpCircle, Trash2, Calendar,
} from 'lucide-react-native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { Expense, ExpenseCategory } from '../utils/types';

const CATEGORIES: { id: ExpenseCategory; label: string; Icon: any; color: string }[] = [
    { id: 'Rent', label: 'Rent', Icon: HomeIcon, color: '#8B5CF6' },
    { id: 'Packaging', label: 'Packaging', Icon: Package, color: '#F59E0B' },
    { id: 'Travel', label: 'Travel', Icon: Truck, color: '#3B82F6' },
    { id: 'Courier', label: 'Courier', Icon: Receipt, color: '#EC4899' },
    { id: 'Salary', label: 'Salary', Icon: Briefcase, color: '#10B981' },
    { id: 'Other', label: 'Other', Icon: HelpCircle, color: '#6B7280' },
];

const getCategoryMeta = (cat: string) =>
    CATEGORIES.find(c => c.id === cat) || CATEGORIES[CATEGORIES.length - 1];

export default function Expenses({ navigation }: { navigation: any }) {
    const { userId } = useTransactions();
    const { isDark } = useTheme();
    const { isWeb, desktopContainerStyle } = useResponsive();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('Other');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    });

    const loadExpenses = async () => {
        if (!userId) return;
        setLoading(true);
        const data = await supabaseService.getExpenses(userId);
        setExpenses(data);
        setLoading(false);
    };

    useFocusEffect(useCallback(() => { loadExpenses(); }, [userId]));

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Group expenses by month
    const groupedExpenses = expenses.reduce((groups: Record<string, Expense[]>, exp) => {
        const createdDate = new Date(exp.createdAt);
        const key = `${createdDate.toLocaleString('default', { month: 'long' })} ${createdDate.getFullYear()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(exp);
        return groups;
    }, {});

    const sections = Object.entries(groupedExpenses).map(([month, items]) => ({
        month,
        items,
        total: items.reduce((s, e) => s + e.amount, 0),
    }));

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setCategory('Other');
        setNotes('');
        const d = new Date();
        setDate(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter an expense title.');
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert('Required', 'Please enter a valid amount.');
            return;
        }
        if (!userId) return;

        setSaving(true);
        try {
            await supabaseService.saveExpense({
                title: title.trim(),
                amount: Number(amount),
                category,
                date,
                notes: notes.trim() || undefined,
            }, userId);
            resetForm();
            setShowForm(false);
            await loadExpenses();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to save expense.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await supabaseService.deleteExpense(id);
                        await loadExpenses();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete.');
                    }
                }
            },
        ]);
    };

    const renderExpenseItem = (item: Expense) => {
        const meta = getCategoryMeta(item.category);
        const Icon = meta.Icon;
        return (
            <TouchableOpacity
                key={item.id}
                onLongPress={() => handleDelete(item.id)}
                activeOpacity={0.7}
                className="mb-2.5"
            >
                <View className="bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-divider dark:border-divider-dark">
                    <View className="flex-row items-center">
                        <View style={{
                            width: 42, height: 42, borderRadius: 12,
                            backgroundColor: `${meta.color}18`,
                            alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                            <Icon size={18} color={meta.color} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm" numberOfLines={1}>
                                {item.title}
                            </Text>
                            <View className="flex-row items-center mt-0.5 gap-2">
                                <Text style={{
                                    fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11,
                                    color: meta.color,
                                    backgroundColor: `${meta.color}15`,
                                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
                                    overflow: 'hidden',
                                }}>{meta.label}</Text>
                                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{item.date}</Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text style={{
                                fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16,
                                color: '#EF4444',
                            }}>
                                −₹{item.amount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    {item.notes ? (
                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-2 ml-[54px]" numberOfLines={1}>
                            {item.notes}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View style={[{ flex: 1, width: '100%' }, desktopContainerStyle]}>
                    {/* Header */}
                    <View className="px-6 pt-4 pb-2">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl">Expenses</Text>
                            <TouchableOpacity
                                onPress={() => setShowForm(true)}
                                activeOpacity={0.8}
                                style={{
                                    width: 40, height: 40, borderRadius: 14,
                                    backgroundColor: isDark ? '#818CF8' : '#4F46E5',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Plus size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Total Card */}
                        <View style={{
                            borderRadius: 20,
                            backgroundColor: isDark ? '#1E293B' : '#FEF2F2',
                            padding: 20,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)',
                        }}>
                            <Text style={{
                                color: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                                fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold',
                                textTransform: 'uppercase', letterSpacing: 1,
                            }}>Total Expenses</Text>
                            <Text style={{
                                color: '#EF4444',
                                fontSize: 36, fontFamily: 'PlusJakartaSans_800ExtraBold',
                                marginTop: 4,
                            }}>₹{totalExpenses.toLocaleString()}</Text>
                            <Text style={{
                                color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
                                fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium',
                                marginTop: 4,
                            }}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded</Text>
                        </View>
                    </View>

                    {/* Expense list */}
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" />
                        </View>
                    ) : (
                        <FlatList
                            data={sections}
                            keyExtractor={s => s.month}
                            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: isWeb ? 40 : 100 }}
                            renderItem={({ item: section }) => (
                                <View className="mb-4">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider">
                                            {section.month}
                                        </Text>
                                        <Text className="text-danger font-sans-bold text-xs">
                                            ₹{section.total.toLocaleString()}
                                        </Text>
                                    </View>
                                    {section.items.map(renderExpenseItem)}
                                </View>
                            )}
                            ListEmptyComponent={
                                <View className="items-center py-20">
                                    <View style={{
                                        width: 64, height: 64, borderRadius: 20,
                                        backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                                        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                    }}>
                                        <Receipt size={28} color={isDark ? '#F87171' : '#EF4444'} />
                                    </View>
                                    <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base mb-1">
                                        No expenses yet
                                    </Text>
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-sm text-center px-8">
                                        Tap the + button to add your first expense
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* Add Expense Modal */}
                <Modal
                    visible={showForm}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowForm(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => setShowForm(false)}
                            className="flex-1"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        />
                        <View style={{
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            paddingTop: 8,
                            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                            maxHeight: '85%',
                        }}>
                            {/* Drag handle */}
                            <View className="items-center mb-4">
                                <View style={{
                                    width: 40, height: 4, borderRadius: 2,
                                    backgroundColor: isDark ? '#334155' : '#E2E8F0',
                                }} />
                            </View>

                            <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
                                {/* Header */}
                                <View className="flex-row items-center justify-between mb-6">
                                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">
                                        Add Expense
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowForm(false)}>
                                        <X size={22} color={isDark ? '#94A3B8' : '#6B7280'} />
                                    </TouchableOpacity>
                                </View>

                                {/* Form Fields */}
                                <Input
                                    label="Title *"
                                    placeholder="e.g. Packaging supplies"
                                    value={title}
                                    onChangeText={setTitle}
                                />

                                <Input
                                    label="Amount (₹) *"
                                    placeholder="0"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />

                                <Input
                                    label="Date"
                                    placeholder="DD/MM/YYYY"
                                    value={date}
                                    onChangeText={setDate}
                                />

                                {/* Category */}
                                <Text className="text-secondary dark:text-secondary-dark font-sans-semibold text-xs mb-2 uppercase tracking-wider">
                                    Category
                                </Text>
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => setCategory(cat.id)}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center',
                                                paddingHorizontal: 14, paddingVertical: 10,
                                                borderRadius: 14, borderWidth: 1.5,
                                                borderColor: category === cat.id ? cat.color : (isDark ? '#334155' : '#E2E8F0'),
                                                backgroundColor: category === cat.id ? `${cat.color}15` : 'transparent',
                                            }}
                                        >
                                            <cat.Icon size={14} color={category === cat.id ? cat.color : (isDark ? '#64748B' : '#94A3B8')} />
                                            <Text style={{
                                                marginLeft: 6, fontSize: 12,
                                                fontFamily: category === cat.id ? 'PlusJakartaSans_600SemiBold' : 'PlusJakartaSans_400Regular',
                                                color: category === cat.id ? cat.color : (isDark ? '#94A3B8' : '#64748B'),
                                            }}>{cat.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Notes */}
                                <View className="mt-4 mb-6">
                                    <Input
                                        label="Notes (Optional)"
                                        placeholder="Add any notes..."
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                    />
                                </View>

                                {/* Save Button */}
                                <Button
                                    onPress={handleSave}
                                    loading={saving}
                                    className="mb-8"
                                >
                                    Add Expense
                                </Button>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </Background>
    );
}
