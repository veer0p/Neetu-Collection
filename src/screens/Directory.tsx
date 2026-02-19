import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Clipboard, ToastAndroid, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabaseService } from '../store/supabaseService';
import { Search, UserPlus, Phone, MapPin, ChevronRight, X, User, Truck, Package, Copy, Plus, Trash2 } from 'lucide-react-native';
import { useTransactions } from '../hooks/useTransactions';
import { cn } from '../utils/cn';
import { DirectoryItem } from '../utils/types';
import { useTheme } from '../context/ThemeContext';

type DirectoryType = 'Customer' | 'Vendor' | 'Product' | 'Pickup Person';

const getAddresses = (address: string | undefined): string[] => {
    if (!address) return [];
    try {
        const parsed = JSON.parse(address);
        if (Array.isArray(parsed)) return parsed.filter(a => a.trim() !== '');
    } catch (e) { }
    return address.trim() !== '' ? [address] : [];
};

export default function Directory() {
    const { userId } = useTransactions();
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<DirectoryType>('Customer');
    const [items, setItems] = useState<DirectoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<DirectoryItem> | null>(null);
    const [form, setForm] = useState<{ name: string; phone: string; addresses: string[] }>({
        name: '', phone: '', addresses: ['']
    });

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

    const handleCopy = (text: string) => {
        Clipboard.setString(text);
        if (Platform.OS === 'android') {
            ToastAndroid.show('Address copied!', ToastAndroid.SHORT);
        } else {
            Alert.alert('Copied', 'Address copied to clipboard');
        }
    };

    const handleSave = async () => {
        if (!userId || !form.name) return;
        setLoading(true);
        try {
            const cleanAddresses = form.addresses.filter(a => a.trim() !== '');
            const payload: Partial<DirectoryItem> = {
                name: form.name,
                phone: form.phone,
                address: JSON.stringify(cleanAddresses),
                type: activeTab,
                id: editingItem?.id
            };
            await supabaseService.saveDirectoryItem(payload, userId);
            setModalVisible(false);
            setForm({ name: '', phone: '', addresses: [''] });
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
        const addrs = getAddresses(item.address);
        setForm({
            name: item.name,
            phone: item.phone || '',
            addresses: addrs.length > 0 ? addrs : ['']
        });
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

    const addAddressField = () => {
        setForm(prev => ({ ...prev, addresses: [...prev.addresses, ''] }));
    };

    const removeAddressField = (index: number) => {
        setForm(prev => ({
            ...prev,
            addresses: prev.addresses.filter((_, i) => i !== index)
        }));
    };

    const updateAddress = (text: string, index: number) => {
        setForm(prev => {
            const newAddrs = [...prev.addresses];
            newAddrs[index] = text;
            return { ...prev, addresses: newAddrs };
        });
    };

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
                                setForm({ name: '', phone: '', addresses: [''] });
                                setModalVisible(true);
                            }}
                            className="bg-accent w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-accent/20"
                        >
                            <UserPlus size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="-mx-6 mb-6"
                        contentContainerStyle={{ paddingHorizontal: 24 }}
                    >
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#818CF8' : '#4F46E5'} />}
                >
                    {loading && !refreshing ? (
                        <View className="py-20 "><ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} /></View>
                    ) : (
                        <View >
                            {filteredItems.map((item, i) => {
                                const addrs = getAddresses(item.address);
                                return (
                                    <Card
                                        key={item.id}
                                        className={cn("mb-3 p-4 border border-black/[0.08] dark:border-white/10")}
                                    >
                                        <TouchableOpacity
                                            onPress={() => openEdit(item)}
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center justify-between mb-3">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                                        <User size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base" numberOfLines={1}>{item.name}</Text>
                                                        {item.phone && (
                                                            <View className="flex-row items-center mt-0.5">
                                                                <Phone size={10} color="#64748b" />
                                                                <Text className="text-secondary dark:text-secondary-dark font-sans text-[11px] ml-1">{item.phone}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <ChevronRight size={18} color="#94a3b8" />
                                            </View>
                                        </TouchableOpacity>

                                        {addrs.length > 0 && (
                                            <View className="mt-1">
                                                <View className="bg-surface dark:bg-background-dark/50 rounded-xl p-3 flex-row items-start border border-divider/50 dark:border-divider-dark/50">
                                                    <MapPin size={14} color="#64748b" style={{ marginTop: 2, marginRight: 8 }} />
                                                    <Text className="flex-1 text-secondary dark:text-secondary-dark font-sans text-xs leading-4" numberOfLines={2}>
                                                        {addrs[0]}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => handleCopy(addrs[0])}
                                                        className="p-1.5 ml-2 rounded-lg bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark"
                                                    >
                                                        <Copy size={12} color={isDark ? '#818CF8' : '#4F46E5'} />
                                                    </TouchableOpacity>
                                                </View>
                                                {addrs.length > 1 && (
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] ml-2 mt-1">
                                                        + {addrs.length - 1} more addresses
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                    </Card>
                                );
                            })}
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
                    <View className="flex-1 justify-end bg-black/50">
                        <Card className="rounded-t-3xl p-6 pb-10">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">
                                    {editingItem ? 'Edit' : 'Add'} {activeTab}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-surface dark:bg-surface-dark rounded-full">
                                    <X size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="max-h-[70%]" showsVerticalScrollIndicator={false}>
                                <View className="gap-2">
                                    <Input label="Name" value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} />
                                    {activeTab !== 'Product' && (
                                        <>
                                            <Input label="Phone" value={form.phone} onChangeText={t => setForm(p => ({ ...p, phone: t }))} keyboardType="phone-pad" />

                                            <View className="mb-4">
                                                <View className="flex-row justify-between items-center mb-3">
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans-medium text-sm ml-1">Addresses</Text>
                                                    <TouchableOpacity
                                                        onPress={addAddressField}
                                                        className="flex-row items-center bg-accent dark:bg-accent-dark px-4 py-2 rounded-xl shadow-sm"
                                                    >
                                                        <Plus size={14} color="white" />
                                                        <Text className="text-white font-sans-bold text-xs ml-1">Add Address</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                {form.addresses.map((addr, idx) => (
                                                    <View key={idx} className="mb-5">
                                                        <View className="flex-row items-start gap-2">
                                                            <View className="flex-1">
                                                                <Input
                                                                    className="mb-0"
                                                                    placeholder={`Address ${idx + 1}`}
                                                                    value={addr}
                                                                    onChangeText={t => updateAddress(t, idx)}
                                                                    multiline
                                                                    numberOfLines={5}
                                                                    style={{ minHeight: 120, textAlignVertical: 'top' }}
                                                                />
                                                            </View>
                                                            <View className="gap-2">
                                                                {addr.trim() !== '' && (
                                                                    <TouchableOpacity
                                                                        onPress={() => handleCopy(addr)}
                                                                        className="p-3 bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-xl"
                                                                    >
                                                                        <Copy size={18} color={isDark ? '#818CF8' : '#4F46E5'} />
                                                                    </TouchableOpacity>
                                                                )}
                                                                {form.addresses.length > 1 && (
                                                                    <TouchableOpacity
                                                                        onPress={() => removeAddressField(idx)}
                                                                        className="p-3 bg-danger/10 rounded-xl"
                                                                    >
                                                                        <Trash2 size={18} color="#EF4444" />
                                                                    </TouchableOpacity>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                </View>
                            </ScrollView>

                            <View className="pt-4 border-t border-divider dark:border-divider-dark">
                                <Button onPress={handleSave} className="h-14 shadow-lg shadow-accent/20" disabled={!form.name || loading}>
                                    <Text className="text-white font-sans-bold text-lg">{loading ? 'Saving...' : 'Save Changes'}</Text>
                                </Button>
                            </View>
                        </Card>

                    </View>
                </Modal>
            </SafeAreaView>
        </Background>
    );
}
