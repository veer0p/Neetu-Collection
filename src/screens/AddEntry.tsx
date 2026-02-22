import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, TextInput, Pressable, Alert, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { supabase } from '../utils/supabase';
import {
    ChevronLeft, Package, User, ShoppingBag, Truck, IndianRupee,
    FileText, Check, MapPin, CalendarDays, ChevronDown, Clock
} from 'lucide-react-native';
import { BottomSheetPicker, PickerOption } from '../components/BottomSheetPicker';
import { cn } from '../utils/cn';
import { OrderStatus, Order } from '../utils/types';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Booked', 'Shipped', 'Delivered', 'Canceled'];

// Move inner components outside to prevent re-mounting on state changes (fixes keyboard closing issue)
const Section = ({ title, icon: Icon, children, isDark }: any) => (
    <View className="mb-6">
        <View className="flex-row items-center mb-3 px-1">
            <Icon size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
            <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm ml-2 uppercase tracking-wider">{title}</Text>
        </View>
        <Card className="p-4">{children}</Card>
    </View>
);

const ToggleRow = ({ label, value, options, onToggle, isDark }: { label: string, value: string, options: { label: string, value: string, color: string }[], onToggle: (v: any) => void, isDark: boolean }) => (
    <View className="mb-4">
        <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs mb-2 ml-1 uppercase">{label}</Text>
        <View className="flex-row bg-surface dark:bg-surface-dark rounded-2xl p-1.5 border border-divider dark:border-divider-dark justify-between">
            {options.map(opt => (
                <TouchableOpacity
                    key={opt.value}
                    onPress={() => onToggle(opt.value)}
                    className={cn("flex-1 py-3 rounded-xl items-center mx-1", value === opt.value ? opt.color : "bg-transparent")}
                >
                    <Text className={cn("text-[10px] font-sans-bold", value === opt.value ? "text-white" : "text-secondary dark:text-secondary-dark")}>{opt.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

export default function AddEntry({ route, navigation }: any) {
    const editingOrder = route.params?.orderData as Order | undefined;
    const { userId, refresh } = useTransactions();
    const { isDark } = useTheme();

    // Refs for keyboard focus flow
    const customerRef = useRef<TextInput>(null);
    const vendorRef = useRef<TextInput>(null);
    const pickupRef = useRef<TextInput>(null);
    const costPriceRef = useRef<TextInput>(null);
    const salePriceRef = useRef<TextInput>(null);
    const pickupChRef = useRef<TextInput>(null);
    const shipChRef = useRef<TextInput>(null);
    const trackingRef = useRef<TextInput>(null);
    const notesRef = useRef<TextInput>(null);

    const [form, setForm] = useState({
        productName: editingOrder?.productName || '',
        vendorName: editingOrder?.vendorName || '',
        customerName: editingOrder?.customerName || '',
        pickupPersonName: editingOrder?.pickupPersonName || '',
        productId: editingOrder?.productId || '',
        customerId: editingOrder?.customerId || '',
        vendorId: editingOrder?.vendorId || '',
        pickupPersonId: editingOrder?.pickupPersonId || '',
        originalPrice: editingOrder?.originalPrice?.toString() || '',
        sellingPrice: editingOrder?.sellingPrice?.toString() || '',
        shippingCharges: editingOrder?.shippingCharges?.toString() || '',
        pickupCharges: editingOrder?.pickupCharges?.toString() || '',
        status: (editingOrder?.status as OrderStatus) || 'Booked',
        trackingId: editingOrder?.trackingId || '',
        courierName: editingOrder?.courierName || '',
        notes: editingOrder?.notes || '',
        customerPaymentStatus: (editingOrder?.customerPaymentStatus as 'Paid' | 'Udhar') || 'Udhar',
        // New simplified vendor payment logic
        vendorPaymentStatus: editingOrder?.paidByDriver ? 'DriverPaid' : ((editingOrder?.vendorPaymentStatus as 'Paid' | 'Udhar') || 'Udhar'),
        pickupPaymentStatus: (editingOrder?.pickupPaymentStatus as 'Paid' | 'Udhar') || 'Udhar',
        date: editingOrder?.date || new Date().toLocaleDateString('en-GB') // DD/MM/YYYY
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const statusOptions: PickerOption[] = [
        { label: 'Pending', value: 'Pending', color: '#9CA3AF' },
        { label: 'Booked', value: 'Booked', color: isDark ? '#FBBF24' : '#F59E0B' },
        { label: 'Shipped', value: 'Shipped', color: isDark ? '#818CF8' : '#4F46E5' },
        { label: 'Delivered', value: 'Delivered', color: isDark ? '#34D399' : '#10B981' },
        { label: 'Canceled', value: 'Canceled', color: isDark ? '#F87171' : '#EF4444' },
    ];

    const getStatusStyle = (status: string) => {
        const option = statusOptions.find(o => o.value === status);
        return {
            color: option?.color || '#9CA3AF',
            bg: `${option?.color}10`
        };
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setForm(prev => ({ ...prev, date: selectedDate.toLocaleDateString('en-GB') }));
        }
    };

    const parseDate = (dateStr: string) => {
        try {
            const [day, month, year] = dateStr.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? new Date() : date;
        } catch (e) {
            return new Date();
        }
    };

    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<{ type: string, data: any[] }>({ type: '', data: [] });

    // Master Data for Suggestions
    const [masterData, setMasterData] = useState({
        products: [] as any[],
        vendors: [] as any[],
        customers: [] as any[],
        pickups: [] as any[]
    });

    useEffect(() => {
        loadDirectory();
    }, [userId]);

    const loadDirectory = async () => {
        if (!userId) return;
        const [p, d] = await Promise.all([
            supabaseService.getProducts(),
            supabaseService.getDirectory(userId)
        ]);
        setMasterData({
            products: p,
            vendors: d.filter(item => item.type === 'Vendor'),
            customers: d.filter(item => item.type === 'Customer'),
            pickups: d.filter(item => item.type === 'Pickup Person')
        });
    };

    const handleSuggest = (text: string, type: 'product' | 'vendor' | 'customer' | 'pickup') => {
        let fieldName = '';
        let idFieldName = '';
        let list: any[] = [];

        switch (type) {
            case 'product': fieldName = 'productName'; idFieldName = 'productId'; list = masterData.products; break;
            case 'vendor': fieldName = 'vendorName'; idFieldName = 'vendorId'; list = masterData.vendors; break;
            case 'customer': fieldName = 'customerName'; idFieldName = 'customerId'; list = masterData.customers; break;
            case 'pickup': fieldName = 'pickupPersonName'; idFieldName = 'pickupPersonId'; list = masterData.pickups; break;
        }

        setForm(prev => ({ ...prev, [fieldName]: text, [idFieldName]: '' }));

        if (text.length > 1) {
            const filtered = list.filter(item => item.name.toLowerCase().includes(text.toLowerCase()));
            setSuggestions({ type, data: filtered.slice(0, 5) });
        } else {
            setSuggestions({ type: '', data: [] });
        }
    };

    const selectSuggestion = (item: any) => {
        switch (suggestions.type) {
            case 'product':
                setForm(prev => ({ ...prev, productName: item.name, productId: item.id }));
                customerRef.current?.focus();
                break;
            case 'customer':
                setForm(prev => ({ ...prev, customerName: item.name, customerId: item.id }));
                vendorRef.current?.focus();
                break;
            case 'vendor':
                setForm(prev => ({ ...prev, vendorName: item.name, vendorId: item.id }));
                pickupRef.current?.focus();
                break;
            case 'pickup':
                setForm(prev => ({ ...prev, pickupPersonName: item.name, pickupPersonId: item.id }));
                costPriceRef.current?.focus();
                break;
        }
        setSuggestions({ type: '', data: [] });
    };

    const renderSuggestions = (type: string) => {
        if (suggestions.type !== type || suggestions.data.length === 0) return null;
        return (
            <View className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-xl mt-1 overflow-hidden shadow-sm">
                {suggestions.data.map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        onPress={() => selectSuggestion(item)}
                        className="p-3 border-b border-divider dark:border-divider-dark last:border-0"
                    >
                        <Text className="text-primary dark:text-primary-dark font-sans-medium text-xs">{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // Ref-based guard to prevent duplicate rapid submissions
    const savingRef = useRef(false);

    const handleSave = async () => {
        if (!userId || !form.productName || !form.customerName || !form.vendorName) return;
        if (savingRef.current) return;
        savingRef.current = true;
        setLoading(true);

        try {
            const findOrCreate = async (name: string, type: 'Product' | 'Vendor' | 'Customer' | 'Pickup Person', currentId: string) => {
                if (!name) return null;
                if (currentId) return currentId; // Use existing ID if we have it

                // Check if already exists with this name and type
                const { data: existing } = await supabase
                    .from('directory')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('name', name)
                    .eq('type', type)
                    .maybeSingle();

                if (existing) return existing.id;

                // Create new
                const { data: newEntry } = await supabase
                    .from('directory')
                    .insert([{ user_id: userId, name, type }])
                    .select()
                    .single();
                return newEntry?.id || null;
            };

            const productId = await findOrCreate(form.productName, 'Product', form.productId);
            const customerId = await findOrCreate(form.customerName, 'Customer', form.customerId);
            const vendorId = await findOrCreate(form.vendorName, 'Vendor', form.vendorId);
            const pickupPersonId = await findOrCreate(form.pickupPersonName, 'Pickup Person', form.pickupPersonId);

            const orderData: any = {
                ...form,
                productId,
                customerId,
                vendorId,
                pickupPersonId,
                originalPrice: parseFloat(form.originalPrice) || 0,
                sellingPrice: parseFloat(form.sellingPrice) || 0,
                shippingCharges: parseFloat(form.shippingCharges) || 0,
                pickupCharges: parseFloat(form.pickupCharges) || 0,
                // Map the simplified UI choice back to DB fields
                vendorPaymentStatus: form.vendorPaymentStatus === 'DriverPaid' ? 'Paid' : form.vendorPaymentStatus,
                paidByDriver: form.vendorPaymentStatus === 'DriverPaid',
                id: editingOrder?.id
            };

            await supabaseService.saveOrder(orderData, userId);
            await refresh();
            setSuccessDialogVisible(true);
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error?.message || 'Failed to save order. Please try again.');
        } finally {
            setLoading(false);
            savingRef.current = false;
        }
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface dark:bg-surface-dark rounded-xl">
                        <ChevronLeft color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                    </TouchableOpacity>
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl">{editingOrder ? 'Edit Order' : 'New Order'}</Text>
                    <View className="w-10" />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 24, paddingBottom: isKeyboardVisible ? 300 : 80 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Status Selection */}
                        <Section title="Order Status" icon={Clock} isDark={isDark}>
                            <TouchableOpacity
                                onPress={() => setStatusPickerVisible(true)}
                                className="flex-row items-center justify-between p-4 bg-surface dark:bg-background-dark rounded-2xl border border-divider dark:border-divider-dark"
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-center">
                                    <View
                                        style={{ backgroundColor: getStatusStyle(form.status).bg }}
                                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                    >
                                        <Check size={20} color={getStatusStyle(form.status).color} />
                                    </View>
                                    <View>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs uppercase tracking-tight">Current Status</Text>
                                        <Text style={{ color: getStatusStyle(form.status).color }} className="font-sans-bold text-lg">
                                            {form.status}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronDown size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </Section>

                        {/* Date Selection */}
                        <Section title="Order Date" icon={CalendarDays} isDark={isDark}>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <View pointerEvents="none">
                                    <Input
                                        label="Date (DD/MM/YYYY)"
                                        placeholder="Select Date"
                                        value={form.date}
                                        editable={false}
                                        leftIcon={<CalendarDays size={18} color="#9CA3AF" />}
                                    />
                                </View>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={parseDate(form.date)}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                />
                            )}
                        </Section>

                        {/* Product & Parties */}
                        <Section title="Item & Parties" icon={Package} isDark={isDark}>
                            <Input
                                label="Product Name"
                                placeholder="Enter product..."
                                value={form.productName}
                                onChangeText={text => handleSuggest(text, 'product')}
                                leftIcon={<Package size={18} color="#9CA3AF" />}
                                returnKeyType="next"
                                onSubmitEditing={() => customerRef.current?.focus()}
                            />
                            {renderSuggestions('product')}

                            <Input
                                ref={customerRef}
                                label="Customer Name"
                                placeholder="Enter customer..."
                                value={form.customerName}
                                onChangeText={text => handleSuggest(text, 'customer')}
                                leftIcon={<User size={18} color="#9CA3AF" />}
                                returnKeyType="next"
                                onSubmitEditing={() => vendorRef.current?.focus()}
                            />
                            {renderSuggestions('customer')}

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Input
                                        ref={vendorRef}
                                        label="Vendor Name"
                                        placeholder="Supplier..."
                                        value={form.vendorName}
                                        onChangeText={text => handleSuggest(text, 'vendor')}
                                        leftIcon={<ShoppingBag size={18} color="#9CA3AF" />}
                                        returnKeyType="next"
                                        onSubmitEditing={() => pickupRef.current?.focus()}
                                    />
                                    {renderSuggestions('vendor')}
                                </View>
                                <View className="flex-1">
                                    <Input
                                        ref={pickupRef}
                                        label="Pickup Person"
                                        placeholder="Driver..."
                                        value={form.pickupPersonName}
                                        onChangeText={text => handleSuggest(text, 'pickup')}
                                        leftIcon={<Truck size={18} color="#9CA3AF" />}
                                        returnKeyType="next"
                                        onSubmitEditing={() => costPriceRef.current?.focus()}
                                    />
                                    {renderSuggestions('pickup')}
                                </View>
                            </View>
                        </Section>

                        {/* Financials */}
                        <Section title="Financials" icon={IndianRupee} isDark={isDark}>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Input
                                        ref={costPriceRef}
                                        label="Cost Price"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.originalPrice}
                                        onChangeText={text => setForm(prev => ({ ...prev, originalPrice: text }))}
                                        returnKeyType="next"
                                        onSubmitEditing={() => salePriceRef.current?.focus()}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        ref={salePriceRef}
                                        label="Sales Price"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.sellingPrice}
                                        onChangeText={text => setForm(prev => ({ ...prev, sellingPrice: text }))}
                                        returnKeyType="next"
                                        onSubmitEditing={() => pickupChRef.current?.focus()}
                                    />
                                </View>
                            </View>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Input
                                        ref={pickupChRef}
                                        label="Pickup Charges"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.pickupCharges}
                                        onChangeText={text => setForm(prev => ({ ...prev, pickupCharges: text }))}
                                        returnKeyType="next"
                                        onSubmitEditing={() => shipChRef.current?.focus()}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        ref={shipChRef}
                                        label="Ship Charges"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.shippingCharges}
                                        onChangeText={text => setForm(prev => ({ ...prev, shippingCharges: text }))}
                                        returnKeyType="next"
                                        onSubmitEditing={() => trackingRef.current?.focus()}
                                    />
                                </View>
                            </View>
                        </Section>

                        {/* Payment Settlement */}
                        <Section title="Settlement" icon={Check} isDark={isDark}>
                            <ToggleRow
                                label="Customer Payment"
                                value={form.customerPaymentStatus}
                                options={[
                                    { label: 'UDHAR', value: 'Udhar', color: 'bg-danger' },
                                    { label: 'PAID', value: 'Paid', color: 'bg-success' }
                                ]}
                                onToggle={v => setForm(prev => ({ ...prev, customerPaymentStatus: v }))}
                                isDark={isDark}
                            />
                            <ToggleRow
                                label="Vendor Settlement (Purchase)"
                                value={form.vendorPaymentStatus}
                                options={[
                                    { label: 'UDHAR', value: 'Udhar', color: 'bg-danger' },
                                    { label: 'PAID', value: 'Paid', color: 'bg-success' },
                                    { label: 'PAID BY PICKUP BOY', value: 'DriverPaid', color: 'bg-blue-500' }
                                ]}
                                onToggle={v => setForm(prev => ({ ...prev, vendorPaymentStatus: v }))}
                                isDark={isDark}
                            />
                            {form.pickupPersonName && (
                                <View className={cn("mt-2 pt-2 border-t", isDark ? "border-divider-dark" : "border-divider")}>
                                    <ToggleRow
                                        label="Pickup Payment"
                                        value={form.pickupPaymentStatus}
                                        options={[
                                            { label: 'UDHAR', value: 'Udhar', color: 'bg-danger' },
                                            { label: 'PAID', value: 'Paid', color: 'bg-success' }
                                        ]}
                                        onToggle={v => setForm(prev => ({ ...prev, pickupPaymentStatus: v }))}
                                        isDark={isDark}
                                    />
                                </View>
                            )}
                        </Section>

                        {/* Additional Info */}
                        <Section title="Additional Info" icon={FileText} isDark={isDark}>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Input
                                        ref={trackingRef}
                                        label="Tracking ID"
                                        placeholder="AWB xxxx"
                                        value={form.trackingId}
                                        onChangeText={text => setForm(prev => ({ ...prev, trackingId: text }))}
                                        returnKeyType="next"
                                        onSubmitEditing={() => notesRef.current?.focus()}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        label="Courier Name"
                                        placeholder="Delhivery, Xpressbees..."
                                        value={form.courierName}
                                        onChangeText={text => setForm(prev => ({ ...prev, courierName: text }))}
                                    />
                                </View>
                            </View>
                            <Input
                                ref={notesRef}
                                label="Notes"
                                placeholder="Any extra details..."
                                multiline
                                value={form.notes}
                                onChangeText={text => setForm(prev => ({ ...prev, notes: text }))}
                            />
                        </Section>

                        <Button
                            onPress={handleSave}
                            disabled={loading || !form.productName || !form.customerName || !form.vendorName}
                            className="mt-4 mb-10 h-16 rounded-2xl"
                        >
                            <Text className="text-white font-sans-bold text-lg">{loading ? 'Saving...' : 'Save Order'}</Text>
                        </Button>
                    </ScrollView>
                </KeyboardAvoidingView>
                <BottomSheetPicker
                    visible={statusPickerVisible}
                    onClose={() => setStatusPickerVisible(false)}
                    title="Change Order Status"
                    options={statusOptions}
                    selectedValue={form.status}
                    onSelect={(val) => setForm(prev => ({ ...prev, status: val as OrderStatus }))}
                />
                <ConfirmDialog
                    visible={successDialogVisible}
                    title="Success!"
                    message={editingOrder ? 'Order has been updated successfully.' : 'New order has been created successfully.'}
                    type="success"
                    confirmText="OK"
                    cancelText=""
                    onConfirm={() => {
                        setSuccessDialogVisible(false);
                        navigation.goBack();
                    }}
                    onCancel={() => { }}
                />
            </SafeAreaView>
        </Background >
    );
}