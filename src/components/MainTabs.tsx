import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
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
import { useResponsive } from '../hooks/useResponsive';

const Tab = createBottomTabNavigator();

// ─── Nav Item Definitions ────────────────────────────────────────────────────

type TabName = 'Home' | 'Orders' | 'Add' | 'Ledger' | 'Directory' | 'Insights' | 'Calculator' | 'Calendar' | 'Settings';

const NAV_ITEMS: { name: TabName; label: string; Icon: any }[] = [
    { name: 'Home', label: 'Dashboard', Icon: Home },
    { name: 'Orders', label: 'Orders', Icon: ClipboardList },
    { name: 'Add', label: 'New Order', Icon: Plus },
    { name: 'Ledger', label: 'Ledger', Icon: Wallet },
    { name: 'Directory', label: 'Directory', Icon: Contact2 },
    { name: 'Insights', label: 'Insights', Icon: BarChart3 },
    { name: 'Calculator', label: 'Calculator', Icon: CalculatorIcon },
    { name: 'Calendar', label: 'Calendar', Icon: CalendarDays },
    { name: 'Settings', label: 'Settings', Icon: SettingsIcon },
];

// ─── Web Sidebar + Manual Screen Renderer ────────────────────────────────────

const WebLayout = ({ user, onLogout, parentNavigation }: { user: any; onLogout: () => void; parentNavigation?: any }) => {
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabName>('Home');
    const [routeParams, setRouteParams] = useState<Record<string, any>>({});

    // Fake navigation object so screens that call navigation.navigate / navigation.goBack work
    const makeNavigation = (navigate: (name: string, params?: any) => void) => ({
        navigate,
        goBack: () => {
            setRouteParams(prev => ({ ...prev, [activeTab]: undefined }));
            setActiveTab('Home');
        },
        push: navigate,
        replace: navigate,
        setOptions: () => { },
        addListener: () => ({ remove: () => { } }),
        removeListener: () => { },
        isFocused: () => true,
        canGoBack: () => false,
        dispatch: () => { },
        reset: () => { },
        getParent: () => parentNavigation,
        getState: () => ({}),
    });

    const navigate = (name: string, params?: any) => {
        if (NAV_ITEMS.find(n => n.name === name)) {
            setRouteParams(prev => ({ ...prev, [name]: params }));
            setActiveTab(name as TabName);
        } else if (parentNavigation) {
            parentNavigation.navigate(name, params);
        }
    };

    const navigation = makeNavigation(navigate);

    const renderScreen = () => {
        const nav = navigation as any;
        const mockRoute = { params: routeParams[activeTab] || {} };
        const s = (C: any, extra?: object) => React.createElement(C, { navigation: nav, route: mockRoute, ...extra });
        switch (activeTab) {
            case 'Home': return s(Dashboard, { user, onLogout });
            case 'Orders': return s(Transactions);
            case 'Add': return s(AddEntry);
            case 'Ledger': return s(Ledger);
            case 'Directory': return s(Directory);
            case 'Insights': return s(Reports);
            case 'Calculator': return s(Calculator);
            case 'Calendar': return s(Calendar);
            case 'Settings': return s(Settings, { user, onLogout });
            default: return s(Dashboard, { user, onLogout });
        }
    };

    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
            {/* Sidebar */}
            <View style={{
                width: 210,
                height: '100%' as any,
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                borderRightWidth: 1,
                borderRightColor: isDark ? '#1E293B' : '#E2E8F0',
                paddingTop: 32,
                paddingHorizontal: 12,
            }}>
                {/* Logo */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, paddingHorizontal: 8 }}>
                    <View style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: isDark ? '#818CF8' : '#4F46E5',
                        alignItems: 'center', justifyContent: 'center', marginRight: 10,
                    }}>
                        <Text style={{ color: '#FFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>N</Text>
                    </View>
                    <Text style={{
                        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14,
                        color: isDark ? '#F1F5F9' : '#0F172A',
                    }}>Neetu Collection</Text>
                </View>

                {/* Nav items */}
                {NAV_ITEMS.map(({ name, label, Icon }) => {
                    const isFocused = activeTab === name;
                    const iconColor = isFocused ? (isDark ? '#818CF8' : '#4F46E5') : (isDark ? '#64748B' : '#94A3B8');

                    return (
                        <TouchableOpacity
                            key={name}
                            onPress={() => setActiveTab(name)}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                paddingHorizontal: 10, paddingVertical: 10,
                                borderRadius: 10, marginBottom: 4,
                                backgroundColor: isFocused
                                    ? (isDark ? 'rgba(129,140,248,0.12)' : 'rgba(79,70,229,0.08)')
                                    : 'transparent',
                            }}
                        >
                            <Icon
                                size={18}
                                color={iconColor}
                                strokeWidth={isFocused ? 2.5 : 2}
                            />
                            <Text style={{
                                marginLeft: 10,
                                fontFamily: isFocused ? 'PlusJakartaSans_600SemiBold' : 'PlusJakartaSans_400Regular',
                                fontSize: 13,
                                color: iconColor,
                            }}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Screen content */}
            <View style={{ flex: 1, overflow: 'hidden' as any }}>
                {renderScreen()}
            </View>
        </View>
    );
};

// ─── Mobile Floating Dock ───────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOCK_MARGIN = 20;
const DOCK_WIDTH = SCREEN_WIDTH - (DOCK_MARGIN * 2);

const MobileTabBar = ({ state, descriptors, navigation }: any) => {
    const { isDark } = useTheme();
    const scrollRef = useRef<ScrollView>(null);

    const mainRoutes = state.routes.filter((r: any) => r.name !== 'Add');
    const pages = [];
    for (let i = 0; i < mainRoutes.length; i += 4) {
        pages.push(mainRoutes.slice(i, i + 4));
    }

    useEffect(() => {
        const activeRoute = state.routes[state.index];
        if (activeRoute.name === 'Add') return;
        const routeIndex = mainRoutes.findIndex((r: any) => r.name === activeRoute.name);
        const pageIndex = Math.floor(routeIndex / 4);
        scrollRef.current?.scrollTo({ x: pageIndex * DOCK_WIDTH, animated: true });
    }, [state.index, mainRoutes]);

    return (
        <View
            style={{
                position: 'absolute', bottom: 30, left: DOCK_MARGIN, right: DOCK_MARGIN, height: 64,
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 32,
                elevation: 10,
                overflow: 'hidden', borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
            // Move complex shadows to a non-conflicting structure for Android
            {...Platform.select({
                ios: {
                    style: {
                        position: 'absolute', bottom: 30, left: DOCK_MARGIN, right: DOCK_MARGIN, height: 64,
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 32,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.15, shadowRadius: 20,
                        overflow: 'hidden', borderWidth: 1.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }
                }
            })}
        >
            <ScrollView
                ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                bounces={true} overScrollMode="never"
                snapToInterval={DOCK_WIDTH} decelerationRate="fast"
                contentContainerStyle={{ alignItems: 'center' }}
            >
                {pages.map((pageRoutes, pageIdx) => (
                    <View key={pageIdx} style={{ width: DOCK_WIDTH, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
                        <View className="flex-row flex-1 justify-around">
                            {pageRoutes.slice(0, 2).map((route: any) => {
                                const { options } = descriptors[route.key];
                                const isFocused = state.routes[state.index].name === route.name;
                                const Icon = options.tabBarIcon;
                                return (
                                    <TouchableOpacity key={route.key} onPress={() => navigation.navigate(route.name)}
                                        className="items-center justify-center" style={{ width: 60 }}>
                                        <View className={cn('p-2.5 rounded-2xl items-center justify-center',
                                            isFocused ? (isDark ? 'bg-accent/25' : 'bg-accent/10') : '')}>
                                            <Icon size={22} color={isFocused ? (isDark ? '#818CF8' : '#4F46E5') : (isDark ? '#94A3B8' : '#64748B')} strokeWidth={isFocused ? 2.5 : 2} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={{ width: 80 }} />
                        <View className="flex-row flex-1 justify-around">
                            {pageRoutes.slice(2, 4).map((route: any) => {
                                const { options } = descriptors[route.key];
                                const isFocused = state.routes[state.index].name === route.name;
                                const Icon = options.tabBarIcon;
                                return (
                                    <TouchableOpacity key={route.key} onPress={() => navigation.navigate(route.name)}
                                        className="items-center justify-center" style={{ width: 60 }}>
                                        <View className={cn('p-2.5 rounded-2xl items-center justify-center',
                                            isFocused ? (isDark ? 'bg-accent/25' : 'bg-accent/10') : '')}>
                                            <Icon size={22} color={isFocused ? (isDark ? '#818CF8' : '#4F46E5') : (isDark ? '#94A3B8' : '#64748B')} strokeWidth={isFocused ? 2.5 : 2} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            {pageRoutes.length < 3 && <View style={{ width: 60 }} />}
                            {pageRoutes.length < 4 && <View style={{ width: 60 }} />}
                        </View>
                    </View>
                ))}
            </ScrollView>
            {/* Fixed Central Add Button */}
            <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.navigate('Add')} activeOpacity={0.8}
                    style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? '#818CF8' : '#4F46E5', justifyContent: 'center', alignItems: 'center', elevation: 4 }}>
                    <View style={Platform.select({
                        ios: {
                            shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
                        }
                    })}>
                        <Plus color="#FFFFFF" size={24} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Root Tab Navigator (Mobile only) ───────────────────────────────────────

const MobileNavigator = ({ user, onLogout }: { user: any; onLogout: () => void }) => (
    <Tab.Navigator
        tabBar={(props) => <MobileTabBar {...props} />}
        screenOptions={{ headerShown: false }}
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

// ─── Main Export ─────────────────────────────────────────────────────────────

export const MainTabs = ({ user, onLogout, navigation }: { user: any; onLogout: () => void; navigation?: any }) => {
    const { isWeb, isWide } = useResponsive();

    if (isWeb && isWide) {
        return <WebLayout user={user} onLogout={onLogout} parentNavigation={navigation} />;
    }

    return <MobileNavigator user={user} onLogout={onLogout} />;
};
