import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { LedgerEntry } from '../utils/types';
import { ChevronLeft, Trash2, Edit3, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { cn } from '../utils/cn';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';

const InfoRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <View className="flex-row items-center justify-between py-3 border-b border-divider dark:border-divider-dark">
        <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">{label}</Text>
        <Text className={cn("font-sans-semibold text-sm", valueColor || "text-primary dark:text-primary-dark")}>{value}</Text>
    </View>
);

const StatusDot = ({ label, status }: { label: string; status: string }) => (
    <View className="flex-1 items-center">
        <View className={cn("w-3 h-3 rounded-full mb-1", status === 'Paid' ? 'bg-success' : 'bg-warning')} />
        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px]">{label}</Text>
        <Text className={cn("font-sans-bold text-xs", status === 'Paid' ? 'text-success' : 'text-warning')}>{status}</Text>
    </View>
);

export default function OrderDetail({ route, navigation }: any) {
    const [order, setOrder] = useState<any>(route.params?.order);
    const orderId = route.params?.orderId || order?.id;
    const { deleteOrder } = useTransactions();
    const { isDark } = useTheme();
    const [ledgerEntries, setLedgerEntries] = useState<(LedgerEntry & { personName?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (orderId) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [orderId]);
    const loadData = async () => {
        setLoading(true);
        try {
            if (!order && orderId) {
                const fetchedOrder = await supabaseService.getOrderById(orderId);
                if (fetchedOrder) setOrder(fetchedOrder);
            }
            const entries = await supabaseService.getLedgerEntriesByOrder(orderId);
            setLedgerEntries(entries);
        } catch (error) {
            console.error('Error loading order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try { await deleteOrder(order.id); navigation.goBack(); }
        catch (e) { console.error('Delete failed:', e); setDeleting(false); setDeleteVisible(false); }
    };

    if (!order) {
        return (
            <Background>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary dark:text-secondary-dark font-sans">No order data</Text>
                </View>
            </Background>
        );
    }

    const margin = (order.sellingPrice || 0) - (order.originalPrice || 0) - (order.pickupCharges || 0) - (order.shippingCharges || 0);

    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'Delivered': return 'bg-success/10 text-success dark:text-success-dark';
            case 'Shipped': return 'bg-accent/10 text-accent dark:text-accent-dark';
            case 'Booked': return 'bg-warning/10 text-warning dark:text-warning-dark';
            case 'Canceled': return 'bg-danger/10 text-danger dark:text-danger-dark';
            default: return 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark';
        }
    };

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Header */}
                    <View className="flex-row items-center px-6 pt-4 pb-2">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface dark:bg-surface-dark rounded-xl mr-3">
                            <ChevronLeft color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl" numberOfLines={1}>{order.productName}</Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <Text className={cn("font-sans-bold text-xs px-2 py-0.5 rounded-full", getStatusStyle(order.status))}>
                                    {order.status}
                                </Text>
                                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{order.date}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddEntry' as never, { orderId: order.id, orderData: order } as never)}
                            className="p-2 bg-accent/10 rounded-xl mr-2"
                        >
                            <Edit3 color={isDark ? '#818CF8' : '#4F46E5'} size={18} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setDeleteVisible(true)}
                            disabled={deleting}
                            className="p-2 bg-danger/10 rounded-xl"
                        >
                            <Trash2 color="#EF4444" size={18} />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 mt-4">
                        {/* Summary Card */}
                        <Card className="p-5 mb-4 items-center">
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs uppercase tracking-wider mb-1">Net Margin</Text>
                            <Text className={cn("text-3xl font-sans-bold", margin >= 0 ? "text-success" : "text-danger")}>
                                ₹{margin.toLocaleString()}
                            </Text>
                        </Card>

                        {/* Payment Status */}
                        <View className="flex-row gap-4 mb-4">
                            <Card className="flex-1 p-4 flex-row items-center justify-around">
                                <StatusDot label="Customer" status={order.customerPaymentStatus} />
                                <View className="w-px h-8 bg-divider dark:bg-divider-dark" />
                                <StatusDot label="Vendor" status={order.vendorPaymentStatus} />
                                <View className="w-px h-8 bg-divider dark:bg-divider-dark" />
                                <StatusDot label="Pickup" status={order.pickupPaymentStatus || 'Paid'} />
                            </Card>
                        </View>

                        {/* Details */}
                        <Card className="p-4 mb-4">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-base mb-2">Order Details</Text>
                            <InfoRow label="Product" value={order.productName} />
                            <InfoRow label="Customer" value={order.customerName} />
                            <InfoRow label="Vendor" value={order.vendorName} />
                            {order.pickupPersonName && <InfoRow label="Pickup" value={order.pickupPersonName} />}
                            <InfoRow label="Original Price" value={`₹${Number(order.originalPrice).toLocaleString()}`} />
                            <InfoRow label="Selling Price" value={`₹${Number(order.sellingPrice).toLocaleString()}`} valueColor="text-success" />
                            {order.pickupCharges > 0 && <InfoRow label="Pickup Charges" value={`₹${Number(order.pickupCharges).toLocaleString()}`} valueColor="text-danger" />}
                            {order.shippingCharges > 0 && <InfoRow label="Shipping" value={`₹${Number(order.shippingCharges).toLocaleString()}`} valueColor="text-danger" />}
                        </Card>

                        {/* Status Timeline */}
                        <View className="mt-6 mb-2">
                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider mb-4 ml-1">Status Timeline</Text>
                            <Card className="p-5">
                                {order.statusHistory && order.statusHistory.length > 0 ? (
                                    order.statusHistory.map((history: any, idx: number) => (
                                        <View key={idx} className="flex-row">
                                            <View className="items-center mr-4">
                                                <View className={cn(
                                                    "w-3 h-3 rounded-full z-10",
                                                    idx === order.statusHistory.length - 1 ? "bg-accent" : "bg-divider dark:bg-divider-dark"
                                                )} />
                                                {idx < order.statusHistory.length - 1 && (
                                                    <View className="w-0.5 flex-1 bg-divider dark:bg-divider-dark my-1" />
                                                )}
                                            </View>
                                            <View className="flex-1 pb-6">
                                                <View className="flex-row justify-between items-center mb-1">
                                                    <Text className={cn(
                                                        "font-sans-bold text-sm",
                                                        idx === order.statusHistory.length - 1 ? "text-primary dark:text-primary-dark" : "text-secondary dark:text-secondary-dark"
                                                    )}>
                                                        {history.status}
                                                    </Text>
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px]">
                                                        {new Date(history.date).toLocaleDateString('en-GB')} {new Date(history.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </View>
                                                {idx === order.statusHistory.length - 1 && (
                                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Current Status</Text>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View className="flex-row items-center py-2">
                                        <View className="w-3 h-3 rounded-full bg-accent mr-4" />
                                        <View className="flex-1">
                                            <Text className="font-sans-bold text-sm text-primary dark:text-primary-dark">{order.status}</Text>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Initial recorded status</Text>
                                        </View>
                                    </View>
                                )}
                            </Card>
                        </View>

                        {/* Ledger History */}
                        <View className="mt-2">
                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider mb-3 ml-1">Ledger History</Text>
                            {loading ? (
                                <ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} />
                            ) : (
                                ledgerEntries.map((entry, idx) => (
                                    <View key={entry.id} className={cn("flex-row items-center py-4 bg-surface dark:bg-surface-dark px-4 rounded-2xl mb-2 border border-divider dark:border-divider-dark")}>
                                        <View className={cn("w-8 h-8 rounded-full items-center justify-center mr-3",
                                            entry.amount > 0 ? "bg-danger/10" : "bg-success/10"
                                        )}>
                                            {entry.amount > 0 ? <ArrowUpRight size={16} color="#EF4444" /> : <ArrowDownLeft size={16} color="#10B981" />}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-sm">{entry.transactionType}</Text>
                                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">{entry.personName || 'Account'}</Text>
                                        </View>
                                        <Text className={cn("font-sans-bold text-sm", entry.amount > 0 ? "text-danger" : "text-success")}>
                                            {entry.amount > 0 ? '+' : '-'}₹{Math.abs(entry.amount).toLocaleString()}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>

                <ConfirmDialog
                    visible={deleteVisible}
                    title="Delete Order?"
                    message="This will also delete related ledger entries. This action cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteVisible(false)}
                    loading={deleting}
                />
            </SafeAreaView>
        </Background>
    );
}
