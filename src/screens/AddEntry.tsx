import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import {
    ChevronLeft, Package, User, ShoppingBag, Truck, IndianRupee,
    FileText, Check, MapPin
} from 'lucide-react-native';
import { cn } from '../utils/cn';
import { OrderStatus, Order } from '../utils/types';
import { useTheme } from '../context/ThemeContext';

const STATUS_OPTIONS: OrderStatus[] = ['Booked', 'Shipped', 'Delivered', 'Canceled'];

export default function AddEntry({ route, navigation }: any) {
    const editingOrder = route.params?.orderData as Order | undefined;
    const { userId, refresh } = useTransactions();
    const { isDark } = useTheme();

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
        vendorPaymentStatus: (editingOrder?.vendorPaymentStatus as 'Paid' | 'Udhar') || 'Udhar',
        pickupPaymentStatus: (editingOrder?.pickupPaymentStatus as 'Paid' | 'Udhar') || 'Udhar',
        paidByDriver: editingOrder?.paidByDriver || false,
        date: editingOrder?.date || new Date().toISOString().split('T')[0],
    });

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
    }, [userId]); // Added userId to dependency array to re-run when userId is available

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
        let list: any[] = [];

        switch (type) {
            case 'product': fieldName = 'productName'; list = masterData.products; break;
            case 'vendor': fieldName = 'vendorName'; list = masterData.vendors; break;
            case 'customer': fieldName = 'customerName'; list = masterData.customers; break;
            case 'pickup': fieldName = 'pickupPersonName'; list = masterData.pickups; break;
        }

        setForm(prev => ({ ...prev, [fieldName]: text }));

        if (text.length > 1) {
            const filtered = list.filter(item => item.name.toLowerCase().includes(text.toLowerCase()));
            setSuggestions({ type, data: filtered.slice(0, 5) });
        } else {
            setSuggestions({ type: '', data: [] });
        }
    };

    const selectSuggestion = (item: any) => {
        switch (suggestions.type) {
            case 'product': setForm(prev => ({ ...prev, productName: item.name, productId: item.id })); break;
            case 'vendor': setForm(prev => ({ ...prev, vendorName: item.name, vendorId: item.id })); break;
            case 'customer': setForm(prev => ({ ...prev, customerName: item.name, customerId: item.id })); break;
            case 'pickup': setForm(prev => ({ ...prev, pickupPersonName: item.name, pickupPersonId: item.id })); break;
        }
        setSuggestions({ type: '', data: [] });
    };

    const handleSave = async () => {
        if (!userId || !form.productName || !form.customerName || !form.vendorName) return;
        setLoading(true);

        try {
            const orderData: Partial<Order> = {
                ...form,
                originalPrice: parseFloat(form.originalPrice) || 0,
                sellingPrice: parseFloat(form.sellingPrice) || 0,
                shippingCharges: parseFloat(form.shippingCharges) || 0,
                pickupCharges: parseFloat(form.pickupCharges) || 0,
                id: editingOrder?.id
            };

            await supabaseService.saveOrder(orderData, userId);
            await refresh();
            navigation.goBack();
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setLoading(false);
        }
    };

    const Section = ({ title, icon: Icon, children }: any) => (
        <View className="mb-6">
            <View className="flex-row items-center mb-3 px-1">
                <Icon size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm ml-2 uppercase tracking-wider">{title}</Text>
            </View>
            <Card className="p-4">{children}</Card>
        </View>
    );

    const ToggleRow = ({ label, value, onToggle }: { label: string, value: 'Paid' | 'Udhar', onToggle: (v: 'Paid' | 'Udhar') => void }) => (
        <View className="flex-row items-center justify-between py-2">
            <Text className="text-primary dark:text-primary-dark font-sans-medium">{label}</Text>
            <View className="flex-row bg-surface dark:bg-surface-dark rounded-xl p-1 border border-divider dark:border-divider-dark">
                <TouchableOpacity
                    onPress={() => onToggle('Paid')}
                    className={cn("px-4 py-1.5 rounded-lg", value === 'Paid' ? "bg-success" : "bg-transparent")}
                >
                    <Text className={cn("text-xs font-sans-bold", value === 'Paid' ? "text-white" : "text-secondary dark:text-secondary-dark")}>PAID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onToggle('Udhar')}
                    className={cn("px-4 py-1.5 rounded-lg", value === 'Udhar' ? "bg-danger" : "bg-transparent")}
                >
                    <Text className={cn("text-xs font-sans-bold", value === 'Udhar' ? "text-white" : "text-secondary dark:text-secondary-dark")}>UDHAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
                        {/* Status */}
                        <View className="flex-row gap-2 mb-8 bg-surface dark:bg-surface-dark p-1 rounded-2xl border border-divider dark:border-divider-dark">
                            {STATUS_OPTIONS.map(s => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => setForm(prev => ({ ...prev, status: s }))}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl items-center",
                                        form.status === s ? "bg-accent shadow-sm" : "bg-transparent"
                                    )}
                                >
                                    <Text className={cn("text-[10px] font-sans-bold uppercase", form.status === s ? "text-white" : "text-secondary dark:text-secondary-dark")}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Product & Parties */}
                        <Section title="Item & Parties" icon={Package}>
                            <Input
                                label="Product Name"
                                placeholder="Search or type product..."
                                value={form.productName}
                                onChangeText={text => handleSuggest(text, 'product')}
                                leftIcon={<ShoppingBag size={18} color="#9CA3AF" />}
                            />
                            <Input
                                label="Customer"
                                placeholder="Search or type customer..."
                                value={form.customerName}
                                onChangeText={text => handleSuggest(text, 'customer')}
                                leftIcon={<User size={18} color="#9CA3AF" />}
                            />
                            <Input
                                label="Vendor"
                                placeholder="Search or type vendor..."
                                value={form.vendorName}
                                onChangeText={text => handleSuggest(text, 'vendor')}
                                leftIcon={<Truck size={18} color="#9CA3AF" />}
                            />
                            <Input
                                label="Pickup (Optional)"
                                placeholder="Search or type person..."
                                value={form.pickupPersonName}
                                onChangeText={text => handleSuggest(text, 'pickup')}
                                leftIcon={<MapPin size={18} color="#9CA3AF" />}
                            />
                        </Section>

                        {/* Financials */}
                        <Section title="Financials" icon={IndianRupee}>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Input
                                        label="Cost Price"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.originalPrice}
                                        onChangeText={text => setForm(prev => ({ ...prev, originalPrice: text }))}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        label="Sales Price"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.sellingPrice}
                                        onChangeText={text => setForm(prev => ({ ...prev, sellingPrice: text }))}
                                    />
                                </View>
                            </View>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Input
                                        label="Pickup Ch."
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.pickupCharges}
                                        onChangeText={text => setForm(prev => ({ ...prev, pickupCharges: text }))}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        label="Ship Ch."
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.shippingCharges}
                                        onChangeText={text => setForm(prev => ({ ...prev, shippingCharges: text }))}
                                    />
                                </View>
                            </View>
                        </Section>

                        {/* Payment Settlement */}
                        <Section title="Settlement" icon={Check}>
                            <ToggleRow
                                label="Customer Payment"
                                value={form.customerPaymentStatus}
                                onToggle={v => setForm(prev => ({ ...prev, customerPaymentStatus: v }))}
                            />
                            <ToggleRow
                                label="Vendor Payment"
                                value={form.vendorPaymentStatus}
                                onToggle={v => setForm(prev => ({ ...prev, vendorPaymentStatus: v }))}
                            />
                            {form.pickupPersonName && (
                                <View className={cn("mt-2 pt-2 border-t", isDark ? "border-divider-dark" : "border-divider")}>
                                    <ToggleRow
                                        label="Pickup Payment"
                                        value={form.pickupPaymentStatus}
                                        onToggle={v => setForm(prev => ({ ...prev, pickupPaymentStatus: v }))}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setForm(p => ({ ...p, paidByDriver: !p.paidByDriver }))}
                                        className="flex-row items-center py-2"
                                    >
                                        <View className={cn("w-5 h-5 rounded border items-center justify-center mr-3", form.paidByDriver ? "bg-accent border-accent" : "bg-transparent border-divider")}>
                                            {form.paidByDriver && <Check size={14} color="white" />}
                                        </View>
                                        <Text className="text-secondary font-sans text-xs">Paid by Driver — vendor settled at pickup</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Section>

                        {/* Additional Info */}
                        <Section title="Additional Info" icon={FileText}>
                            <Input
                                label="Tracking ID"
                                placeholder="AWB xxxx"
                                value={form.trackingId}
                                onChangeText={text => setForm(prev => ({ ...prev, trackingId: text }))}
                            />
                            <Input
                                label="Notes"
                                placeholder="Any extra details..."
                                multiline
                                value={form.notes}
                                onChangeText={text => setForm(prev => ({ ...prev, notes: text }))}
                            />
                        </Section>

                        <Button
                            onPress={handleSave}
                            disabled={loading || !form.productName || !form.customerName}
                            className="mt-4 mb-10 h-16 rounded-2xl"
                        >
                            <Text className="text-white font-sans-bold text-lg">{loading ? 'Saving...' : 'Save Order'}</Text>
                        </Button>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Suggestions Overlay */}
                {suggestions.data.length > 0 && (
                    <View
                        className="absolute bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl shadow-xl z-50 p-2"
                        style={{ top: 150, left: 24, right: 24, maxHeight: 200 }}
                    >
                        <ScrollView>
                            {suggestions.data.map((item, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => selectSuggestion(item)}
                                    className="p-3 border-b border-divider dark:border-divider-dark last:border-0"
                                >
                                    <Text className="text-primary dark:text-primary-dark font-sans-medium">{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </SafeAreaView>
        </Background>
    );
}
