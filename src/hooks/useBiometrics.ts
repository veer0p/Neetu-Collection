import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_LOCK_KEY = '@neetu_collection_biometric_lock';

export const useBiometrics = () => {
    const [isCompatible, setIsCompatible] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkStatus = useCallback(async () => {
        setLoading(true);
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            const enabledStr = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);

            setIsCompatible(compatible);
            setIsEnrolled(enrolled);
            setIsEnabled(enabledStr === 'true');
        } catch (error) {
            console.error('Biometric status check failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleBiometrics = async (value: boolean) => {
        try {
            if (value) {
                // Verify before enabling
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to enable biometric lock',
                    fallbackLabel: 'Enter Password',
                });

                if (result.success) {
                    await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, 'true');
                    setIsEnabled(true);
                    return true;
                }
                return false;
            } else {
                await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, 'false');
                setIsEnabled(false);
                return true;
            }
        } catch (error) {
            console.error('Toggle biometrics failed:', error);
            return false;
        }
    };

    const authenticate = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Neetu Collection',
                fallbackLabel: 'Enter Device PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });
            return result.success;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    };

    return {
        isCompatible,
        isEnrolled,
        isEnabled,
        loading,
        checkStatus,
        toggleBiometrics,
        authenticate
    };
};
