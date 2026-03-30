import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTransactions } from '../hooks/useTransactions';
import {
    ChevronLeft, LineChart, Target, BrainCircuit,
    ArrowUpRight, ArrowDownRight, Zap, TrendingUp,
    Ship, Truck, AlertCircle, Award, Users, ShoppingBag, Store,
    BarChart3
} from 'lucide-react-native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

type Tab = 'overview' | 'intelligence' | 'analytics';

const ScreenWidth = Dimensions.get('window').width;

const KPICard = ({ title, value, subtitle, icon: Icon, trend, colorClass }: any) => (
    <Card className="flex-1 p-4 mx-1">
        <View className="flex-row justify-between items-start mb-2">
            <View className={cn("w-8 h-8 rounded-full items-center justify-center", colorClass + "/10")}>
                <Icon size={16} color={colorClass.includes('accent') ? '#4F46E5' : colorClass.includes('success') ? '#10B981' : '#F59E0B'} />
            </View>
            {trend && (
                <View className="flex-row items-center">
                    <Text className="text-[10px] font-sans-bold text-success mr-0.5">{trend}</Text>
                    <TrendingUp size={10} color="#10B981" />
                </View>
            )}
        </View>
        <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-wider">{title}</Text>
        <Text className="text-primary dark:text-primary-dark font-sans-bold text-lg mt-1">{value}</Text>
        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] mt-0.5">{subtitle}</Text>
    </Card>
);

const MiniBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
    <View className="mb-4">
        <View className="flex-row justify-between items-end mb-1.5">
            <Text className="text-primary dark:text-primary-dark font-sans-semibold text-xs">{label}</Text>
            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs">₹{value.toLocaleString()}</Text>
        </View>
        <View className="h-2 bg-divider dark:bg-divider-dark rounded-full overflow-hidden">
            <View
                className={cn("h-full rounded-full", color)}
                style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
            />
        </View>
    </View>
);

const InsightCard = ({ title, description, badge, icon: Icon, color }: any) => (
    <Card className="mb-4 p-5 overflow-hidden">
        <View className="flex-row">
            <View className={cn("w-12 h-12 rounded-2xl items-center justify-center mr-4", color + "/10")}>
                <Icon size={24} color={color.includes('accent') ? '#4F46E5' : color.includes('danger') ? '#EF4444' : color.includes('warning') ? '#F59E0B' : '#8B5CF6'} />
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">{title}</Text>
                    <View className={cn("px-2 py-0.5 rounded-full", color + "/10")}>
                        <Text className={cn("text-[8px] font-sans-bold uppercase", color.replace('bg-', 'text-'))}>{badge}</Text>
                    </View>
                </View>
                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs leading-5">{description}</Text>
            </View>
        </View>
    </Card>
);

export default function Reports({ navigation }: { navigation: any }) {
    const { orders: transactions, loading: transLoading } = useTransactions();
    const { isDark } = useTheme();
    const { isWeb, desktopContainerStyle } = useResponsive();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const metrics = useMemo(() => {
        if (!transactions.length) return null;

        const totalSales = transactions.reduce((sum, t) => sum + (Number(t.sellingPrice) || 0), 0);
        const totalProfit = transactions.reduce((sum, t) => sum + (Number(t.margin) || 0), 0);
        const avgMargin = transactions.length ? totalProfit / transactions.length : 0;
        const totalLogistics = transactions.reduce((sum, t) => sum + (Number(t.shippingCharges || 0) + Number(t.pickupCharges || 0)), 0);

        // Status Distribution
        const statusData: any = {};
        transactions.forEach(t => {
            statusData[t.status] = (statusData[t.status] || 0) + (Number(t.sellingPrice) || 0);
        });
        const maxStatus = Math.max(...Object.values(statusData) as number[], 1);

        // Product/Entity Analysis
        const products: any = {};
        const customers: any = {};
        const vendors: any = {};

        transactions.forEach(t => {
            // Product
            if (!products[t.productName]) products[t.productName] = { name: t.productName, profit: 0, orders: 0, logistics: 0, returns: 0 };
            products[t.productName].profit += (Number(t.margin) || 0);
            products[t.productName].orders++;
            products[t.productName].logistics += (Number(t.shippingCharges || 0) + Number(t.pickupCharges || 0));
            if (t.status === 'Returned' || t.status === 'Canceled') products[t.productName].returns++;

            // Customer
            const cName = t.customerName || 'Walking';
            if (!customers[cName]) customers[cName] = { name: cName, profit: 0, orders: 0, dues: 0 };
            customers[cName].profit += (Number(t.margin) || 0);
            customers[cName].orders++;
            if (t.customerPaymentStatus !== 'Paid') customers[cName].dues += (Number(t.sellingPrice) || 0);

            // Vendor
            const vName = t.vendorName || 'Direct';
            if (!vendors[vName]) vendors[vName] = { name: vName, volume: 0, orders: 0 };
            vendors[vName].volume += (Number(t.sellingPrice) || 0);
            vendors[vName].orders++;
        });

        const topProducts = Object.values(products).sort((a: any, b: any) => b.profit - a.profit).slice(0, 5);
        const topCustomers = Object.values(customers).sort((a: any, b: any) => b.profit - a.profit).slice(0, 5);
        const topVendors = Object.values(vendors).sort((a: any, b: any) => b.volume - a.volume).slice(0, 5);

        // Facts
        const facts = [];
        const topProfitableProduct = topProducts[0];

        if (totalLogistics > (totalProfit * 0.4)) {
            facts.push({
                title: "Logistics Leak",
                description: `Logistics cost (₹${totalLogistics.toLocaleString()}) is currently consuming ${Math.round((totalLogistics / totalProfit) * 100)}% of your gross profit. Consider optimizing pickup strategies.`,
                badge: "Action Required",
                icon: Ship,
                color: "bg-danger"
            });
        }

        if (topProfitableProduct) {
            facts.push({
                title: "Master Product",
                description: `${(topProfitableProduct as any).name} is your most valuable asset, generating ₹${(topProfitableProduct as any).profit.toLocaleString()} in net profit so far.`,
                badge: "Deep Insight",
                icon: Award,
                color: "bg-success"
            });
        }

        const returnRate = transactions.length ? transactions.filter(t => t.status === 'Returned' || t.status === 'Canceled').length / transactions.length : 0;
        if (returnRate > 0.1) {
            facts.push({
                title: "Return Friction",
                description: `${Math.round(returnRate * 100)}% of your orders result in Returns or Cancellations. This effectively burns logistics cost without revenue.`,
                badge: "Strategic Goal",
                icon: Zap,
                color: "bg-warning"
            });
        }

        const customerDues = transactions.reduce((sum, t) => sum + (t.customerPaymentStatus !== 'Paid' ? (Number(t.sellingPrice) || 0) : 0), 0);
        if (customerDues > totalProfit) {
            facts.push({
                title: "Capital Lockup",
                description: `You have ₹${customerDues.toLocaleString()} locked as receivables. This is higher than your total realized profit (₹${totalProfit.toLocaleString()}).`,
                badge: "Financial Alert",
                icon: AlertCircle,
                color: "bg-indigo-500"
            });
        }

        return {
            totalSales, totalProfit, avgMargin, totalLogistics, statusData, maxStatus, facts,
            topProducts, topCustomers, topVendors
        };
    }, [transactions]);

    const renderHeader = () => (
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-surface dark:bg-surface-dark rounded-xl items-center justify-center mr-3 border border-divider dark:border-white/5">
                        <ChevronLeft color={isDark ? '#818CF8' : '#4F46E5'} size={20} />
                    </TouchableOpacity>
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl">Insights</Text>
                </View>
                <View className="w-10 h-10 bg-accent/10 rounded-full items-center justify-center">
                    <BrainCircuit size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                </View>
            </View>

            {/* Premium Tabs */}
            <View className="bg-surface dark:bg-surface-dark p-1.5 rounded-2xl flex-row border border-divider dark:border-white/5 mx-1 mb-6">
                {[
                    { id: 'overview', label: 'Snapshot', icon: LineChart },
                    { id: 'intelligence', label: 'Intelligence', icon: Target },
                    { id: 'analytics', label: 'Lists', icon: BarChart3 },
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as Tab)}
                        style={{
                            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                            paddingVertical: 10, borderRadius: 12,
                            backgroundColor: activeTab === tab.id ? '#4F46E5' : 'transparent',
                        }}
                    >
                        <tab.icon size={14} color={activeTab === tab.id ? "white" : (isDark ? "#94A3B8" : "#64748B")} />
                        <Text style={{
                            fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, marginLeft: 6,
                            textTransform: 'uppercase', letterSpacing: 1.5,
                            color: activeTab === tab.id ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                        }}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (transLoading) {
        return (
            <Background>
                <SafeAreaView className="flex-1 items-center justify-center">
                    <ActivityIndicator color={isDark ? '#818CF8' : '#4F46E5'} size="large" />
                </SafeAreaView>
            </Background>
        );
    }

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View style={[{ flex: 1, width: '100%' }, desktopContainerStyle]}>
                {renderHeader()}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: isWeb ? 40 : 120 }}
                    className="flex-1"
                >
                    {activeTab === 'overview' && metrics && (
                        <View className="px-5">
                            <View className="flex-row mb-4">
                                <KPICard title="Revenue" value={`₹${metrics.totalSales.toLocaleString()}`} subtitle="Gross volume" icon={TrendingUp} colorClass="bg-accent" trend="+12%" />
                                <KPICard title="Net Profit" value={`₹${metrics.totalProfit.toLocaleString()}`} subtitle="After logistics" icon={Zap} colorClass="bg-success" trend="+8%" />
                            </View>

                            <Card className="p-6 mb-4">
                                <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest mb-4">Revenue by Status</Text>
                                <MiniBar label="Delivered" value={metrics.statusData['Delivered'] || 0} max={metrics.maxStatus} color="bg-success" />
                                <MiniBar label="Booked / Shipped" value={(metrics.statusData['Booked'] || 0) + (metrics.statusData['Shipped'] || 0)} max={metrics.maxStatus} color="bg-accent" />
                                <MiniBar label="Returns / Canceled" value={(metrics.statusData['Returned'] || 0) + (metrics.statusData['Canceled'] || 0)} max={metrics.maxStatus} color="bg-danger" />
                            </Card>

                            <Card className="p-6 mb-4">
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest">Business Efficiency</Text>
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mt-1">{Math.round((metrics.totalProfit / metrics.totalSales) * 100)}%</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Margin Ratio</Text>
                                    </View>
                                    <View className="w-16 h-16 rounded-full border-4 border-accent items-center justify-center">
                                        <TrendingUp color={isDark ? '#818CF8' : '#4F46E5'} size={24} />
                                    </View>
                                </View>
                                <View className="flex-row justify-between pt-4 border-t border-divider dark:border-divider-dark">
                                    <View className="items-center flex-1">
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">₹{Math.round(metrics.avgMargin).toLocaleString()}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] uppercase">Avg/Order</Text>
                                    </View>
                                    <View className="w-[1px] h-full bg-divider dark:bg-divider-dark mx-4" />
                                    <View className="items-center flex-1">
                                        <Text className="text-danger font-sans-bold text-base">₹{metrics.totalLogistics.toLocaleString()}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] uppercase">Logistics</Text>
                                    </View>
                                </View>
                            </Card>
                        </View>
                    )}

                    {activeTab === 'intelligence' && metrics && (
                        <View className="px-5">
                            <View className="bg-indigo-500/10 p-5 rounded-3xl mb-6 border border-indigo-500/20">
                                <View className="flex-row items-center mb-2">
                                    <BrainCircuit color="#6366F1" size={20} />
                                    <Text className="text-indigo-500 font-sans-bold text-sm ml-2">Intelligence Engine</Text>
                                </View>
                                <Text className="text-secondary dark:text-secondary-dark font-sans text-xs leading-5">Deep analysis of your last {transactions.length} transactions to uncover hidden patterns and profit leaks.</Text>
                            </View>
                            {metrics.facts.map((fact, i) => (
                                <InsightCard key={i} {...fact} />
                            ))}
                            {metrics.facts.length === 0 && (
                                <View className="py-20 items-center opacity-40">
                                    <Target size={40} color="#94A3B8" />
                                    <Text className="text-secondary font-sans mt-4">Data too thin for deep patterns</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'analytics' && metrics && (
                        <View className="px-5">
                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest mb-4 ml-1">Top Products</Text>
                            {metrics.topProducts.map((p: any, i: number) => (
                                <View key={i} className="flex-row items-center py-4 px-4 bg-surface dark:bg-surface-dark border border-divider dark:border-white/5 rounded-2xl mb-2">
                                    <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-3">
                                        <ShoppingBag size={18} color="#4F46E5" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">{p.name}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] mt-0.5">{p.orders} Orders</Text>
                                    </View>
                                    <Text className="text-success font-sans-bold text-base">₹{p.profit.toLocaleString()}</Text>
                                </View>
                            ))}

                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest mt-6 mb-4 ml-1">Premium Customers</Text>
                            {metrics.topCustomers.map((c: any, i: number) => (
                                <View key={i} className="flex-row items-center py-4 px-4 bg-surface dark:bg-surface-dark border border-divider dark:border-white/5 rounded-2xl mb-2">
                                    <View className="w-10 h-10 bg-success/10 rounded-xl items-center justify-center mr-3">
                                        <Users size={18} color="#10B981" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">{c.name}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] mt-0.5">{c.orders} Purchases</Text>
                                    </View>
                                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">₹{c.profit.toLocaleString()}</Text>
                                </View>
                            ))}

                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-[10px] uppercase tracking-widest mt-6 mb-4 ml-1">Key Vendors</Text>
                            {metrics.topVendors.map((v: any, i: number) => (
                                <View key={i} className="flex-row items-center py-4 px-4 bg-surface dark:bg-surface-dark border border-divider dark:border-white/5 rounded-2xl mb-2">
                                    <View className="w-10 h-10 bg-warning/10 rounded-xl items-center justify-center mr-3">
                                        <Store size={18} color="#F59E0B" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-sm">{v.name}</Text>
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-[10px] mt-0.5">{v.orders} Orders</Text>
                                    </View>
                                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-base">₹{v.volume.toLocaleString()}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
                </View>
            </SafeAreaView>
        </Background>
    );
}
