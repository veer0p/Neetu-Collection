import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useBiometrics } from '../hooks/useBiometrics';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, Contact2, Fingerprint, LogOut, ChevronRight, Info, Moon, Sun } from 'lucide-react-native';
import { cn } from '../utils/cn';

export default function More({ user, onLogout, navigation }: { user?: any; onLogout?: () => void; navigation: any }) {
    const { isEnabled, toggleBiometrics } = useBiometrics();
    const { theme, toggleTheme, isDark } = useTheme();

    const menuItems = [
        {
            icon: <BarChart3 size={20} color={isDark ? '#818CF8' : '#4F46E5'} />,
            label: 'Business Insights',
            subtitle: 'Analytics & trends',
            onPress: () => (navigation as any).navigate('Insights'),
        },
        {
            icon: <Contact2 size={20} color={isDark ? '#818CF8' : '#4F46E5'} />,
            label: 'Directory',
            subtitle: 'Customers, vendors, products',
            onPress: () => (navigation as any).navigate('Directory'),
        },
    ];

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-1">More</Text>
                    <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">{user?.name || 'Admin'}</Text>
                </View>

                <View className="px-6 mt-6">
                    {/* Menu Items */}
                    <Card className="px-0 py-0 mb-6">
                        {menuItems.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={item.onPress}
                                className={cn("flex-row items-center px-4 py-4", i < menuItems.length - 1 && "border-b border-divider dark:border-divider-dark")}
                            >
                                <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                    {item.icon}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">{item.label}</Text>
                                    <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-0.5">{item.subtitle}</Text>
                                </View>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </Card>

                    {/* Settings */}
                    <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider mb-3">Settings</Text>
                    <Card className="px-4 py-0 mb-6">
                        <View className="flex-row items-center justify-between py-4 border-b border-divider dark:border-divider-dark">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                    {isDark ? <Moon size={20} color="#818CF8" /> : <Sun size={20} color="#4F46E5" />}
                                </View>
                                <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={() => { toggleTheme(); }}
                                trackColor={{ false: '#E5E7EB', true: isDark ? '#818CF8' : '#4F46E5' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                        <View className="flex-row items-center justify-between py-4 border-b border-divider dark:border-divider-dark">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                    <Fingerprint size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                                </View>
                                <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">Biometric Lock</Text>
                            </View>
                            <Switch
                                value={isEnabled}
                                onValueChange={(val) => { toggleBiometrics(val); }}
                                trackColor={{ false: '#E5E7EB', true: isDark ? '#818CF8' : '#4F46E5' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                        <View className="flex-row items-center justify-between py-4">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-surface dark:bg-background-dark rounded-xl items-center justify-center mr-4">
                                    <Info size={20} color="#9CA3AF" />
                                </View>
                                <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">Version</Text>
                            </View>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">1.0.0</Text>
                        </View>
                    </Card>

                    {/* Sign Out */}
                    <TouchableOpacity
                        onPress={onLogout}
                        className="flex-row items-center justify-center py-4"
                    >
                        <LogOut size={18} color="#EF4444" />
                        <Text className="text-danger font-sans-semibold text-base ml-2">Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Background>
    );
}
