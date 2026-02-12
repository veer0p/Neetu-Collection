import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, PlusCircle, Wallet, History, Contact2, BarChart3 } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import AddEntry from '../screens/AddEntry';
import Transactions from '../screens/Transactions';
import Udhar from '../screens/Udhar';
import Reports from '../screens/Reports';
import Directory from '../screens/Directory';
import Accounts from '../screens/Accounts';
import AccountDetail from '../screens/AccountDetail';

const Tab = createBottomTabNavigator();

import { TouchableOpacity, Text as RNText } from 'react-native';

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    return (
        <View style={{
            position: 'absolute',
            bottom: 25,
            left: '10%',
            right: '10%',
            flexDirection: 'row',
            backgroundColor: '#1e293b',
            height: 65,
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
        }}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

                // Only show Home, Add, Accounts, Udhar, History (Orders)
                if (['Directory', 'Insights', 'AccountDetail'].includes(route.name)) return null;

                const isFocused = state.index === index;

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

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                const color = isFocused ? '#6366f1' : '#94a3b8';

                const isCenter = index === 2; // Center item (Add Sale)

                return (
                    <TouchableOpacity
                        key={index}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{
                            alignItems: 'center',
                            flex: 1,
                            justifyContent: isCenter ? 'flex-start' : 'center',
                            top: isCenter ? -20 : 0
                        }}
                    >
                        <View style={isCenter ? {
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: '#6366f1',
                            justifyContent: 'center',
                            alignItems: 'center',
                            elevation: 5,
                            shadowColor: '#6366f1',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                        } : {
                            alignItems: 'center'
                        }}>
                            {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color: isCenter ? 'white' : color, size: isCenter ? 28 : 24 }) : null}
                        </View>
                        {!isCenter && (
                            <RNText style={{
                                color,
                                fontSize: 10,
                                fontFamily: 'PlusJakartaSans_600SemiBold',
                                marginTop: 2
                            }}>
                                {label}
                            </RNText>
                        )}
                    </TouchableOpacity>
                );
            })}
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
        <Tab.Screen
            name="HomeTab"
            options={{
                tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
                tabBarLabel: 'Home'
            }}
        >
            {(props: any) => <Dashboard {...props} user={user} onLogout={onLogout} />}
        </Tab.Screen>
        <Tab.Screen
            name="History"
            component={Transactions}
            options={{
                tabBarIcon: ({ color }) => <History color={color} size={22} />,
                tabBarLabel: 'Orders',
            }}
        />
        <Tab.Screen
            name="Add"
            component={AddEntry}
            options={{
                tabBarIcon: ({ color }) => (
                    <View className="mb-0">
                        <PlusCircle color={color} size={30} />
                    </View>
                ),
                tabBarLabel: 'Add',
            }}
        />
        <Tab.Screen
            name="Udhar"
            component={Udhar}
            options={{
                tabBarIcon: ({ color }) => <Wallet color={color} size={22} />,
                tabBarLabel: 'Udhar'
            }}
        />
        <Tab.Screen
            name="Accounts"
            component={Accounts}
            options={{
                tabBarIcon: ({ color }) => <Contact2 color={color} size={22} />,
                tabBarLabel: 'Accounts'
            }}
        />
        <Tab.Screen
            name="AccountDetail"
            component={AccountDetail}
            options={{
                tabBarButton: () => null,
            }}
        />
        <Tab.Screen
            name="Directory"
            component={Directory}
            options={{
                tabBarButton: () => null,
            }}
        />
        <Tab.Screen
            name="Insights"
            component={Reports}
            options={{
                tabBarButton: () => null,
            }}
        />
    </Tab.Navigator>
);
