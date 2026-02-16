import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabaseService } from '../store/supabaseService';
import { Search, UserPlus, Phone, MapPin, ChevronRight, X, User, Truck, Package, Settings } from 'lucide-react-native';
import { useTransactions } from '../hooks/useTransactions';
import { cn } from '../utils/cn';
import { DirectoryItem } from '../utils/types';

type DirectoryType = 'Customer' | 'Vendor' | 'Product' | 'Pickup Person';

export default function Directory() {
    const { userId } = useTransactions();
    const [activeTab, setActiveTab] = useState<DirectoryType>('Customer');
    const [items, setItems] = useState<DirectoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<DirectoryItem> | null>(null);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });

    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const data = await supabaseService.getDirectory(userId);
        setItems(data.filter(item => item.type === activeTab));
        setLoading(false);
    }, [userId, activeTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleSave = async () => {
        if (!userId || !form.name) return;
        setLoading(true);
        try {
            const payload: Partial<DirectoryItem> = {
                ...form,
                type: activeTab,
                id: editingItem?.id
            };
            await supabaseService.saveDirectoryItem(payload, userId);
            setModalVisible(false);
            setForm({ name: '', phone: '', address: '' });
            setEditingItem(null);
            loadData();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (item: DirectoryItem) => {
        setEditingItem(item);
        setForm({ name: item.name, phone: item.phone || '', address: item.address || '' });
        setModalVisible(true);
    };

    const tabs: { id: DirectoryType, label: string, icon: any }[] = [
        { id: 'Customer', label: 'Customers', icon: User },
        { id: 'Vendor', label: 'Vendors', icon: Truck },
        { id: 'Product', label: 'Products', icon: Package },
        { id: 'Pickup Person', label: 'Pickup', icon: MapPin },
    ];

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-4">Directory</Text>

                    {/* Search & Add */}
                    <View className="flex-row gap-3 mb-6">
                        <View className="flex-1 flex-row items-center bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl px-4 h-12">
                            <Search size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-primary dark:text-primary-dark font-sans text-base"
                                placeholder="Search..."
                                placeholderTextColor="#94a3b8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                setEditingItem(null);
                                setForm({ name: '', phone: '', address: '' });
                                setModalVisible(true);
                            }}
                            className="bg-accent w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-accent/20"
                        >
                            <UserPlus size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 mb-6">
                        <View className="flex-row gap-2">
                            {tabs.map(tab => (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full border",
                                        activeTab === tab.id
                                            ? "bg-accent border-accent"
                                            : "bg-surface dark:bg-surface-dark border-divider dark:border-divider-dark"
                                    )}
                                >
                                    <View className="flex-row items-center">
                                        <tab.icon size={14} color={activeTab === tab.id ? "white" : "#64748b"} />
                                        <Text className={cn(
                                            "font-sans-semibold text-xs ml-2",
                                            activeTab === tab.id ? "text-white" : "text-secondary dark:text-secondary-dark"
                                        )}>{tab.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
                >
                    {loading && !refreshing ? (
                        <View className="py-20 "><ActivityIndicator color="#4F46E5" /></View>
                    ) : (
                        <View className="pb-10">
                            {filteredItems.map((item, i) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => openEdit(item)}
                                    className={cn("flex-row items-center py-4", i > 0 && "border-t border-divider dark:border-divider-dark")}
                                >
                                    <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                        <User size={20} color="#4F46E5" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">{item.name}</Text>
                                        {item.phone && (
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-0.5">{item.phone}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {filteredItems.length === 0 && (
                                <View className="py-20 items-center">
                                    <Text className="text-secondary font-sans italic">No items found</Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Edit/Add Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View className="flex-1 justify-center bg-black/50 p-6">
                        <Card className="p-6">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">
                                    {editingItem ? 'Edit' : 'Add'} {activeTab}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <View className="gap-4">
                                <Input label="Name" value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} autoFocus />
                                {activeTab !== 'Product' && (
                                    <>
                                        <Input label="Phone" value={form.phone} onChangeText={t => setForm(p => ({ ...p, phone: t }))} keyboardType="phone-pad" />
                                        <Input label="Address" value={form.address} onChangeText={t => setForm(p => ({ ...p, address: t }))} multiline />
                                    </>
                                )}
                            </View>

                            <Button onPress={handleSave} className="mt-8 h-14" disabled={!form.name || loading}>
                                <Text className="text-white font-sans-bold text-lg">{loading ? 'Saving...' : 'Save'}</Text>
                            </Button>
                        </Card>
                    </View>
                </Modal>
            </SafeAreaView>
        </Background>
    );
}
