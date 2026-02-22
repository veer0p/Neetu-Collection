import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { Search, ChevronRight } from 'lucide-react-native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

type FilterTab = 'all' | 'customers' | 'vendors' | 'pickup';

export default function Ledger({ navigation }: { navigation: any }) {
    const { userId } = useTransactions();
    const { isDark } = useTheme();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterTab>('all');
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [settleLoading, setSettleLoading] = useState(false);

    const loadData = async () => {
        if (!userId) return;
        setLoading(true);
        const data = await supabaseService.getDirectoryWithBalances(userId);
        setAccounts(data);
        setLoading(false);
    };

    const handleQuickSettle = async (item: any) => {
        setSelectedAccount(item);
        setConfirmVisible(true);
    };

    const confirmSettle = async () => {
        if (!userId || !selectedAccount || !selectedAccount.balance) return;
        setSettleLoading(true);
        const isReceivable = selectedAccount.balance > 0;
        const type = isReceivable ? 'PaymentIn' : 'PaymentOut';

        try {
            await supabaseService.addPayment({
                personId: selectedAccount.id,
                amount: -selectedAccount.balance,
                transactionType: type,
                notes: 'Full settlement'
            }, userId);
            await loadData();
            setConfirmVisible(false);
        } catch (e) {
            console.error('Settlement failed:', e);
        } finally {
            setSettleLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [userId]));

    const filtered = accounts.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ||
            (filter === 'customers' && a.type === 'Customer') ||
            (filter === 'vendors' && a.type === 'Vendor') ||
            (filter === 'pickup' && a.type === 'Pickup Person');
        return matchSearch && matchFilter;
    });

    const toCollect = filtered.filter(a => a.balance > 0).sort((a, b) => b.balance - a.balance);
    const toPay = filtered.filter(a => a.balance < 0).sort((a, b) => a.balance - b.balance);
    const settled = filtered.filter(a => a.balance === 0 || !a.balance);

    const collectTotal = toCollect.reduce((s, a) => s + a.balance, 0);
    const payTotal = Math.abs(toPay.reduce((s, a) => s + a.balance, 0));

    const tabs: { id: FilterTab; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'customers', label: 'Customers' },
        { id: 'vendors', label: 'Vendors' },
        { id: 'pickup', label: 'Pickup' },
    ];

    const renderPerson = (item: any, isPayable: boolean) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => (navigation as any).navigate('AccountDetail', { person: item })}
            className="flex-row items-center justify-between py-4 border-b border-divider dark:border-divider-dark"
        >
            <View className="flex-1">
                <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">{item.name}</Text>
                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-0.5">{item.type}</Text>
            </View>
            <View className="flex-row items-center gap-3">
                <View className="items-end">
                    <Text className={cn(
                        "font-sans-bold text-base",
                        isPayable ? "text-danger" : "text-success"
                    )}>
                        ₹{Math.abs(item.balance || 0).toLocaleString()}
                    </Text>
                    {item.balance !== 0 && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleQuickSettle(item);
                            }}
                            className={cn(
                                "mt-1 px-2 py-0.5 rounded-md",
                                isPayable ? "bg-danger/10" : "bg-success/10"
                            )}
                        >
                            <Text className={cn(
                                "font-sans-bold text-[9px] uppercase",
                                isPayable ? "text-danger" : "text-success"
                            )}>
                                {isPayable ? "Paid?" : "Recv?"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );

    const sections = [
        ...(toCollect.length > 0 ? [{
            key: 'collect',
            title: `To Collect (${toCollect.length})`,
            total: `₹${collectTotal.toLocaleString()}`,
            color: 'text-success',
            data: toCollect,
            isPayable: false,
        }] : []),
        ...(toPay.length > 0 ? [{
            key: 'pay',
            title: `To Pay (${toPay.length})`,
            total: `₹${payTotal.toLocaleString()}`,
            color: 'text-danger',
            data: toPay,
            isPayable: true,
        }] : []),
        ...(settled.length > 0 ? [{
            key: 'settled',
            title: `Settled (${settled.length})`,
            total: '',
            color: 'text-secondary',
            data: settled,
            isPayable: false,
        }] : []),
    ];

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-4">Ledger</Text>

                    {/* Search */}
                    <View className="flex-row items-center bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl px-4 h-12 mb-4">
                        <Search size={18} color="#9CA3AF" />
                        <TextInput
                            placeholder="Search..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 ml-3 text-primary dark:text-primary-dark font-sans text-sm"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Filter chips */}
                    <View className="flex-row gap-2 mb-2">
                        {tabs.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                onPress={() => setFilter(t.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full",
                                    filter === t.id ? "bg-accent" : "bg-surface dark:bg-surface-dark"
                                )}
                            >
                                <Text className={cn(
                                    "font-sans-semibold text-xs",
                                    filter === t.id ? "text-white" : "text-secondary dark:text-secondary-dark"
                                )}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={sections}
                        keyExtractor={s => s.key}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                        renderItem={({ item: section }) => (
                            <View className="mb-6">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider">{section.title}</Text>
                                    {section.total ? (
                                        <Text className={cn("font-sans-bold text-sm", section.color)}>{section.total}</Text>
                                    ) : null}
                                </View>
                                <Card className="px-4 py-0">
                                    {section.data.map(item => renderPerson(item, section.isPayable))}
                                </Card>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View className="items-center py-20">
                                <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">No accounts found</Text>
                            </View>
                        }
                    />
                )}

                <ConfirmDialog
                    visible={confirmVisible}
                    title="Confirm Settlement"
                    message={`Are you sure you want to mark ₹${Math.abs(selectedAccount?.balance || 0).toLocaleString()} as ${selectedAccount?.balance > 0 ? 'Received' : 'Paid'} for ${selectedAccount?.name}?`}
                    onConfirm={confirmSettle}
                    onCancel={() => setConfirmVisible(false)}
                    confirmText={selectedAccount?.balance > 0 ? "Mark Received" : "Mark Paid"}
                    type="success"
                    loading={settleLoading}
                />
            </SafeAreaView>
        </Background>
    );
}
