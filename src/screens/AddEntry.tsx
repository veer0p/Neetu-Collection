import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { calculateMargin } from '../utils/types';
import { ShoppingBag, Store, Tag, IndianRupee, FileText, TrendingUp, User, ShoppingCart, UserCheck, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function AddEntry() {
    const navigation = useNavigation();
    const { addTransaction, userId } = useTransactions();
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const [form, setForm] = useState({
        customerName: '',
        vendorName: '',
        productName: '',
        originalPrice: '',
        sellingPrice: '',
        vendorPaymentStatus: 'Paid' as 'Paid' | 'Udhar',
        customerPaymentStatus: 'Paid' as 'Paid' | 'Udhar',
        trackingId: '',
        courierName: '',
        notes: '',
    });

    const [masterVendors, setMasterVendors] = useState<string[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [marginInfo, setMarginInfo] = useState({ margin: 0, percentage: 0 });

    // Refs for keyboard navigation
    const vendorRef = React.useRef<any>(null);
    const customerRef = React.useRef<any>(null);
    const productRef = React.useRef<any>(null);
    const purchasePriceRef = React.useRef<any>(null);
    const sellingPriceRef = React.useRef<any>(null);
    const trackingRef = React.useRef<any>(null);
    const notesRef = React.useRef<any>(null);

    useEffect(() => {
        if (userId) {
            loadMasterVendors();
        }
    }, [userId]);

    const loadMasterVendors = async () => {
        if (!userId) return;
        const vendors = await supabaseService.getShops(userId);
        setMasterVendors(vendors);
    };

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
        setForm({ ...form, vendorName: text });
        if (text.length > 0) {
            const filtered = masterVendors.filter(v =>
                v.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredVendors(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectVendor = (vendor: string) => {
        setForm({ ...form, vendorName: vendor });
        setShowSuggestions(false);
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

        const transaction = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('en-IN'),
            customerName: form.customerName,
            vendorName: form.vendorName,
            productName: form.productName,
            originalPrice: parseFloat(form.originalPrice),
            sellingPrice: parseFloat(form.sellingPrice),
            margin: marginInfo.margin,
            marginPercentage: marginInfo.percentage,
            vendorPaymentStatus: form.vendorPaymentStatus,
            customerPaymentStatus: form.customerPaymentStatus,
            trackingId: form.trackingId,
            courierName: form.courierName,
            notes: form.notes,
            createdAt: Date.now(),
        };

        await addTransaction(transaction as any);

        // Optionally save to directory if it's a new vendor
        if (!masterVendors.includes(form.vendorName)) {
            await supabaseService.saveDirectoryItem({
                id: '',
                name: form.vendorName,
                type: 'Vendor',
                address: '',
                phone: '',
                createdAt: Date.now()
            }, userId);
        }

        setSuccessDialogVisible(true);

        setForm({
            customerName: '',
            vendorName: '',
            productName: '',
            originalPrice: '',
            sellingPrice: '',
            vendorPaymentStatus: 'Paid',
            customerPaymentStatus: 'Paid',
            trackingId: '',
            courierName: '',
            notes: '',
        });

        navigation.navigate('Home' as never);
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
            <SafeAreaView className="flex-1" edges={['top']}>
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
                        <View className="py-4 mb-2">
                            <Text className="text-white font-sans-bold text-2xl">Record Sale</Text>
                            <Text className="text-gray-400 font-sans text-sm mt-1">Track both vendor and customer payments</Text>
                        </View>

                        {/* Vendor Section */}
                        <View className="z-50">
                            <Input
                                ref={vendorRef}
                                label="Vendor Name *"
                                placeholder="e.g. Ramesh Textiles"
                                leftIcon={<ShoppingCart size={18} color="#94a3b8" />}
                                value={form.vendorName}
                                onChangeText={handleVendorNameChange}
                                returnKeyType="next"
                                onSubmitEditing={() => customerRef.current?.focus()}
                                onFocus={() => {
                                    if (form.vendorName.length > 0 && filteredVendors.length > 0) {
                                        setShowSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowSuggestions(false), 200);
                                }}
                            />
                            {showSuggestions && (
                                <View className="absolute top-[80px] left-0 right-0 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                                    {filteredVendors.map((vendor, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className="px-4 py-3 border-b border-white/5 active:bg-white/10"
                                            onPress={() => selectVendor(vendor)}
                                        >
                                            <Text className="text-white font-sans text-sm">{vendor}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <StatusSwitch
                            label="Your Payment to Vendor"
                            value={form.vendorPaymentStatus}
                            onSelect={(v) => setForm({ ...form, vendorPaymentStatus: v })}
                            udharLabel="UDHAR (YOU OWE)"
                        />

                        {/* Customer Section */}
                        <Input
                            ref={customerRef}
                            label="Customer Name *"
                            placeholder="e.g. Amit Kumar"
                            leftIcon={<User size={18} color="#94a3b8" />}
                            value={form.customerName}
                            onChangeText={(text) => setForm({ ...form, customerName: text })}
                            returnKeyType="next"
                            onSubmitEditing={() => productRef.current?.focus()}
                        />

                        <StatusSwitch
                            label="Customer's Payment to You"
                            value={form.customerPaymentStatus}
                            onSelect={(v) => setForm({ ...form, customerPaymentStatus: v })}
                            udharLabel="UDHAR (THEY OWE)"
                        />

                        <View className="h-[1px] bg-white/10 mb-6 mt-2" />

                        {/* Product Section */}
                        <Input
                            ref={productRef}
                            label="Product Name *"
                            placeholder="e.g. Designer Suit"
                            leftIcon={<ShoppingBag size={18} color="#94a3b8" />}
                            value={form.productName}
                            onChangeText={(text) => setForm({ ...form, productName: text })}
                            returnKeyType="next"
                            onSubmitEditing={() => purchasePriceRef.current?.focus()}
                        />

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
                            Save Transaction
                        </Button>

                        {/* Extra space for keyboard avoidance */}
                        <View className="h-20" />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
