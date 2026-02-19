import React from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useBiometrics } from '../hooks/useBiometrics';
import { useTheme } from '../context/ThemeContext';
import { Fingerprint, LogOut, ChevronRight, Info, Moon, Sun, User as UserIcon, Bell, Shield, Database } from 'lucide-react-native';
import { cn } from '../utils/cn';

export default function Settings({ user, onLogout, navigation }: { user?: any; onLogout?: () => void; navigation: any }) {
    const { isEnabled, toggleBiometrics } = useBiometrics();
    const { theme, toggleTheme, isDark } = useTheme();

    const sections: { title: string; items: any[] }[] = [
        {
            title: 'Account',
            items: [
                { icon: <UserIcon size={20} color={isDark ? '#818CF8' : '#4F46E5'} />, label: 'Profile Information', subtitle: 'Manage your personal details', onPress: () => { } },
                { icon: <Bell size={20} color={isDark ? '#818CF8' : '#4F46E5'} />, label: 'Notifications', subtitle: 'Alerts & updates', onPress: () => { } },
            ]
        },
        {
            title: 'Security',
            items: [
                {
                    icon: <Fingerprint size={20} color={isDark ? '#818CF8' : '#4F46E5'} />,
                    label: 'Biometric Lock',
                    type: 'switch',
                    value: isEnabled,
                    onValueChange: (val: boolean) => { toggleBiometrics(val); }
                },
                { icon: <Shield size={20} color={isDark ? '#818CF8' : '#4F46E5'} />, label: 'Privacy Policy', onPress: () => { } },
            ]
        },
        {
            title: 'App Settings',
            items: [
                {
                    icon: isDark ? <Moon size={20} color="#818CF8" /> : <Sun size={20} color="#4F46E5" />,
                    label: 'Dark Mode',
                    type: 'switch',
                    value: isDark,
                    onValueChange: () => { toggleTheme(); }
                },
                { icon: <Database size={20} color={isDark ? '#818CF8' : '#4F46E5'} />, label: 'Backup & Restore', subtitle: 'Cloud sync', onPress: () => { } },
            ]
        }
    ];

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2">
                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl mb-1">Settings</Text>
                    <Text className="text-secondary dark:text-secondary-dark font-sans text-sm">App preferences & account</Text>
                </View>

                <ScrollView
                    className="flex-1 px-6 mt-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {sections.map((section, idx) => (
                        <View key={idx} className="mb-6">
                            <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider mb-3 ml-1">{section.title}</Text>
                            <Card className="px-0 py-0 overflow-hidden">
                                {section.items.map((item, i) => (
                                    <View key={i} className={cn(i < section.items.length - 1 && "border-b border-divider dark:border-divider-dark")}>
                                        {item.type === 'switch' ? (
                                            <View className="flex-row items-center justify-between px-4 py-4">
                                                <View className="flex-row items-center">
                                                    <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                                        {item.icon}
                                                    </View>
                                                    <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">{item.label}</Text>
                                                </View>
                                                <Switch
                                                    value={item.value}
                                                    onValueChange={item.onValueChange}
                                                    trackColor={{ false: '#E5E7EB', true: isDark ? '#818CF8' : '#4F46E5' }}
                                                    thumbColor="#FFFFFF"
                                                />
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={item.onPress}
                                                className="flex-row items-center px-4 py-4"
                                            >
                                                <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-4">
                                                    {item.icon}
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-primary dark:text-primary-dark font-sans-semibold text-base">{item.label}</Text>
                                                    {item.subtitle && <Text className="text-secondary dark:text-secondary-dark font-sans text-xs mt-0.5">{item.subtitle}</Text>}
                                                </View>
                                                <ChevronRight size={18} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </Card>
                        </View>
                    ))}

                    <Card className="px-4 py-0 mb-6">
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

                    <View className="mb-10">
                        <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-xs uppercase tracking-wider mb-3 ml-1">Danger Zone</Text>
                        <Card className="p-0 overflow-hidden border-red-500/20">
                            <TouchableOpacity
                                onPress={onLogout}
                                activeOpacity={0.8}
                                className="flex-row items-center px-4 py-4 bg-red-500/5 dark:bg-red-500/10"
                            >
                                <View className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mr-4">
                                    <LogOut size={20} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#EF4444] font-sans-bold text-base">Sign Out</Text>
                                    <Text className="text-red-500/60 font-sans text-xs mt-0.5">Securely log out of your account</Text>
                                </View>
                                <ChevronRight size={18} color="#EF4444" style={{ opacity: 0.5 }} />
                            </TouchableOpacity>
                        </Card>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
