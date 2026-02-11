import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { DirectoryItem } from '../utils/types';
import { User, MapPin, Phone, Plus, Search, Trash2, Users, Building2, X } from 'lucide-react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';

type DirectoryTab = 'VENDOR' | 'CUSTOMER';

export default function Directory() {
    const { userId } = useTransactions();
    const [activeTab, setActiveTab] = useState<DirectoryTab>('VENDOR');
    const [directory, setDirectory] = useState<DirectoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean, id: string, name: string }>({
        visible: false,
        id: '',
        name: ''
    });

    const [form, setForm] = useState({
        id: '',
        name: '',
        address: '',
        phone: '',
    });

    useEffect(() => {
        if (userId) {
            loadDirectory();
        }
    }, [userId]);

    const loadDirectory = async () => {
        if (!userId) return;
        setLoading(true);
        const data = await supabaseService.getDirectory(userId);
        setDirectory(data);
        setLoading(false);
    };

    const filteredList = directory.filter(item =>
        item.type === (activeTab === 'VENDOR' ? 'Vendor' : 'Customer') &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!userId) return;
        if (!form.name.trim()) {
            setValidationError('Name is required to save an entry.');
            return;
        }

        const newItem: DirectoryItem = {
            id: form.id,
            name: form.name,
            type: activeTab === 'VENDOR' ? 'Vendor' : 'Customer',
            address: form.address,
            phone: form.phone,
            createdAt: Date.now(),
        };

        await supabaseService.saveDirectoryItem(newItem, userId);
        await loadDirectory();
        setModalVisible(false);
        setForm({ id: '', name: '', address: '', phone: '' });
    };

    const handleDelete = (id: string, name: string) => {
        setDeleteDialog({ visible: true, id, name });
    };

    const confirmDelete = async () => {
        const { id } = deleteDialog;
        await supabaseService.deleteDirectoryItem(id);
        await loadDirectory();
        setDeleteDialog({ visible: false, id: '', name: '' });
    };

    const openEdit = (item: DirectoryItem) => {
        setForm({
            id: item.id,
            name: item.name,
            address: item.address || '',
            phone: item.phone || '',
        });
        setModalVisible(true);
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-white font-sans-bold text-2xl">Directory</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setForm({ id: '', name: '', address: '', phone: '' });
                                setModalVisible(true);
                            }}
                            className="bg-indigo-500 p-2 rounded-full"
                        >
                            <Plus color="white" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row bg-white/10 border border-white/20 p-1 rounded-2xl mt-4">
                        <TouchableOpacity
                            onPress={() => setActiveTab('VENDOR')}
                            className={cn(
                                "flex-1 flex-row py-3 rounded-xl items-center justify-center gap-2",
                                activeTab === 'VENDOR' ? "bg-indigo-500" : "transparent"
                            )}
                        >
                            <Building2 size={16} color={activeTab === 'VENDOR' ? "white" : "#94a3b8"} />
                            <Text className={cn(
                                "font-sans-bold text-xs",
                                activeTab === 'VENDOR' ? "text-white" : "text-gray-400"
                            )}>VENDORS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('CUSTOMER')}
                            className={cn(
                                "flex-1 flex-row py-3 rounded-xl items-center justify-center gap-2",
                                activeTab === 'CUSTOMER' ? "bg-indigo-500" : "transparent"
                            )}
                        >
                            <Users size={16} color={activeTab === 'CUSTOMER' ? "white" : "#94a3b8"} />
                            <Text className={cn(
                                "font-sans-bold text-xs",
                                activeTab === 'CUSTOMER' ? "text-white" : "text-gray-400"
                            )}>CUSTOMERS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mt-4">
                        <Search size={20} color="#94a3b8" />
                        <Input
                            placeholder={`Search ${activeTab.toLowerCase()}s...`}
                            placeholderTextColor="#64748b"
                            className="flex-1 ml-3 text-white font-sans h-full border-0 bg-transparent"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            containerClassName="mb-0 h-auto"
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredList}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 }}
                    onRefresh={loadDirectory}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-500 font-sans">No {activeTab.toLowerCase()} found</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => openEdit(item)}>
                            <GlassCard className="mb-4">
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-white font-sans-bold text-lg">{item.name}</Text>

                                        {item.phone && (
                                            <View className="flex-row items-center mt-2">
                                                <Phone size={12} color="#94a3b8" />
                                                <Text className="text-gray-400 font-sans text-xs ml-2">{item.phone}</Text>
                                            </View>
                                        )}

                                        {item.address && (
                                            <View className="flex-row items-center mt-1">
                                                <MapPin size={12} color="#94a3b8" />
                                                <Text className="text-gray-400 font-sans text-xs ml-2" numberOfLines={1}>{item.address}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item.id, item.name)}
                                        className="p-2"
                                    >
                                        <Trash2 size={18} color="#f87171" />
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    )}
                />

                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View className="flex-1 justify-end bg-black/60">
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        >
                            <View className="bg-slate-900 rounded-t-[40px] p-6 pb-12 border-t border-white/10">
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-white font-sans-bold text-xl">
                                        {form.id ? 'Edit' : 'Add'} {activeTab === 'VENDOR' ? 'Vendor' : 'Customer'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <X color="white" size={24} />
                                    </TouchableOpacity>
                                </View>

                                <Input
                                    label="Full Name *"
                                    placeholder="Enter name"
                                    leftIcon={<User size={18} color="#94a3b8" />}
                                    value={form.name}
                                    onChangeText={text => setForm({ ...form, name: text })}
                                />

                                <Input
                                    label="Phone Number"
                                    placeholder="Enter phone number"
                                    keyboardType="phone-pad"
                                    leftIcon={<Phone size={18} color="#94a3b8" />}
                                    value={form.phone}
                                    onChangeText={text => setForm({ ...form, phone: text })}
                                />

                                <Input
                                    label="Address"
                                    placeholder="Enter full address"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    containerClassName="h-auto"
                                    className="h-24 py-3"
                                    leftIcon={<MapPin size={18} color="#94a3b8" />}
                                    value={form.address}
                                    onChangeText={text => setForm({ ...form, address: text })}
                                />

                                <Button onPress={handleSave} className="mt-4 rounded-full">
                                    {form.id ? 'Update' : 'Save'} {activeTab === 'VENDOR' ? 'Vendor' : 'Customer'}
                                </Button>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </SafeAreaView>

            <ConfirmDialog
                visible={deleteDialog.visible}
                title="Delete Entry"
                message={`Are you sure you want to delete ${deleteDialog.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ ...deleteDialog, visible: false })}
            />
            <ConfirmDialog
                visible={!!validationError}
                title="Input Error"
                message={validationError || ''}
                confirmText="Got it"
                cancelText=""
                onConfirm={() => setValidationError(null)}
                onCancel={() => setValidationError(null)}
            />
        </Background>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
