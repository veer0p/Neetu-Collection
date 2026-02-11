import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react-native';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning' | 'success';
}

export const ConfirmDialog = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
}: ConfirmDialogProps) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle color="#f87171" size={32} />;
            case 'warning': return <AlertTriangle color="#fbbf24" size={32} />;
            case 'success': return <CheckCircle2 color="#10b981" size={32} />;
            default: return <HelpCircle color="#6366f1" size={32} />;
        }
    };

    const isDanger = type === 'danger';
    const isSuccess = type === 'success';

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.cardWrapper}>
                        <BlurView intensity={80} tint="dark" style={styles.blurContent}>
                            <View style={styles.content}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.1)' : isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)' }
                                ]}>
                                    {getIcon()}
                                </View>

                                <Text style={styles.titleText}>{title}</Text>
                                <Text style={styles.messageText}>{message}</Text>

                                <View style={styles.buttonRow}>
                                    {cancelText !== "" && (
                                        <TouchableOpacity
                                            onPress={onCancel}
                                            style={styles.cancelButton}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        onPress={onConfirm}
                                        style={[
                                            styles.confirmButton,
                                            { backgroundColor: isDanger ? '#ef4444' : isSuccess ? '#10b981' : '#6366f1' }
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.confirmButtonText}>{confirmText}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </BlurView>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    cardWrapper: {
        overflow: 'hidden',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    blurContent: {
        padding: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        padding: 16,
        borderRadius: 99,
        marginBottom: 16,
    },
    titleText: {
        color: 'white',
        fontSize: 20,
        fontFamily: 'PlusJakartaSans_700Bold',
        textAlign: 'center',
    },
    messageText: {
        color: '#94a3b8',
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_400Regular',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 32,
        width: '100%',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#94a3b8',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    confirmButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
});
