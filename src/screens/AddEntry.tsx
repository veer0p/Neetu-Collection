import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Switch, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { supabase } from '../utils/supabase';
import { calculateMargin, Order } from '../utils/types';
import {
    ShoppingBag, IndianRupee, FileText, TrendingUp, User,
    ShoppingCart, Truck, PlusCircle, LayoutGrid,
    ArrowRight, ChevronDown, ChevronRight, Package,
    BadgeCheck, Clock, UserCheck
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../utils/cn';

type OrderStatus = 'Pending' | 'Booked' | 'Shipped' | 'Delivered' | 'Canceled';

export default function AddEntry() {
    const navigation = useNavigation();
    const { userId } = useTransactions();
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Input Refs for Focus Management
    const vendorRef = useRef<TextInput>(null);
    const customerRef = useRef<TextInput>(null);
    const productRef = useRef<TextInput>(null);
    const purchaseRef = useRef<TextInput>(null);
    const sellingRef = useRef<TextInput>(null);
    const pickupChargeRef = useRef<TextInput>(null);
    const shippingChargeRef = useRef<TextInput>(null);
    const trackingRef = useRef<TextInput>(null);
    const notesRef = useRef<TextInput>(null);
    const driverRef = useRef<TextInput>(null);

    const [form, setForm] = useState({
        customerName: '',
        customerId: '',
        vendorName: '',
        vendorId: '',
        productName: '',
        productId: '',
        originalPrice: '',
        sellingPrice: '',
        pickupCharges: '',
        shippingCharges: '',
        status: 'Pending' as OrderStatus,
        vendorPaymentStatus: 'Paid' as 'Paid' | 'Udhar',
        customerPaymentStatus: 'Paid' as 'Paid' | 'Udhar',
        pickupPersonId: '',
        pickupPersonName: '',
        paidByDriver: false,
        pickupPaymentStatus: 'Paid' as 'Paid' | 'Udhar',
        trackingId: '',
        courierName: '',
        notes: '',
    });

    const [showPickupPerson, setShowPickupPerson] = useState(false);
    const [masterVendors, setMasterVendors] = useState<{ id: string, name: string }[]>([]);
    const [masterCustomers, setMasterCustomers] = useState<{ id: string, name: string }[]>([]);
    const [masterProducts, setMasterProducts] = useState<{ id: string, name: string }[]>([]);
    const [masterPickupPersons, setMasterPickupPersons] = useState<{ id: string, name: string }[]>([]);

    const [filteredVendors, setFilteredVendors] = useState<{ id: string, name: string }[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<{ id: string, name: string }[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<{ id: string, name: string }[]>([]);
    const [filteredPickupPersons, setFilteredPickupPersons] = useState<{ id: string, name: string }[]>([]);

    const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const [showPickupPersonSuggestions, setShowPickupPersonSuggestions] = useState(false);

    const [marginInfo, setMarginInfo] = useState({ margin: 0, percentage: 0 });

    const loadMasterData = async () => {
        if (!userId) return;
        const [vendors, customers, products, pickups] = await Promise.all([
            supabaseService.getContactsByType(userId, 'Vendor'),
            supabaseService.getContactsByType(userId, 'Customer'),
            supabaseService.getContactsByType(userId, 'Product'),
            supabaseService.getContactsByType(userId, 'Pickup Person')
        ]);
        setMasterVendors(vendors);
        setMasterCustomers(customers);
        setMasterProducts(products);
        setMasterPickupPersons(pickups);
    };

    useEffect(() => {
        if (userId) loadMasterData();
    }, [userId]);

    useEffect(() => {
        const original = parseFloat(form.originalPrice) || 0;
        const selling = parseFloat(form.sellingPrice) || 0;
        const pickup = parseFloat(form.pickupCharges) || 0;
        const shipping = parseFloat(form.shippingCharges) || 0;

        setMarginInfo(calculateMargin(original, selling, pickup, shipping));
    }, [form.originalPrice, form.sellingPrice, form.pickupCharges, form.shippingCharges]);

    const handleVendorNameChange = (text: string) => {
        setForm({ ...form, vendorName: text, vendorId: '' });
        if (text.length > 0) {
            const filtered = masterVendors.filter(v => v.name.toLowerCase().includes(text.toLowerCase()));
            setFilteredVendors(filtered);
            setShowVendorSuggestions(filtered.length > 0);
        } else setShowVendorSuggestions(false);
    };

    const handleCustomerNameChange = (text: string) => {
        setForm({ ...form, customerName: text, customerId: '' });
        if (text.length > 0) {
            const filtered = masterCustomers.filter(c => c.name.toLowerCase().includes(text.toLowerCase()));
            setFilteredCustomers(filtered);
            setShowCustomerSuggestions(filtered.length > 0);
        } else setShowCustomerSuggestions(false);
    };

    const handleProductNameChange = (text: string) => {
        setForm({ ...form, productName: text, productId: '' });
        if (text.length > 0) {
            const filtered = masterProducts.filter(p => p.name.toLowerCase().includes(text.toLowerCase()));
            setFilteredProducts(filtered);
            setShowProductSuggestions(filtered.length > 0);
        } else setShowProductSuggestions(false);
    };

    const handlePickupPersonNameChange = (text: string) => {
        setForm({ ...form, pickupPersonName: text, pickupPersonId: '' });
        if (text.length > 0) {
            const filtered = masterPickupPersons.filter(p => p.name.toLowerCase().includes(text.toLowerCase()));
            setFilteredPickupPersons(filtered);
            setShowPickupPersonSuggestions(filtered.length > 0);
        } else setShowPickupPersonSuggestions(false);
    };

    const handleSave = async () => {
        if (!userId) return;
        const requiredFields = ['customerName', 'vendorName', 'productName', 'originalPrice', 'sellingPrice'];

        for (const field of requiredFields) {
            if (!(form as any)[field]) {
                setValidationError('Please complete all required fields.');
                return;
            }
        }

        setLoading(true);
        try {
            const resolveId = async (name: string, type: 'Vendor' | 'Customer' | 'Product' | 'Pickup Person', currentId: string | undefined) => {
                if (!name) return undefined;
                if (currentId) return currentId;

                const masters: Record<string, any[]> = {
                    'Vendor': masterVendors, 'Customer': masterCustomers,
                    'Product': masterProducts, 'Pickup Person': masterPickupPersons
                };
                const match = masters[type].find(m => m.name.toLowerCase() === name.toLowerCase());
                if (match) return match.id;

                const { data, error } = await supabase
                    .from('directory')
                    .insert([{ user_id: userId, name: name, type: type }])
                    .select().single();

                if (error) throw error;
                return data.id;
            };

            const [vId, cId, pId, pickupId] = await Promise.all([
                resolveId(form.vendorName, 'Vendor', form.vendorId),
                resolveId(form.customerName, 'Customer', form.customerId),
                resolveId(form.productName, 'Product', form.productId),
                form.pickupPersonName ? resolveId(form.pickupPersonName, 'Pickup Person', form.pickupPersonId) : Promise.resolve(undefined)
            ]);

            const orderPayload: Partial<Order> = {
                date: new Date().toLocaleDateString('en-IN'),
                productId: pId,
                customerId: cId,
                vendorId: vId,
                originalPrice: parseFloat(form.originalPrice),
                sellingPrice: parseFloat(form.sellingPrice),
                pickupCharges: parseFloat(form.pickupCharges) || 0,
                shippingCharges: parseFloat(form.shippingCharges) || 0,
                status: form.status,
                paidByDriver: form.paidByDriver,
                pickupPersonId: pickupId,
                trackingId: form.trackingId,
                courierName: form.courierName,
                notes: form.notes,
                vendorPaymentStatus: form.vendorPaymentStatus,
                customerPaymentStatus: form.customerPaymentStatus,
                pickupPaymentStatus: form.pickupPaymentStatus,
            };

            await supabaseService.saveOrder(orderPayload, userId);
            setSuccessDialogVisible(true);

            // Reset state
            setForm({
                customerName: '', customerId: '', vendorName: '', vendorId: '',
                productName: '', productId: '', originalPrice: '', sellingPrice: '',
                pickupCharges: '', shippingCharges: '', status: 'Pending',
                vendorPaymentStatus: 'Paid', customerPaymentStatus: 'Paid',
                pickupPersonId: '', pickupPersonName: '', paidByDriver: false,
                pickupPaymentStatus: 'Paid', trackingId: '', courierName: '', notes: '',
            });
            setShowPickupPerson(false);
            loadMasterData();
        } catch (error) {
            console.error('Error saving order:', error);
            setValidationError('Failed to save order. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, isOptional }: { icon: any, title: string, isOptional?: boolean }) => (
        <View className="flex-row items-center mb-3 mt-2 px-1">
            <View className="w-6 h-6 rounded-full bg-indigo-500/20 items-center justify-center mr-2">
                <Icon size={12} color="#818cf8" />
            </View>
            <Text className="text-gray-400 font-sans-bold text-[10px] uppercase tracking-[2px] flex-1">{title}</Text>
            {isOptional && <Text className="text-gray-600 font-sans text-[10px] uppercase">Optional</Text>}
        </View>
    );

    const StatusTab = ({ label, active, onSelect }: { label: OrderStatus, active: boolean, onSelect: () => void }) => (
        <TouchableOpacity
            onPress={onSelect}
            className={cn(
                "px-3 py-2 rounded-xl mr-2 mb-2 border",
                active ? "bg-indigo-600 border-indigo-400" : "bg-white/5 border-white/10"
            )}
        >
            <Text className={cn("font-sans-bold text-[10px]", active ? "text-white" : "text-gray-500")}>
                {label.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );

    const PaymentToggle = ({ label, value, onSelect }: { label: string, value: 'Paid' | 'Udhar', onSelect: (v: 'Paid' | 'Udhar') => void }) => (
        <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-gray-500 font-sans-medium text-[11px]">{label}</Text>
            <View className="flex-row bg-white/5 rounded-lg p-0.5 border border-white/10">
                <TouchableOpacity onPress={() => onSelect('Paid')} className={cn("px-3 py-1 rounded-md", value === 'Paid' ? "bg-emerald-500/20" : "")}>
                    <Text className={cn("text-[10px] font-sans-bold", value === 'Paid' ? "text-emerald-400" : "text-gray-600")}>PAID</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onSelect('Udhar')} className={cn("px-3 py-1 rounded-md", value === 'Udhar' ? "bg-orange-500/20" : "")}>
                    <Text className={cn("text-[10px] font-sans-bold", value === 'Udhar' ? "text-orange-400" : "text-gray-600")}>UDHAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Background>
            <SafeAreaView className="flex-1">

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 100}
                >
                    <ScrollView
                        className="flex-1 px-4"
                        contentContainerStyle={{ paddingBottom: 180 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* 1. Contacts Section */}
                        <GlassCard className="mb-4 bg-slate-900/40 p-4 border-white/5" style={{ zIndex: 1000 }}>
                            <SectionHeader icon={User} title="Parties Involved" />
                            <View className="mb-4" style={{ zIndex: 1000 }}>
                                <View style={{ zIndex: 2000 }}>
                                    <Input
                                        ref={vendorRef}
                                        placeholder="Vendor Name (Supplier) *"
                                        value={form.vendorName}
                                        onChangeText={handleVendorNameChange}
                                        containerClassName="mb-3"
                                        className="h-12 text-sm"
                                        leftIcon={<ShoppingCart size={14} color="#6366f1" />}
                                        onFocus={() => setShowVendorSuggestions(form.vendorName.length > 0 && filteredVendors.length > 0)}
                                        onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 200)}
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => customerRef.current?.focus()}
                                    />
                                    {showVendorSuggestions && (
                                        <View className="absolute top-[55px] left-0 right-0 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-[5000] shadow-xl">
                                            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                                                {filteredVendors.map((v, i) => (
                                                    <TouchableOpacity key={i} className="px-4 py-3 border-b border-white/5 active:bg-white/10" onPress={() => { setForm({ ...form, vendorName: v.name, vendorId: v.id }); setShowVendorSuggestions(false); }}>
                                                        <Text className="text-white text-xs">{v.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                <View style={{ zIndex: 1500 }}>
                                    <Input
                                        ref={customerRef}
                                        placeholder="Customer Name (Buyer) *"
                                        value={form.customerName}
                                        onChangeText={handleCustomerNameChange}
                                        containerClassName="mb-0"
                                        className="h-12 text-sm"
                                        leftIcon={<User size={14} color="#10b981" />}
                                        onFocus={() => setShowCustomerSuggestions(form.customerName.length > 0 && filteredCustomers.length > 0)}
                                        onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => productRef.current?.focus()}
                                    />
                                    {showCustomerSuggestions && (
                                        <View className="absolute top-[55px] left-0 right-0 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-[5000] shadow-xl">
                                            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                                                {filteredCustomers.map((c, i) => (
                                                    <TouchableOpacity key={i} className="px-4 py-3 border-b border-white/5 active:bg-white/10" onPress={() => { setForm({ ...form, customerName: c.name, customerId: c.id }); setShowCustomerSuggestions(false); }}>
                                                        <Text className="text-white text-xs">{c.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View className="h-[1px] bg-white/5 my-3" />
                            <PaymentToggle label="Vendor Payment" value={form.vendorPaymentStatus} onSelect={(v) => {
                                if (form.paidByDriver && v === 'Udhar') return;
                                setForm({ ...form, vendorPaymentStatus: v });
                            }} />
                            <PaymentToggle label="Customer Payment" value={form.customerPaymentStatus} onSelect={(v) => setForm({ ...form, customerPaymentStatus: v })} />
                        </GlassCard>

                        {/* 2. Product & Pricing Section */}
                        <GlassCard className="mb-4 bg-slate-900/40 p-4 border-white/5">
                            <SectionHeader icon={Package} title="Product & Pricing" />
                            <View className="mb-4" style={{ zIndex: 1000 }}>
                                <Input
                                    ref={productRef}
                                    placeholder="Product Name *"
                                    value={form.productName}
                                    onChangeText={handleProductNameChange}
                                    containerClassName="mb-0"
                                    className="h-12 text-sm"
                                    leftIcon={<ShoppingBag size={14} color="#f59e0b" />}
                                    onFocus={() => setShowProductSuggestions(form.productName.length > 0 && filteredProducts.length > 0)}
                                    onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => purchaseRef.current?.focus()}
                                />
                                {showProductSuggestions && (
                                    <View className="absolute top-[55px] left-0 right-0 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-[5000] shadow-xl">
                                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                                            {filteredProducts.map((p, i) => (
                                                <TouchableOpacity key={i} className="px-4 py-3 border-b border-white/5 active:bg-white/10" onPress={() => { setForm({ ...form, productName: p.name, productId: p.id }); setShowProductSuggestions(false); }}>
                                                    <Text className="text-white text-xs">{p.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <Input
                                        ref={purchaseRef}
                                        label="Purchase (₹) *"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.originalPrice}
                                        onChangeText={t => setForm({ ...form, originalPrice: t })}
                                        containerClassName="mb-0"
                                        className="h-12 text-sm"
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => sellingRef.current?.focus()}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        ref={sellingRef}
                                        label="Selling (₹) *"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.sellingPrice}
                                        onChangeText={t => setForm({ ...form, sellingPrice: t })}
                                        containerClassName="mb-0"
                                        className="h-12 text-sm"
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => {
                                            if (showPickupPerson) {
                                                driverRef.current?.focus();
                                            } else {
                                                pickupChargeRef.current?.focus();
                                            }
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Profit Badge */}
                            {(parseFloat(form.sellingPrice) > 0) && (
                                <View className="mt-4 flex-row items-center justify-between bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
                                    <View>
                                        <Text className="text-gray-500 font-sans text-[10px] uppercase">Net Profit</Text>
                                        <Text className={cn("text-lg font-sans-bold", marginInfo.margin >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                            ₹{marginInfo.margin.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-gray-500 font-sans text-[10px] uppercase">Margin</Text>
                                        <Text className="text-indigo-300 font-sans-bold">{marginInfo.percentage}%</Text>
                                    </View>
                                </View>
                            )}
                        </GlassCard>

                        {/* 3. Status & Fulfillment Section */}
                        <GlassCard className="mb-4 bg-slate-900/40 p-4 border-white/5">
                            <SectionHeader icon={Clock} title="Order Status" />
                            <View className="flex-row flex-wrap mb-4">
                                {(['Pending', 'Booked', 'Shipped', 'Delivered'] as OrderStatus[]).map(s => (
                                    <StatusTab key={s} label={s} active={form.status === s} onSelect={() => setForm({ ...form, status: s })} />
                                ))}
                            </View>

                            <View className="h-[1px] bg-white/5 my-2" />

                            {!showPickupPerson ? (
                                <TouchableOpacity onPress={() => setShowPickupPerson(true)} className="py-3 flex-row items-center">
                                    <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-3">
                                        <Truck size={14} color="#94a3b8" />
                                    </View>
                                    <Text className="text-gray-400 font-sans-medium text-xs flex-1">Assign Pickup Driver?</Text>
                                    <ChevronRight size={16} color="#475569" />
                                </TouchableOpacity>
                            ) : (
                                <View className="mt-4">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-indigo-400 font-sans-bold text-[10px] uppercase tracking-wider">Pickup Details</Text>
                                        <TouchableOpacity onPress={() => { setShowPickupPerson(false); setForm(f => ({ ...f, pickupPersonName: '', pickupPersonId: '', paidByDriver: false })); }}>
                                            <Text className="text-rose-400 font-sans-bold text-[10px]">REMOVE</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className="mb-4" style={{ zIndex: 1000 }}>
                                        <Input
                                            ref={driverRef}
                                            placeholder="Driver Name *"
                                            value={form.pickupPersonName}
                                            onChangeText={handlePickupPersonNameChange}
                                            containerClassName="mb-0"
                                            className="h-12 text-sm"
                                            leftIcon={<UserCheck size={14} color="#818cf8" />}
                                            onFocus={() => setShowPickupPersonSuggestions(form.pickupPersonName.length > 0 && filteredPickupPersons.length > 0)}
                                            onBlur={() => setTimeout(() => setShowPickupPersonSuggestions(false), 200)}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            onSubmitEditing={() => pickupChargeRef.current?.focus()}
                                        />
                                        {showPickupPersonSuggestions && (
                                            <View className="absolute top-[55px] left-0 right-0 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-[5000] shadow-xl">
                                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                                                    {filteredPickupPersons.map((p, i) => (
                                                        <TouchableOpacity key={i} className="px-4 py-3 border-b border-white/5 active:bg-white/10" onPress={() => { setForm({ ...form, pickupPersonName: p.name, pickupPersonId: p.id }); setShowPickupPersonSuggestions(false); }}>
                                                            <Text className="text-white text-xs">{p.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row items-center justify-between mb-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <View className="flex-1 mr-4">
                                            <Text className="text-gray-300 font-sans-bold text-[11px]">Paid by Driver?</Text>
                                            <Text className="text-gray-500 font-sans text-[9px]">They paid the shop upfront</Text>
                                        </View>
                                        <Switch
                                            value={form.paidByDriver}
                                            onValueChange={v => setForm({ ...form, paidByDriver: v, vendorPaymentStatus: v ? 'Paid' : form.vendorPaymentStatus, pickupPaymentStatus: v ? 'Udhar' : 'Paid' })}
                                            trackColor={{ false: '#334155', true: '#6366f1' }}
                                        />
                                    </View>

                                    {form.paidByDriver && (
                                        <PaymentToggle label="Driver Reimbursement" value={form.pickupPaymentStatus} onSelect={(v) => setForm({ ...form, pickupPaymentStatus: v })} />
                                    )}
                                </View>
                            )}
                        </GlassCard>

                        {/* 4. Charges & Tracking Section */}
                        <GlassCard className="mb-6 bg-slate-900/40 p-4 border-white/5">
                            <SectionHeader icon={TrendingUp} title="Charges & Details" isOptional />
                            <View className="flex-row gap-3 mb-4">
                                <View className="flex-1">
                                    <Input
                                        ref={pickupChargeRef}
                                        label="Pickup Cost"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.pickupCharges}
                                        onChangeText={t => setForm({ ...form, pickupCharges: t })}
                                        containerClassName="mb-0"
                                        className="h-12 text-sm"
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => shippingChargeRef.current?.focus()}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        ref={shippingChargeRef}
                                        label="Shipping Cost"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={form.shippingCharges}
                                        onChangeText={t => setForm({ ...form, shippingCharges: t })}
                                        containerClassName="mb-0"
                                        className="h-12 text-sm"
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => trackingRef.current?.focus()}
                                    />
                                </View>
                            </View>

                            <Input
                                ref={trackingRef}
                                label="Tracking ID"
                                placeholder="Order reference/tracking"
                                value={form.trackingId}
                                onChangeText={t => setForm({ ...form, trackingId: t })}
                                containerClassName="mb-4"
                                className="h-12 text-sm"
                                leftIcon={<BadgeCheck size={14} color="#94a3b8" />}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => notesRef.current?.focus()}
                            />

                            <Input
                                ref={notesRef}
                                label="Notes"
                                placeholder="..."
                                value={form.notes}
                                onChangeText={t => setForm({ ...form, notes: t })}
                                multiline
                                containerClassName="mb-0"
                                className="h-20 py-2 text-sm"
                                textAlignVertical="top"
                            />
                        </GlassCard>

                        <View style={{ height: 60 }} />

                        <Button
                            onPress={handleSave}
                            className="bg-indigo-600 h-14 rounded-2xl flex-row items-center justify-center shadow-xl shadow-indigo-500/20"
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <View className="flex-row items-center">
                                    <Text className="text-white font-sans-bold text-base mr-2">Confirm Order</Text>
                                    <ArrowRight color="white" size={18} />
                                </View>
                            )}
                        </Button>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <ConfirmDialog
                visible={successDialogVisible}
                title="Order Booked!"
                message="Transaction has been saved and ledger entries updated."
                confirmText="Great"
                onConfirm={() => { setSuccessDialogVisible(false); navigation.navigate('HomeTab' as never); }}
                onCancel={() => setSuccessDialogVisible(false)}
            />

            <ConfirmDialog
                visible={!!validationError}
                title="Check Details"
                message={validationError || ''}
                confirmText="Understand"
                onConfirm={() => setValidationError(null)}
                onCancel={() => setValidationError(null)}
            />
        </Background>
    );
}
