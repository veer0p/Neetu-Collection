import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ClipboardList, Plus, Wallet, Settings as SettingsIcon, BarChart3, Contact2, Calculator as CalculatorIcon, CalendarDays } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import AddEntry from '../screens/AddEntry';
import Transactions from '../screens/Transactions';
import Ledger from '../screens/Ledger';
import Settings from '../screens/Settings';
import Directory from '../screens/Directory';
import Reports from '../screens/Reports';
import Calculator from '../screens/Calculator';
import Calendar from '../screens/Calendar';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOCK_MARGIN = 20;
const DOCK_WIDTH = SCREEN_WIDTH - (DOCK_MARGIN * 2);

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const { isDark } = useTheme();
    const scrollRef = useRef<ScrollView>(null);

    // Filter out the 'Add' tab as we render it as a fixed overlay
    const mainRoutes = state.routes.filter((r: any) => r.name !== 'Add');

    // Group routes into pages of 4 icons each (2 on left, 2 on right)
    const pages = [];
    for (let i = 0; i < mainRoutes.length; i += 4) {
        pages.push(mainRoutes.slice(i, i + 4));
    }

    // Scroll to the correct page when a tab is selected
    useEffect(() => {
        const activeRoute = state.routes[state.index];
        if (activeRoute.name === 'Add') return;

        const routeIndex = mainRoutes.findIndex((r: any) => r.name === activeRoute.name);
        const pageIndex = Math.floor(routeIndex / 4);

        scrollRef.current?.scrollTo({ x: pageIndex * DOCK_WIDTH, animated: true });
    }, [state.index, mainRoutes]);

    return (
        <View style={{
            position: 'absolute',
            bottom: 30,
            left: DOCK_MARGIN,
            right: DOCK_MARGIN,
            height: 64,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={true}
                overScrollMode="never"
                snapToInterval={DOCK_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={{
                    alignItems: 'center',
                }}
            >
                {pages.map((pageRoutes, pageIdx) => (
                    <View key={pageIdx} style={{ width: DOCK_WIDTH, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
                        {/* Left Icons (First 2) */}
                        <View className="flex-row flex-1 justify-around">
                            {pageRoutes.slice(0, 2).map((route: any) => {
                                const { options } = descriptors[route.key];
                                const isFocused = state.routes[state.index].name === route.name;
                                const Icon = options.tabBarIcon;

                                return (
                                    <TouchableOpacity
                                        key={route.key}
                                        onPress={() => navigation.navigate(route.name)}
                                        className="items-center justify-center"
                                        style={{ width: 60 }}
                                    >
                                        <View className={cn(
                                            "p-2.5 rounded-2xl items-center justify-center transition-all duration-200",
                                            isFocused ? (isDark ? "bg-accent/25" : "bg-accent/10") : ""
                                        )}>
                                            <Icon size={22} color={isFocused ? (isDark ? '#818CF8' : '#4F46E5') : (isDark ? '#94A3B8' : '#64748B')} strokeWidth={isFocused ? 2.5 : 2} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Gap for the fixed 'Add' button */}
                        <View style={{ width: 80 }} />

                        {/* Right Icons (Next 2) */}
                        <View className="flex-row flex-1 justify-around">
                            {pageRoutes.slice(2, 4).map((route: any) => {
                                const { options } = descriptors[route.key];
                                const isFocused = state.routes[state.index].name === route.name;
                                const Icon = options.tabBarIcon;

                                return (
                                    <TouchableOpacity
                                        key={route.key}
                                        onPress={() => navigation.navigate(route.name)}
                                        className="items-center justify-center"
                                        style={{ width: 60 }}
                                    >
                                        <View className={cn(
                                            "p-2.5 rounded-2xl items-center justify-center transition-all duration-200",
                                            isFocused ? (isDark ? "bg-accent/25" : "bg-accent/10") : ""
                                        )}>
                                            <Icon size={22} color={isFocused ? (isDark ? '#818CF8' : '#4F46E5') : (isDark ? '#94A3B8' : '#64748B')} strokeWidth={isFocused ? 2.5 : 2} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            {/* Fill empty slots if last page has < 4 icons */}
                            {pageRoutes.length < 3 && <View style={{ width: 60 }} />}
                            {pageRoutes.length < 4 && <View style={{ width: 60 }} />}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Fixed Central Add Button Overlay */}
            <View pointerEvents="box-none" style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Add')}
                    activeOpacity={0.8}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: isDark ? '#818CF8' : '#4F46E5',
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 4,
                        shadowColor: '#4F46E5',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                >
                    <Plus color="#FFFFFF" size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export const MainTabs = ({ user, onLogout }: { user: any, onLogout: () => void }) => (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
            headerShown: false,
        }}
    >
        <Tab.Screen name="Home" options={{ tabBarIcon: ({ color, size }: any) => <Home color={color} size={size} /> }}>
            {(props: any) => <Dashboard {...props} user={user} onLogout={onLogout} />}
        </Tab.Screen>
        <Tab.Screen name="Orders" component={Transactions} options={{ tabBarIcon: ({ color, size }: any) => <ClipboardList color={color} size={size} /> }} />
        <Tab.Screen name="Ledger" component={Ledger} options={{ tabBarIcon: ({ color, size }: any) => <Wallet color={color} size={size} /> }} />
        <Tab.Screen name="Directory" component={Directory} options={{ tabBarIcon: ({ color, size }: any) => <Contact2 color={color} size={size} /> }} />
        <Tab.Screen name="Insights" component={Reports} options={{ tabBarIcon: ({ color, size }: any) => <BarChart3 color={color} size={size} /> }} />
        <Tab.Screen name="Calculator" component={Calculator} options={{ tabBarIcon: ({ color, size }: any) => <CalculatorIcon color={color} size={size} /> }} />
        <Tab.Screen name="Calendar" component={Calendar} options={{ tabBarIcon: ({ color, size }: any) => <CalendarDays color={color} size={size} /> }} />
        <Tab.Screen name="Settings" options={{ tabBarIcon: ({ color, size }: any) => <SettingsIcon color={color} size={size} /> }}>
            {(props: any) => <Settings {...props} user={user} onLogout={onLogout} />}
        </Tab.Screen>
        <Tab.Screen name="Add" component={AddEntry} options={{ tabBarIcon: ({ color, size }: any) => <Plus color={color} size={size} /> }} />
    </Tab.Navigator>
);
