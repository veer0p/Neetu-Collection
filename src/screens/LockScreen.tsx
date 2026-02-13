import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Background } from '../components/Background';
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react-native';
import { useBiometrics } from '../hooks/useBiometrics';
import { MotiView } from 'moti';

interface LockScreenProps {
    onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
    const { authenticate } = useBiometrics();
    const [error, setError] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleAuthentication();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleAuthentication = async () => {
        const success = await authenticate();
        if (success) {
            onUnlock();
        } else {
            setError(true);
        }
    };

    return (
        <Background>
            <View className="flex-1 items-center justify-center px-8">
                <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', duration: 1000 }}
                    className="items-center"
                >
                    <View className="w-24 h-24 bg-indigo-500/20 rounded-full items-center justify-center border border-indigo-500/30 mb-8">
                        <Lock color="#818cf8" size={40} />
                    </View>

                    <Text className="text-white font-sans-bold text-3xl text-center mb-2">
                        App Locked
                    </Text>
                    <Text className="text-gray-400 font-sans text-center mb-12">
                        Please authenticate to access your collection records securely.
                    </Text>

                    <TouchableOpacity
                        onPress={handleAuthentication}
                        className="bg-indigo-600 px-8 py-4 rounded-2xl flex-row items-center gap-3 active:bg-indigo-700 shadow-lg shadow-indigo-500/50"
                    >
                        <Fingerprint color="white" size={24} />
                        <Text className="text-white font-sans-bold text-lg">Use Biometrics</Text>
                    </TouchableOpacity>

                    {error && (
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            className="mt-6"
                        >
                            <Text className="text-red-400 font-sans-medium">Authentication failed. Try again.</Text>
                        </MotiView>
                    )}
                </MotiView>

                <View className="absolute bottom-12 flex-row items-center gap-2 opacity-40">
                    <ShieldCheck color="#94a3b8" size={16} />
                    <Text className="text-gray-400 font-sans text-xs uppercase tracking-widest">
                        End-to-end encrypted
                    </Text>
                </View>
            </View>
        </Background>
    );
};
