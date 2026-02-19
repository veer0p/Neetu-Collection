import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useBiometrics } from '../hooks/useBiometrics';
import { LockScreen } from '../screens/LockScreen';
import Login from '../screens/Login';
import { supabaseService } from '../store/supabaseService';
import { MainTabs } from './MainTabs';
import { useTheme } from '../context/ThemeContext';

import Dashboard from '../screens/Dashboard';
import AddEntry from '../screens/AddEntry';
import Transactions from '../screens/Transactions';
import Ledger from '../screens/Ledger';
import AccountDetail from '../screens/AccountDetail';
import OrderDetail from '../screens/OrderDetail';
import Directory from '../screens/Directory';
import Reports from '../screens/Reports';

const Stack = createNativeStackNavigator();

const LightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#1A1A2E',
        border: '#F0F0F5',
        primary: '#4F46E5',
    },
};

const DarkTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        border: '#334155',
        primary: '#6366F1',
    },
};

export const AppNavigation = () => {
    const { isDark } = useTheme();
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasUnlocked, setHasUnlocked] = useState(false);
    const { isEnabled, checkStatus, loading: biometricsLoading } = useBiometrics();

    useEffect(() => {
        const init = async () => {
            await checkSession();
            await checkStatus();
        };
        init();
    }, []);

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
        setHasUnlocked(false);
    };

    const isLocked = user && isEnabled && !hasUnlocked;

    if (loading || biometricsLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={isDark ? '#818CF8' : '#4F46E5'} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={isDark ? DarkTheme : LightTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                {!user ? (
                    <Stack.Screen name="Login">
                        {(props) => <Login {...props} onLoginSuccess={(userData) => setUser(userData)} />}
                    </Stack.Screen>
                ) : isLocked ? (
                    <Stack.Screen name="Lock">
                        {(props) => <LockScreen {...props} onUnlock={() => setHasUnlocked(true)} />}
                    </Stack.Screen>
                ) : (
                    <>
                        <Stack.Screen name="Main">
                            {(props) => <MainTabs {...props} user={user} onLogout={handleLogout} />}
                        </Stack.Screen>
                        <Stack.Screen name="AccountDetail" component={AccountDetail} />
                        <Stack.Screen name="OrderDetail" component={OrderDetail} />
                        <Stack.Screen name="Directory" component={Directory} />
                        <Stack.Screen name="Insights" component={Reports} />
                        <Stack.Screen name="AddEntry" component={AddEntry} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
