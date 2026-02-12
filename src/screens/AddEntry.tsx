import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { supabase } from '../utils/supabase';
import { calculateMargin, Order } from '../utils/types';
import { ShoppingBag, Store, Tag, IndianRupee, FileText, TrendingUp, User, ShoppingCart, UserCheck, ShieldCheck, Truck, Fingerprint } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from 'react-native';
import { cn } from '../utils/cn';

export default function AddEntry() {
    const navigation = useNavigation();
    const { addTransaction, userId } = useTransactions();
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // Added loading state

    const [form, setForm] = useState({
        customerName: '',
        customerId: '', // Added customerId
        vendorName: '',
        vendorId: '', // Added vendorId
        productName: '',
        productId: '', // Added productId
        originalPrice: '',
        sellingPrice: '',
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

    // Refs for keyboard navigation
    const vendorRef = React.useRef<any>(null);
    const customerRef = React.useRef<any>(null);
    const productRef = React.useRef<any>(null);
    const pickupRef = React.useRef<any>(null);
    const purchasePriceRef = React.useRef<any>(null);
    const sellingPriceRef = React.useRef<any>(null);
    const trackingRef = React.useRef<any>(null);
    const notesRef = React.useRef<any>(null);

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
        if (userId) {
            loadMasterData();
        }
    }, [userId]);

    useEffect(() => {
        const original = parseFloat(form.originalPrice) || 0;
        const selling = parseFloat(form.sellingPrice) || 0;
        if (original > 0 || selling > 0) {
            setMarginInfo(calculateMargin(original, selling));
        } else {
            setMarginInfo({ margin: 0, percentage: 0 });
        }
    }, [form.originalPrice, form.sellingPrice]);

    const handleVendorNameChange = (text: string) => {
        setForm({ ...form, vendorName: text, vendorId: '' }); // Clear ID on name change
        if (text.length > 0) {
            const filtered = masterVendors.filter(v =>
                v.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredVendors(filtered);
            setShowVendorSuggestions(filtered.length > 0);
        } else {
            setShowVendorSuggestions(false);
        }
    };

    const handleCustomerNameChange = (text: string) => {
        setForm({ ...form, customerName: text, customerId: '' }); // Clear ID on name change
        if (text.length > 0) {
            const filtered = masterCustomers.filter(c =>
                c.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredCustomers(filtered);
            setShowCustomerSuggestions(filtered.length > 0);
        } else {
            setShowCustomerSuggestions(false);
        }
    };

    const handleProductNameChange = (text: string) => {
        setForm({ ...form, productName: text, productId: '' }); // Clear ID on name change
        if (text.length > 0) {
            const filtered = masterProducts.filter(p =>
                p.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredProducts(filtered);
            setShowProductSuggestions(filtered.length > 0);
        } else {
            setShowProductSuggestions(false);
        }
    };

    const handlePickupPersonNameChange = (text: string) => {
        setForm({ ...form, pickupPersonName: text, pickupPersonId: '' });
        if (text.length > 0) {
            const filtered = masterPickupPersons.filter(p =>
                p.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredPickupPersons(filtered);
            setShowPickupPersonSuggestions(filtered.length > 0);
        } else {
            setShowPickupPersonSuggestions(false);
        }
    };

    const selectVendor = (vendor: { id: string, name: string }) => {
        setForm({ ...form, vendorName: vendor.name, vendorId: vendor.id });
        setShowVendorSuggestions(false);
    };

    const selectCustomer = (customer: { id: string, name: string }) => {
        setForm({ ...form, customerName: customer.name, customerId: customer.id });
        setShowCustomerSuggestions(false);
    };

    const selectProduct = (product: { id: string, name: string }) => {
        setForm({ ...form, productName: product.name, productId: product.id });
        setShowProductSuggestions(false);
    };

    const selectPickupPerson = (person: { id: string, name: string }) => {
        setForm({ ...form, pickupPersonName: person.name, pickupPersonId: person.id });
        setShowPickupPersonSuggestions(false);
    };

    const handleSave = async () => {
        if (!userId) return;
        const requiredFields = ['customerName', 'vendorName', 'productName', 'originalPrice', 'sellingPrice'];

        for (const field of requiredFields) {
            if (!(form as any)[field]) {
                setValidationError('Please fill in all required fields marked with *');
                return;
            }
        }

        setLoading(true);
        try {
            // 1. Resolve or Create IDs for all directory items
            const resolveId = async (name: string, type: 'Vendor' | 'Customer' | 'Product' | 'Pickup Person', currentId: string | undefined) => {
                if (!name) return undefined; // If name is empty, no ID to resolve/create
                if (currentId) return currentId;

                // Double check master lists for a match by name
                const masters: Record<string, any[]> = {
                    'Vendor': masterVendors,
                    'Customer': masterCustomers,
                    'Product': masterProducts,
                    'Pickup Person': masterPickupPersons
                };
                const match = masters[type].find(m => m.name.toLowerCase() === name.toLowerCase());
                if (match) return match.id;

                // Create new item
                const { data, error } = await supabase
                    .from('directory')
                    .insert([{ user_id: userId, name: name, type: type }])
                    .select()
                    .single();

                if (error) throw error;
                return data.id;
            };

            const [vId, cId, pId, pickupId] = await Promise.all([
                resolveId(form.vendorName, 'Vendor', form.vendorId),
                resolveId(form.customerName, 'Customer', form.customerId),
                resolveId(form.productName, 'Product', form.productId),
                form.pickupPersonName ? resolveId(form.pickupPersonName, 'Pickup Person', form.pickupPersonId) : Promise.resolve(undefined)
            ]);

            // 2. Save Order (which will auto-generate ledger entries)
            const orderPayload: Partial<Order> = {
                date: new Date().toLocaleDateString('en-IN'),
                productId: pId,
                customerId: cId,
                vendorId: vId,
                originalPrice: parseFloat(form.originalPrice),
                sellingPrice: parseFloat(form.sellingPrice),
                paidByDriver: form.paidByDriver,
                pickupPersonId: pickupId,
                trackingId: form.trackingId,
                courierName: form.courierName,
                notes: form.notes,
                vendorPaymentStatus: form.vendorPaymentStatus, // Added these
                customerPaymentStatus: form.customerPaymentStatus, // Added these
                pickupPaymentStatus: form.pickupPaymentStatus, // Added these
            };

            await supabaseService.saveOrder(orderPayload, userId);

            setSuccessDialogVisible(true); // Using existing state

            setForm({
                customerName: '',
                customerId: '',
                vendorName: '',
                vendorId: '',
                productName: '',
                productId: '',
                originalPrice: '',
                sellingPrice: '',
                vendorPaymentStatus: 'Paid',
                customerPaymentStatus: 'Paid',
                pickupPersonId: '',
                pickupPersonName: '',
                paidByDriver: false,
                pickupPaymentStatus: 'Paid',
                trackingId: '',
                courierName: '',
                notes: '',
            });

            loadMasterData(); // Refresh masters with new items
            navigation.navigate('Home' as never);
        } catch (error) {
            console.error('Error saving order:', error);
            setValidationError('Failed to save order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const StatusSwitch = ({
        label,
        value,
        onSelect,
        udharLabel
    }: {
        label: string,
        value: 'Paid' | 'Udhar',
        onSelect: (val: 'Paid' | 'Udhar') => void,
        udharLabel: string
    }) => (
        <View className="mb-5">
            <Text className="text-gray-400 font-sans-medium mb-3 ml-1 text-xs uppercase tracking-wider">{label}</Text>
            <View className="flex-row bg-white/10 border border-white/20 p-1 rounded-xl">
                <TouchableOpacity
                    onPress={() => onSelect('Paid')}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg items-center justify-center",
                        value === 'Paid' ? "bg-emerald-500" : "transparent"
                    )}
                >
                    <Text className={cn(
                        "font-sans-bold text-xs",
                        value === 'Paid' ? "text-white" : "text-gray-400"
                    )}>PAID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onSelect('Udhar')}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg items-center justify-center",
                        value === 'Udhar' ? "bg-orange-500" : "transparent"
                    )}
                >
                    <Text className={cn(
                        "font-sans-bold text-xs",
                        value === 'Udhar' ? "text-white" : "text-gray-400"
                    )}>{udharLabel}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Background>
            <View className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-6"
                        contentContainerStyle={{ paddingBottom: 150 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* Vendor Section */}
                        <View className="mt-4 z-[100]">
                            <Input
                                ref={vendorRef}
                                label="Vendor Name *"
                                placeholder="e.g. Ramesh Textiles"
                                leftIcon={<ShoppingCart size={18} color="#94a3b8" />}
                                value={form.vendorName}
                                onChangeText={handleVendorNameChange}
                                returnKeyType="next"
                                onSubmitEditing={() => customerRef.current?.focus()}
                                onPress={() => {
                                    if (form.vendorName.length > 0 && filteredVendors.length > 0) {
                                        setShowVendorSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowVendorSuggestions(false), 200);
                                }}
                            />
                            {showVendorSuggestions && (
                                <View className="absolute top-[80px] left-0 right-0 bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-[100]">
                                    {filteredVendors.map((vendor, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className="px-4 py-4 border-b border-white/5 active:bg-white/10"
                                            onPress={() => selectVendor(vendor)}
                                        >
                                            <Text className="text-white font-sans text-sm">{vendor.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <StatusSwitch
                            label="Your Payment to Vendor"
                            value={form.vendorPaymentStatus}
                            onSelect={(v) => {
                                setForm({ ...form, vendorPaymentStatus: v });
                                if (v === 'Paid') setForm(f => ({ ...f, paidByDriver: false }));
                            }}
                            udharLabel="UDHAR (YOU OWE)"
                        />

                        {/* Customer Section */}
                        <View className="z-50">
                            <Input
                                ref={customerRef}
                                label="Customer Name *"
                                placeholder="e.g. Amit Kumar"
                                leftIcon={<User size={18} color="#94a3b8" />}
                                value={form.customerName}
                                onChangeText={handleCustomerNameChange}
                                returnKeyType="next"
                                onSubmitEditing={() => productRef.current?.focus()}
                                onFocus={() => {
                                    if (form.customerName.length > 0 && filteredCustomers.length > 0) {
                                        setShowCustomerSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowCustomerSuggestions(false), 200);
                                }}
                            />
                            {showCustomerSuggestions && (
                                <View className="absolute top-[80px] left-0 right-0 bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50">
                                    {filteredCustomers.map((customer, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className="px-4 py-4 border-b border-white/5 active:bg-white/10"
                                            onPress={() => selectCustomer(customer)}
                                        >
                                            <Text className="text-white font-sans text-sm">{customer.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <StatusSwitch
                            label="Customer's Payment to You"
                            value={form.customerPaymentStatus}
                            onSelect={(v) => setForm({ ...form, customerPaymentStatus: v })}
                            udharLabel="UDHAR (THEY OWE)"
                        />

                        <View className="h-[1px] bg-white/10 mb-6 mt-2" />

                        {/* Product Section */}
                        <View className="z-40">
                            <Input
                                ref={productRef}
                                label="Product Name *"
                                placeholder="e.g. Designer Suit"
                                leftIcon={<ShoppingBag size={18} color="#94a3b8" />}
                                value={form.productName}
                                onChangeText={handleProductNameChange}
                                returnKeyType="next"
                                onSubmitEditing={() => purchasePriceRef.current?.focus()}
                                onFocus={() => {
                                    if (form.productName.length > 0 && filteredProducts.length > 0) {
                                        setShowProductSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowProductSuggestions(false), 200);
                                }}
                            />
                            {showProductSuggestions && (
                                <View className="absolute top-[80px] left-0 right-0 bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-40">
                                    {filteredProducts.map((product, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className="px-4 py-4 border-b border-white/5 active:bg-white/10"
                                            onPress={() => selectProduct(product)}
                                        >
                                            <Text className="text-white font-sans text-sm">{product.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                        {/* Pickup Person Section */}
                        <View className="z-30">
                            <Input
                                ref={pickupRef}
                                label="Pickup Person (Optional)"
                                placeholder="e.g. Soni Courier"
                                leftIcon={<Truck size={18} color="#94a3b8" />}
                                value={form.pickupPersonName}
                                onChangeText={handlePickupPersonNameChange}
                                returnKeyType="next"
                                onSubmitEditing={() => purchasePriceRef.current?.focus()}
                                onFocus={() => {
                                    if (form.pickupPersonName.length > 0 && filteredPickupPersons.length > 0) {
                                        setShowPickupPersonSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowPickupPersonSuggestions(false), 200);
                                }}
                            />
                            {showPickupPersonSuggestions && (
                                <View className="absolute top-[80px] left-0 right-0 bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-30">
                                    {filteredPickupPersons.map((person, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className="px-4 py-4 border-b border-white/5 active:bg-white/10"
                                            onPress={() => selectPickupPerson(person)}
                                        >
                                            <Text className="text-white font-sans text-sm">{person.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Paid by Driver Toggle */}
                        {form.pickupPersonName.length > 0 && (
                            <View className="mb-6">
                                <GlassCard className="bg-indigo-500/10 border-indigo-500/20 py-4">
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1 mr-4">
                                            <Text className="text-white font-sans-bold text-sm">Paid by Driver?</Text>
                                            <Text className="text-gray-400 font-sans text-[10px] mt-1">Select this if driver paid the shop upfront for the product.</Text>
                                        </View>
                                        <Switch
                                            value={form.paidByDriver}
                                            onValueChange={(val) => {
                                                setForm({
                                                    ...form,
                                                    paidByDriver: val,
                                                    vendorPaymentStatus: val ? 'Paid' : form.vendorPaymentStatus,
                                                    pickupPaymentStatus: val ? 'Udhar' : 'Paid'
                                                });
                                            }}
                                            trackColor={{ false: '#1e293b', true: '#6366f1' }}
                                            thumbColor={form.paidByDriver ? '#ffffff' : '#94a3b8'}
                                        />
                                    </View>
                                </GlassCard>
                            </View>
                        )}

                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Input
                                    ref={purchasePriceRef}
                                    label="Purchase Price *"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    leftIcon={<IndianRupee size={16} color="#94a3b8" />}
                                    value={form.originalPrice}
                                    onChangeText={(text) => setForm({ ...form, originalPrice: text })}
                                    returnKeyType="next"
                                    onSubmitEditing={() => sellingPriceRef.current?.focus()}
                                />
                            </View>
                            <View className="flex-1">
                                <Input
                                    ref={sellingPriceRef}
                                    label="Selling Price *"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    leftIcon={<IndianRupee size={16} color="#94a3b8" />}
                                    value={form.sellingPrice}
                                    onChangeText={(text) => setForm({ ...form, sellingPrice: text })}
                                    returnKeyType="next"
                                    onSubmitEditing={() => trackingRef.current?.focus()}
                                />
                            </View>
                        </View>

                        {/* Margin Preview */}
                        {(parseFloat(form.originalPrice) > 0 && parseFloat(form.sellingPrice) > 0) && (
                            <GlassCard className="mb-6 bg-indigo-500/15 py-4 border-indigo-500/30">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-gray-400 font-sans text-xs">Expected Profit</Text>
                                        <Text className={cn(
                                            "font-sans-bold text-xl mt-1",
                                            marginInfo.margin >= 0 ? "text-emerald-400" : "text-red-400"
                                        )}>
                                            ₹{marginInfo.margin} ({marginInfo.percentage}%)
                                        </Text>
                                    </View>
                                    <View className={cn(
                                        "p-2 rounded-xl",
                                        marginInfo.margin >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                                    )}>
                                        <TrendingUp size={20} color={marginInfo.margin >= 0 ? "#34d399" : "#f87171"} />
                                    </View>
                                </View>
                            </GlassCard>
                        )}

                        <Input
                            ref={trackingRef}
                            label="Tracking ID"
                            placeholder="Courier tracking number"
                            leftIcon={<Tag size={18} color="#94a3b8" />}
                            value={form.trackingId}
                            onChangeText={(text) => setForm({ ...form, trackingId: text })}
                            returnKeyType="next"
                            onSubmitEditing={() => notesRef.current?.focus()}
                        />

                        <Input
                            ref={notesRef}
                            label="Notes"
                            placeholder="Additional details..."
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            containerClassName="h-auto"
                            className="h-24 py-3"
                            leftIcon={<FileText size={18} color="#94a3b8" />}
                            value={form.notes}
                            onChangeText={(text) => setForm({ ...form, notes: text })}
                        />

                        <Button
                            onPress={handleSave}
                            className="mt-4 rounded-full"
                        >
                            Add Sale
                        </Button>

                        {/* Extra space for keyboard avoidance */}
                        <View className="h-20" />
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            <ConfirmDialog
                visible={successDialogVisible}
                title="Success!"
                message="Transaction has been saved successfully. Your records are updated."
                confirmText="Great"
                onConfirm={() => {
                    setSuccessDialogVisible(false);
                    navigation.navigate('Home' as never);
                }}
                onCancel={() => setSuccessDialogVisible(false)}
            />

            <ConfirmDialog
                visible={!!validationError}
                title="Incomplete Form"
                message={validationError || ''}
                confirmText="Correct It"
                cancelText=""
                onConfirm={() => setValidationError(null)}
                onCancel={() => setValidationError(null)}
            />
        </Background>
    );
}


