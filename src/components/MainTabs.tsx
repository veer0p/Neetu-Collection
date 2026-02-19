import React from 'react';
import { View, TouchableOpacity, Text as RNText } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ClipboardList, Plus, BookOpen, MoreHorizontal } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import AddEntry from '../screens/AddEntry';
import Transactions from '../screens/Transactions';
import Ledger from '../screens/Ledger';
import More from '../screens/More';
import AccountDetail from '../screens/AccountDetail';
import OrderDetail from '../screens/OrderDetail';
import Directory from '../screens/Directory';
import Reports from '../screens/Reports';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const { isDark } = useTheme();
    const visibleTabs = ['HomeTab', 'Orders', 'Add', 'Ledger', 'More'];

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            height: 70,
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: 8,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#334155' : '#F0F0F5',
            paddingBottom: 8,
        }}>
            {state.routes.map((route: any, index: number) => {
                if (!visibleTabs.includes(route.name)) return null;

                const { options } = descriptors[route.key];
                const label = options.tabBarLabel || route.name;
                const isFocused = state.index === index;
                const isCenter = route.name === 'Add';

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                if (isCenter) {
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            activeOpacity={0.8}
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 16,
                                backgroundColor: isDark ? '#818CF8' : '#4F46E5',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: -20,
                                elevation: 4,
                                shadowColor: '#4F46E5',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <Plus color="#FFFFFF" size={26} />
                        </TouchableOpacity>
                    );
                }

                const color = isFocused ? (isDark ? '#818CF8' : '#6366F1') : (isDark ? '#94A3B8' : '#9CA3AF');

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 8 }}
                    >
                        {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
                        <RNText style={{
                            color,
                            fontSize: 11,
                            fontFamily: isFocused ? 'PlusJakartaSans_600SemiBold' : 'PlusJakartaSans_400Regular',
                            marginTop: 4,
                        }}>
                            {label}
                        </RNText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export const MainTabs = ({ user, onLogout }: { user: any, onLogout: () => void }) => (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
    >
        <Tab.Screen
            name="HomeTab"
            options={{
                tabBarIcon: ({ color }) => <Home color={color} size={22} />,
                tabBarLabel: 'Home',
            }}
        >
            {(props: any) => <Dashboard {...props} user={user} onLogout={onLogout} />}
        </Tab.Screen>
        <Tab.Screen
            name="Orders"
            component={Transactions}
            options={{
                tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} />,
                tabBarLabel: 'Orders',
            }}
        />
        <Tab.Screen
            name="Add"
            component={AddEntry}
            options={{
                tabBarIcon: ({ color }) => <Plus color={color} size={26} />,
                tabBarLabel: 'Add',
            }}
        />
        <Tab.Screen
            name="Ledger"
            component={Ledger}
            options={{
                tabBarIcon: ({ color }) => <BookOpen color={color} size={22} />,
                tabBarLabel: 'Ledger',
            }}
        />
        <Tab.Screen
            name="More"
            options={{
                tabBarIcon: ({ color }) => <MoreHorizontal color={color} size={22} />,
                tabBarLabel: 'More',
            }}
        >
            {(props: any) => <More {...props} user={user} onLogout={onLogout} />}
        </Tab.Screen>

        {/* Hidden screens (no tab bar button) */}
        <Tab.Screen name="AccountDetail" component={AccountDetail} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="OrderDetail" component={OrderDetail} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="Directory" component={Directory} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="Insights" component={Reports} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="AddEntry" component={AddEntry} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
);
