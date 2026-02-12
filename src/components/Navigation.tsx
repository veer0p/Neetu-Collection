import React, { useState, useEffect } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { NavigationContainer, DarkTheme, DrawerActions, createNavigationContainerRef, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View, ActivityIndicator, Text, TouchableOpacity, Switch } from 'react-native';
import { LayoutDashboard, History, BarChart3, Contact2, LogOut, Menu, Fingerprint } from 'lucide-react-native';
import { useBiometrics } from '../hooks/useBiometrics';
import { LockScreen } from '../screens/LockScreen';
import Login from '../screens/Login';
import { supabaseService } from '../store/supabaseService';
import { MainTabs } from './MainTabs';

const Drawer = createDrawerNavigator();
const navigationRef = createNavigationContainerRef();

const CustomDrawerContent = (props: any) => {
    const { onLogout, navigation } = props;
    const { isEnabled, toggleBiometrics } = useBiometrics();

    const navigateToTab = (routeName: string) => {
        navigation.navigate('Main', { screen: routeName });
        navigation.closeDrawer();
    };

    return (
        <View className="flex-1 bg-[#0f172a]">
            <View className="px-6 pt-16 pb-8 border-b border-white/10">
                <Text className="text-white font-sans-bold text-xl">Neetu Collection</Text>
                <Text className="text-gray-400 font-sans text-xs mt-1">Business Manager</Text>
            </View>
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 20 }}>
                <DrawerItem
                    label="Dashboard"
                    labelStyle={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: '#94a3b8' }}
                    icon={({ size }) => <LayoutDashboard color="#94a3b8" size={size} />}
                    onPress={() => navigateToTab('HomeTab')}
                />
                <DrawerItem
                    label="Directory"
                    labelStyle={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: '#94a3b8' }}
                    icon={({ size }) => <Contact2 color="#94a3b8" size={size} />}
                    onPress={() => navigateToTab('Directory')}
                />
                <DrawerItem
                    label="Business Insights"
                    labelStyle={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: '#94a3b8' }}
                    icon={({ size }) => <BarChart3 color="#94a3b8" size={size} />}
                    onPress={() => navigateToTab('Insights')}
                />

                <View className="h-[1px] bg-white/10 mx-6 my-4" />

                <View className="px-5 py-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <Fingerprint color="#94a3b8" size={20} />
                        <Text className="text-[#94a3b8] font-sans-semibold text-sm">Biometric Lock</Text>
                    </View>
                    <Switch
                        value={isEnabled}
                        onValueChange={(val) => { toggleBiometrics(val); }}
                        trackColor={{ false: '#1e293b', true: '#6366f1' }}
                        thumbColor={isEnabled ? '#ffffff' : '#94a3b8'}
                    />
                </View>

                <DrawerItem
                    label="Sign Out"
                    labelStyle={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: '#f87171' }}
                    icon={({ size }) => <LogOut color="#f87171" size={size} />}
                    onPress={() => onLogout()}
                />
            </DrawerContentScrollView>
            <View className="p-6 border-t border-white/10">
                <Text className="text-gray-500 font-sans text-[10px] text-center">Version 1.0.0</Text>
            </View>
        </View>
    );
};

function getHeaderTitle(route: any) {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeTab';

    switch (routeName) {
        case 'HomeTab': return 'Dashboard';
        case 'Udhar': return 'Udhar Management';
        case 'Add': return 'Add Sale';
        case 'History': return 'Orders';
        case 'Directory': return 'Directory';
        case 'Insights': return 'Business Insights';
        default: return 'Dashboard';
    }
}

export const AppNavigation = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasUnlocked, setHasUnlocked] = useState(false);
    const { isEnabled, checkStatus, loading: biometricsLoading } = useBiometrics();

    useEffect(() => {
        const init = async () => {
            await checkSession();
            await checkStatus();
            setLoading(false);
        };
        init();
    }, []);

    const isLocked = user && isEnabled && !hasUnlocked;

    const checkSession = async () => {
        try {
            const currentUser = await supabaseService.getCurrentUser();
            setUser(currentUser);
        } catch (e) {
            console.error('Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabaseService.signOut();
        setUser(null);
    };

    if (loading || biometricsLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef} theme={DarkTheme}>
            {!user ? (
                <Login onLoginSuccess={(userData) => setUser(userData)} />
            ) : isLocked ? (
                <LockScreen onUnlock={() => setHasUnlocked(true)} />
            ) : (
                <Drawer.Navigator
                    drawerContent={(props) => <CustomDrawerContent {...props} onLogout={handleLogout} />}
                    screenOptions={{
                        headerShown: true,
                        headerStyle: {
                            backgroundColor: '#0f172a',
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                            elevation: 0,
                        },
                        headerTitleStyle: {
                            fontFamily: 'PlusJakartaSans_700Bold',
                            fontSize: 18,
                            color: 'white',
                        },
                        headerTintColor: 'white',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => navigationRef.current?.dispatch(DrawerActions.toggleDrawer())}
                                className="ml-4 p-2 bg-white/5 rounded-xl border border-white/10"
                            >
                                <Menu color="white" size={20} />
                            </TouchableOpacity>
                        ),
                        drawerStyle: {
                            backgroundColor: '#0f172a',
                            width: 280,
                        },
                        drawerActiveTintColor: '#6366f1',
                        drawerInactiveTintColor: '#94a3b8',
                    }}
                >
                    <Drawer.Screen
                        name="Main"
                        options={({ route }) => ({
                            headerTitle: getHeaderTitle(route),
                        })}
                    >
                        {(props) => <MainTabs {...props} user={user} onLogout={handleLogout} />}
                    </Drawer.Screen>
                </Drawer.Navigator>
            )}
        </NavigationContainer>
    );
};
