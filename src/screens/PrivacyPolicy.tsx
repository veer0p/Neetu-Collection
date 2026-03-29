import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, Lock, Eye, Server, RefreshCcw } from 'lucide-react-native';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

const PolicySection = ({ title, icon: Icon, content }: { title: string, icon: any, content: string }) => {
    const { isDark } = useTheme();
    return (
        <Card className="mb-6 p-6">
            <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-accent/10 rounded-xl items-center justify-center mr-3">
                    <Icon size={22} color={isDark ? '#818CF8' : '#4F46E5'} />
                </View>
                <Text className="text-primary dark:text-primary-dark font-sans-bold text-lg">{title}</Text>
            </View>
            <Text className="text-secondary dark:text-secondary-dark font-sans-medium text-sm leading-6">
                {content}
            </Text>
        </Card>
    );
};

export default function PrivacyPolicy({ navigation }: any) {
    const { isDark } = useTheme();

    return (
        <Background>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-4 pb-2 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-11 h-11 bg-surface dark:bg-surface-dark rounded-2xl items-center justify-center mr-4 border border-divider/50 dark:border-white/5"
                    >
                        <ChevronLeft color={isDark ? '#818CF8' : '#4F46E5'} size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl">Privacy Policy</Text>
                        <Text className="text-secondary dark:text-secondary-dark font-sans text-xs">Last updated: March 2026</Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1 px-6 mt-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 60 }}
                >
                    <PolicySection
                        title="Data Collection"
                        icon={Eye}
                        content="We collect order details, customer names, and transaction history solely to facilitate your business operations. This data is private to your account and is never shared with third parties."
                    />

                    <PolicySection
                        title="Cloud Security"
                        icon={ShieldCheck}
                        content="Your data is stored securely using Supabase (PostgreSQL). We apply rigorous Row-Level Security (RLS) policies to ensure that your business data remains accessible only by you."
                    />

                    <PolicySection
                        title="Biometric Safety"
                        icon={Lock}
                        content="If enabled, biometric data (fingerprint or face) is handled locally by your device's operating system. Neetu Collection never sees or stores your biometric credentials."
                    />

                    <PolicySection
                        title="Service Integrity"
                        icon={Server}
                        content="We use industry-standard encryption for data in transit and at rest. Your trust is our priority, and we continuously monitor for any unauthorized access attempts."
                    />

                    <PolicySection
                        title="Policy Updates"
                        icon={RefreshCcw}
                        content="As we add new features, our privacy policy may evolve. We will notify you of any significant changes via the app dashboard or email."
                    />

                    <View className="mb-10 items-center justify-center py-6 opacity-30">
                        <ShieldCheck size={48} color={isDark ? '#818CF8' : '#4F46E5'} />
                        <Text className="text-secondary dark:text-secondary-dark font-sans-bold text-sm mt-4 uppercase tracking-[4px]">Neetu Collection</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Background>
    );
}
