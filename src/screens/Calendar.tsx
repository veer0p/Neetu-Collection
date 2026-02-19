import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { supabaseService } from '../store/supabaseService';
import { useTransactions } from '../hooks/useTransactions';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ClipboardList, Wallet } from 'lucide-react-native';
import { cn } from '../utils/cn';

export default function Calendar({ navigation }: any) {
    const { isDark } = useTheme();
    const { userId } = useTransactions();
    const [viewDate, setViewDate] = useState(new Date());
    const [events, setEvents] = useState<{ [key: string]: { hasOrder: boolean; hasPayment: boolean; items: any[]; statuses: string[] } }>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["S", "M", "T", "W", "T", "F", "S"];

    useEffect(() => {
        if (userId) loadEvents();
    }, [userId, viewDate]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const userId_str = userId!;
            const transactions = await supabaseService.getTransactions(userId_str);
            const markers: { [key: string]: { hasOrder: boolean; hasPayment: boolean; items: any[]; statuses: string[] } } = {};

            transactions.forEach((t: any) => {
                const parseDateStr = (dStr: string) => {
                    if (!dStr) return '';
                    if (dStr.includes('/')) {
                        const parts = dStr.split('/');
                        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                    return dStr.split('T')[0];
                };

                const addMarker = (dateKey: string, type: string, status?: string) => {
                    if (!dateKey) return;
                    if (!markers[dateKey]) markers[dateKey] = { hasOrder: false, hasPayment: false, items: [], statuses: [] };

                    if (type === 'Order') markers[dateKey].hasOrder = true;
                    if (type === 'Payment') markers[dateKey].hasPayment = true;
                    if (status) {
                        const existing = markers[dateKey].items.find(item => item.id === t.id);
                        if (!existing) {
                            markers[dateKey].items.push({ ...t, currentDisplayStatus: status });
                        }
                        if (!markers[dateKey].statuses.find(s => s === status)) {
                            markers[dateKey].statuses.push(status);
                        }
                    }
                };

                // 1. Mark creation date
                const creationDate = parseDateStr(t.date);
                if (creationDate) {
                    if (t.type === 'Sale' || t.type === 'Purchase') {
                        addMarker(creationDate, 'Order', t.status);
                    } else if (t.type === 'Payment' || t.type === 'Reimbursement') {
                        addMarker(creationDate, 'Payment');
                        markers[creationDate].items.push(t);
                    }
                }

                // 2. Mark status history dates
                if (t.statusHistory && Array.isArray(t.statusHistory)) {
                    t.statusHistory.forEach((h: any) => {
                        const hDate = parseDateStr(h.date);
                        if (hDate) {
                            addMarker(hDate, 'Order', h.status);
                        }
                    });
                }
            });

            setEvents(markers);
        } catch (e) {
            console.error('Calendar load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const calendar = [];
        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) calendar.push(null);
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) calendar.push(i);

        return calendar;
    };

    const handleDatePress = (day: number) => {
        const year = viewDate.getFullYear();
        const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const dateKey = `${year}-${month}-${dayStr}`;

        setSelectedDate(dateKey);
        setSelectedEvents(events[dateKey]?.items || []);
    };

    const calendarDays = generateCalendar();

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={loadEvents}
                            tintColor={isDark ? '#818CF8' : '#4F46E5'}
                        />
                    }
                >
                    <View className="flex-row items-center justify-between mb-6 pt-2">
                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl">Business Calendar</Text>
                        <View className="p-2.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                            <CalendarIcon size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                        </View>
                    </View>

                    {/* Month Selector */}
                    <View className="flex-row items-center justify-between mb-6 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                        <TouchableOpacity
                            onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            className="p-3"
                        >
                            <ChevronLeft size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                        </TouchableOpacity>
                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-lg">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            className="p-3"
                        >
                            <ChevronRight size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar Grid */}
                    <View className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-md border border-black/5 dark:border-white/5">
                        <View className="flex-row mb-4">
                            {days.map((d, i) => (
                                <Text key={i} className="flex-1 text-center text-secondary dark:text-secondary-dark font-sans-bold text-xs">
                                    {d}
                                </Text>
                            ))}
                        </View>

                        <View className="flex-row flex-wrap">
                            {calendarDays.map((day, i) => (
                                <View key={i} style={{ width: '14.28%', height: 50, padding: 2 }}>
                                    {day && (
                                        <TouchableOpacity
                                            onPress={() => handleDatePress(day)}
                                            className={cn(
                                                "flex-1 items-center justify-center rounded-xl",
                                                selectedDate === `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                                                    ? "bg-accent" : ""
                                            )}
                                        >
                                            <Text className={cn(
                                                "font-sans text-sm",
                                                selectedDate === `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                                                    ? "text-white font-sans-bold" : "text-primary dark:text-primary-dark"
                                            )}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Selected Day Legend / Detail */}
                    <View className="mt-6 mb-10">
                        {selectedDate ? (
                            <View>
                                <View className="flex-row justify-between items-center mb-4 ml-1">
                                    <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-widest">
                                        Events for {selectedDate}
                                    </Text>
                                    <View className="flex-row gap-3">
                                        <View className="flex-row items-center">
                                            <Text className="text-indigo-500 font-sans-bold text-xs">{selectedEvents.filter(e => e.type !== 'Payment').length} Orders</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <Text className="text-emerald-500 font-sans-bold text-xs">{selectedEvents.filter(e => e.type === 'Payment').length} Payments</Text>
                                        </View>
                                    </View>
                                </View>
                                {selectedEvents.length > 0 ? (
                                    selectedEvents.map((item, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => item.type !== 'Payment' && navigation.navigate('OrderDetail', { orderId: item.id })}
                                        >
                                            <Card className="mb-3 p-4">
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center">
                                                        <View className={cn(
                                                            "p-2 rounded-xl mr-3",
                                                            item.type === 'Payment' ? "bg-emerald-500/10" : "bg-indigo-500/10"
                                                        )}>
                                                            {item.type === 'Payment' ?
                                                                <Wallet size={16} color="#10B981" /> :
                                                                <ClipboardList size={16} color="#4F46E5" />
                                                            }
                                                        </View>
                                                        <View>
                                                            <Text className="text-primary dark:text-primary-dark font-sans-bold">{item.customerName || item.supplierName}</Text>
                                                            <Text className="text-secondary dark:text-secondary-dark text-[11px]">
                                                                {item.type} • {item.productName || 'No Item'}
                                                                {item.currentDisplayStatus && (
                                                                    <Text className="text-accent font-sans-bold"> • {item.currentDisplayStatus}</Text>
                                                                )}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text className={cn(
                                                        "font-sans-bold",
                                                        item.type === 'Payment' ? "text-emerald-500" : "text-primary dark:text-primary-dark"
                                                    )}>
                                                        ₹{item.amount?.toLocaleString() || item.sellingPrice?.toLocaleString()}
                                                    </Text>
                                                </View>
                                            </Card>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View className="py-8 items-center bg-white/30 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs italic">No entries for this date</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="flex-row justify-around p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Orders</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Payments</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
