import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabaseService } from '../store/supabaseService';
import { Phone, KeyRound, User, ArrowRight } from 'lucide-react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface LoginProps {
    onLoginSuccess: (userData: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async () => {
        if (!phone || !pin || (isSignUp && !name)) { setError('Please fill in all fields.'); return; }
        if (phone.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
        if (pin.length < 4) { setError('PIN must be at least 4 digits.'); return; }

        setLoading(true);
        try {
            if (isSignUp) {
                await supabaseService.signUp(phone, pin, name);
                setError('Account created! You can now sign in.');
                setIsSignUp(false);
            } else {
                const userData = await supabaseService.signIn(phone, pin);
                onLoginSuccess(userData);
            }
        } catch (e: any) {
            setError(e.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Background>
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="mb-8 items-center">
                            <View className="w-16 h-16 bg-accent rounded-2xl items-center justify-center mb-4">
                                <Text className="text-white font-sans-bold text-2xl">N</Text>
                            </View>
                            <Text className="text-primary dark:text-primary-dark font-sans-bold text-2xl text-center">Neetu Collection</Text>
                            <Text className="text-secondary dark:text-secondary-dark font-sans text-sm text-center mt-1">
                                {isSignUp ? 'Create your business account' : 'Welcome back'}
                            </Text>
                        </View>

                        <View className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark p-6 rounded-3xl">
                            {isSignUp && (
                                <Input
                                    label="Full Name"
                                    placeholder="Enter your name"
                                    leftIcon={<User size={18} color="#9CA3AF" />}
                                    value={name}
                                    onChangeText={setName}
                                />
                            )}
                            <Input
                                label="Phone Number"
                                placeholder="8487xxxxxx"
                                keyboardType="phone-pad"
                                leftIcon={<Phone size={18} color="#9CA3AF" />}
                                value={phone}
                                onChangeText={setPhone}
                                maxLength={10}
                            />
                            <Input
                                label="4-Digit PIN"
                                placeholder="xxxx"
                                keyboardType="numeric"
                                secureTextEntry
                                leftIcon={<KeyRound size={18} color="#9CA3AF" />}
                                value={pin}
                                onChangeText={setPin}
                                maxLength={4}
                            />

                            <Button onPress={handleAuth} className="mt-4 rounded-full" disabled={loading}>
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-white font-sans-bold text-lg">
                                        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                                    </Text>
                                    {!loading && <ArrowRight color="white" size={18} />}
                                </View>
                            </Button>

                            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} className="mt-6 items-center">
                                <Text className="text-accent font-sans-semibold">
                                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <ConfirmDialog
                visible={!!error}
                title={error?.includes('Account created') ? "Success" : "Notification"}
                message={error || ''}
                confirmText="OK"
                cancelText=""
                onConfirm={() => setError(null)}
                onCancel={() => setError(null)}
                type={error?.includes('Account created') ? "success" : "danger"}
            />
        </Background>
    );
}
