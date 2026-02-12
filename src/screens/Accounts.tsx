import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { Input } from '../components/Input';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { DirectoryItem } from '../utils/types';
import { Search, User, TrendingUp, TrendingDown, ChevronRight, Users, Building2, Truck } from 'lucide-react-native';
import { cn } from '../utils/cn';
import { useNavigation } from '@react-navigation/native';

type AccountType = 'ALL' | 'Vendor' | 'Customer' | 'Pickup Person';

export default function Accounts() {
    const navigation = useNavigation();
    const { userId } = useTransactions();
    const [accounts, setAccounts] = useState<DirectoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<AccountType>('ALL');

    useEffect(() => {
        if (userId) {
            loadAccounts();
        }
    }, [userId]);

    const loadAccounts = async () => {
        if (!userId) return;
        setLoading(true);
        const data = await supabaseService.getDirectoryWithBalances(userId);
        setAccounts(data);
        setLoading(false);
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'ALL' || acc.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const getBalanceColor = (balance: number, type: string) => {
        if (balance === 0) return 'text-gray-400';
        if (type === 'Customer') {
            return balance > 0 ? 'text-emerald-400' : 'text-rose-400';
        }
        // For Vendors and Pickup Persons, positive balance means we owe them? 
        // In our ledger, Positive = Receivable (from us to them? No, Positive = They owe us).
        // Let's stick to Positive = Credit (owing to us), Negative = Debit (we owe them).
        return balance > 0 ? 'text-emerald-400' : 'text-rose-400';
    };

    return (
        <Background>
            <View className="px-6 py-4">
                <Text className="text-white font-sans-bold text-2xl mb-4">Accounts</Text>

                {/* Search */}
                <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <Input
                        placeholder="Search accounts..."
                        placeholderTextColor="#64748b"
                        className="flex-1 ml-3 text-white font-sans h-9 border-0 bg-transparent"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        containerClassName="mb-0 h-auto"
                    />
                </View>

                {/* Filter Tabs */}
                <View className="flex-row gap-2 mb-4">
                    {(['ALL', 'Vendor', 'Customer', 'Pickup Person'] as AccountType[]).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-2 rounded-full border",
                                activeTab === tab ? "bg-indigo-500 border-indigo-500" : "bg-white/5 border-white/10"
                            )}
                        >
                            <Text className={cn(
                                "text-[10px] font-sans-bold",
                                activeTab === tab ? "text-white" : "text-gray-400"
                            )}>
                                {tab.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color="#6366f1" size="large" />
                </View>
            ) : (
                <FlatList
                    data={filteredAccounts}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => (navigation as any).navigate('AccountDetail', { person: item })}
                        >
                            <GlassCard className="mb-4">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center flex-1">
                                        <View className="bg-indigo-500/20 p-3 rounded-2xl mr-4">
                                            {item.type === 'Vendor' ? <Building2 size={20} color="#818cf8" /> :
                                                item.type === 'Customer' ? <Users size={20} color="#818cf8" /> :
                                                    <Truck size={20} color="#818cf8" />}
                                        </View>
                                        <View>
                                            <Text className="text-white font-sans-bold text-lg">{item.name}</Text>
                                            <Text className="text-gray-400 font-sans text-xs">{item.type}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className={cn("font-sans-bold text-lg", getBalanceColor(item.balance || 0, item.type))}>
                                            ₹{Math.abs(item.balance || 0).toLocaleString()}
                                        </Text>
                                        <View className="flex-row items-center">
                                            {(item.balance || 0) > 0 ? (
                                                <TrendingUp size={12} color="#34d399" />
                                            ) : (item.balance || 0) < 0 ? (
                                                <TrendingDown size={12} color="#f87171" />
                                            ) : null}
                                            <Text className="text-gray-500 font-sans text-[10px] ml-1">
                                                {(item.balance || 0) >= 0 ? 'RECEIVABLE' : 'PAYABLE'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-500 font-sans">No accounts found</Text>
                        </View>
                    }
                />
            )}
        </Background>
    );
}
