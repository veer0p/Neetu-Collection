import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { LayoutDashboard, PlusCircle, History, Wallet, BarChart3, Contact2, LogOut } from 'lucide-react-native';
import { View, Platform, ActivityIndicator, Text } from 'react-native';

import Dashboard from '../screens/Dashboard';
import AddEntry from '../screens/AddEntry';
import Transactions from '../screens/Transactions';
import Udhar from '../screens/Udhar';
import Reports from '../screens/Reports';
import Directory from '../screens/Directory';
import Login from '../screens/Login';
import { supabase } from '../utils/supabase';
import { supabaseService } from '../store/supabaseService';

const Tab = createBottomTabNavigator();

const CustomTabBackground = () => (
    <View
        style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 88 : 68,
            backgroundColor: '#0f172a', // Opaque background
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
        }}
    />
);

export const AppNavigation = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
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

    const handleLoginSuccess = (userData: any) => {
        setUser(userData);
    };

    const handleLogout = async () => {
        await supabaseService.signOut();
        setUser(null);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <NavigationContainer theme={DarkTheme}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        elevation: 0,
                        height: Platform.OS === 'ios' ? 88 : 68,
                        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    },
                    tabBarBackground: () => <CustomTabBackground />,
                    tabBarActiveTintColor: '#6366f1',
                    tabBarInactiveTintColor: '#94a3b8',
                    tabBarLabelStyle: {
                        fontFamily: 'PlusJakartaSans_500Medium',
                        fontSize: 10,
                    },
                }}
            >
                <Tab.Screen
                    name="Home"
                    options={{
                        tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
                    }}
                >
                    {(props: any) => <Dashboard {...props} user={user} onLogout={handleLogout} />}
                </Tab.Screen>
                <Tab.Screen
                    name="History"
                    component={Transactions}
                    options={{
                        tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="Add"
                    component={AddEntry}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <View className="items-center justify-center pt-2">
                                <PlusCircle color={color} size={size + 2} />
                                <Text className="text-[10px] mt-1 font-sans-medium" style={{ color }}>Add sale</Text>
                            </View>
                        ),
                        tabBarLabel: () => null,
                    }}
                />
                <Tab.Screen
                    name="Udhar"
                    component={Udhar}
                    options={{
                        tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
                        tabBarBadge: undefined,
                    }}
                />
                <Tab.Screen
                    name="Directory"
                    component={Directory}
                    options={{
                        tabBarIcon: ({ color, size }) => <Contact2 color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="Insights"
                    component={Reports}
                    options={{
                        tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};
