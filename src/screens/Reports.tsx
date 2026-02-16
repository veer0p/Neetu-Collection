import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import { supabaseService } from '../store/supabaseService';
import { BarChart3, Users, Store, ChevronLeft, TrendingUp, ShoppingBag } from 'lucide-react-native';
import { cn } from '../utils/cn';

type Tab = 'products' | 'customers' | 'vendors' | 'trends';

export default function Reports() {
    const navigation = useNavigation();
    const { orders: transactions, loading: transLoading, refresh, userId } = useTransactions();
    const [activeTab, setActiveTab] = useState<Tab>('products');
    const [loading, setLoading] = useState(true);
    const [productAnalysis, setProductAnalysis] = useState<any[]>([]);
    const [customerAnalysis, setCustomerAnalysis] = useState<any[]>([]);
    const [vendorAnalysis, setVendorAnalysis] = useState<any[]>([]);

    useEffect(() => {
        if (transactions.length > 0) {
            analyzeData();
        } else if (!transLoading) {
            setLoading(false);
        }
    }, [transactions, transLoading]);

    const analyzeData = async () => {
        setLoading(true);
        try {
            // Product Analysis
            const products: any = {};
            transactions.forEach(t => {
                if (!products[t.productName]) {
                    products[t.productName] = { name: t.productName, count: 0, profit: 0, margins: [] };
                }
                products[t.productName].count++;
                products[t.productName].profit += (Number(t.margin) || 0);
                products[t.productName].margins.push(Number(t.margin) || 0);
            });
            const pArr = Object.values(products).map((p: any) => ({
                ...p,
                avgMargin: p.profit / p.count
            })).sort((a, b) => b.profit - a.profit);
            setProductAnalysis(pArr);

            // Customer Analysis
            const customers: any = {};
            transactions.forEach(t => {
                const name = t.customerName || 'Walking Customer';
                if (!customers[name]) {
                    customers[name] = { name, orders: 0, profit: 0, paid: 0, udhar: 0, balance: 0 };
                }
                customers[name].orders++;
                customers[name].profit += (Number(t.margin) || 0);
                if (t.customerPaymentStatus === 'Paid') customers[name].paid++;
                else customers[name].udhar++;
            });

            // Get balances for directory items
            if (userId) {
                const directory = await supabaseService.getDirectoryWithBalances(userId);
                directory.forEach(item => {
                    if (customers[item.name]) {
                        customers[item.name].balance = item.balance;
                    }
                });
            }

            setCustomerAnalysis(Object.values(customers).sort((a: any, b: any) => b.profit - a.profit));

            // Vendor Analysis
            const vendors: any = {};
            transactions.forEach(t => {
                const name = t.vendorName || 'Direct';
                if (!vendors[name]) {
                    vendors[name] = { name, orders: 0, volume: 0 };
                }
                vendors[name].orders++;
                vendors[name].volume += (Number(t.sellingPrice) || 0);
            });
            setVendorAnalysis(Object.values(vendors).sort((a: any, b: any) => b.volume - a.volume));

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'products', label: 'Top Products', icon: ShoppingBag },
        { id: 'customers', label: 'Key Customers', icon: Users },
        { id: 'vendors', label: 'Top Vendors', icon: Store },
        { id: 'trends', label: 'Trends', icon: TrendingUp },
    ] as const;

    const renderHeader = () => (
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-4">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface dark:bg-surface-dark rounded-xl mr-3">
                    <ChevronLeft color="#4F46E5" size={20} />
                </TouchableOpacity>
                <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl">Insights</Text>
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
    );

    const renderProducts = () => (
        <View className="px-6 py-2">
            {productAnalysis.slice(0, 10).map((p, i) => (
                <Card key={i} className="mb-3 p-4">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">{p.name}</Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">{p.count} orders • Avg. profit ₹{Math.round(p.avgMargin).toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-success font-sans-bold text-base">₹{p.profit.toLocaleString()}</Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">Total Profit</Text>
                        </View>
                    </View>
                </Card>
            ))}
        </View>
    );

    const renderCustomers = () => (
        <View className="px-6 py-2">
            {customerAnalysis.slice(0, 10).map((c, i) => (
                <Card key={i} className="mb-3 p-4">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">{c.name}</Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">{c.orders} orders • {c.paid} paid / {c.udhar} udhar</Text>
                        </View>
                        <View className="items-end">
                            <Text className={cn("font-sans-bold text-base", c.balance > 0 ? "text-danger" : "text-success")}>
                                ₹{Math.abs(c.balance).toLocaleString()}
                            </Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">{c.balance > 0 ? "Receivable" : "Settled"}</Text>
                        </View>
                    </View>
                </Card>
            ))}
        </View>
    );

    const renderVendors = () => (
        <View className="px-6 py-2">
            {vendorAnalysis.slice(0, 10).map((v, i) => (
                <Card key={i} className="mb-3 p-4">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">{v.name}</Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">{v.orders} orders placed</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">₹{v.volume.toLocaleString()}</Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-1">Total Volume</Text>
                        </View>
                    </View>
                </Card>
            ))}
        </View>
    );

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                {renderHeader()}
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color="#4F46E5" size="large" />
                        </View>
                    ) : (
                        <>
                            {activeTab === 'products' && renderProducts()}
                            {activeTab === 'customers' && renderCustomers()}
                            {activeTab === 'vendors' && renderVendors()}
                            {activeTab === 'trends' && (
                                <View className="px-6 py-20 items-center">
                                    <BarChart3 size={48} color="#9CA3AF" />
                                    <Text className="text-secondary dark:text-secondary-dark font-sans mt-4">Trends coming soon</Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
