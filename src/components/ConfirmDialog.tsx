import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning' | 'success';
    loading?: boolean;
}

export const ConfirmDialog = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    loading = false
}: ConfirmDialogProps) => {
    const { isDark } = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle color="#EF4444" size={32} />;
            case 'warning': return <AlertTriangle color="#F59E0B" size={32} />;
            case 'success': return <CheckCircle2 color="#10B981" size={32} />;
            default: return <HelpCircle color="#4F46E5" size={32} />;
        }
    };

    const isDanger = type === 'danger';
    const isSuccess = type === 'success';

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] p-6 items-center shadow-xl">
                    <View className={cn(
                        "p-4 rounded-full mb-4",
                        isDanger ? 'bg-danger/10' : isSuccess ? 'bg-success/10' : 'bg-accent/10'
                    )}>
                        {getIcon()}
                    </View>

                    <Text className="text-primary dark:text-primary-dark font-sans-bold text-xl text-center">{title}</Text>
                    <Text className="text-secondary dark:text-secondary-dark font-sans text-sm text-center mt-2 leading-5">
                        {message}
                    </Text>

                    <View className="flex-row gap-3 mt-8 w-full">
                        {cancelText !== "" && (
                            <TouchableOpacity
                                onPress={onCancel}
                                disabled={loading}
                                className="flex-1 h-14 bg-surface dark:bg-background-dark border border-divider dark:border-divider-dark rounded-2xl items-center justify-center"
                            >
                                <Text className="text-secondary dark:text-secondary-dark font-sans-semibold text-base">{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={loading}
                            className={cn(
                                "flex-1 h-14 rounded-2xl items-center justify-center",
                                isDanger ? 'bg-danger' : isSuccess ? 'bg-success' : 'bg-accent'
                            )}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-white font-sans-bold text-base">{confirmText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
