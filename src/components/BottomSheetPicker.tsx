import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions, Platform } from 'react-native';
import { cn } from '../utils/cn';
import { Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export interface PickerOption {
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: string;
}

interface BottomSheetPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    options: PickerOption[];
    title?: string;
    selectedValue?: string;
}

export const BottomSheetPicker = ({
    visible, onClose, onSelect, options, title, selectedValue
}: BottomSheetPickerProps) => {
    const { isDark } = useTheme();

    const sheetContent = (
        <View style={[
            isWeb ? styles.webSheet : styles.sheet,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
        ]}>
            {!isWeb && (
                <View className="items-center py-2 mb-2">
                    <View className="w-12 h-1 bg-divider dark:bg-divider-dark rounded-full" />
                </View>
            )}

            {title && (
                <Text className="text-primary dark:text-primary-dark font-sans-bold text-lg mb-4 text-center">{title}</Text>
            )}

            <View className="gap-1">
                {options.map(option => (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => { onSelect(option.value); onClose(); }}
                        className={cn(
                            'flex-row items-center p-4 rounded-2xl',
                            selectedValue === option.value ? 'bg-accent/10' : 'bg-transparent'
                        )}
                    >
                        <View
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: option.color || (isDark ? '#818CF8' : '#4F46E5') }}
                        />
                        <Text className={cn(
                            'flex-1 font-sans-semibold text-base',
                            selectedValue === option.value ? 'text-accent dark:text-accent-dark' : 'text-primary dark:text-primary-dark'
                        )}>{option.label}</Text>

                        {selectedValue === option.value && (
                            <Check size={18} color={isDark ? '#818CF8' : '#4F46E5'} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity onPress={onClose} className="mt-4 p-4 items-center bg-surface dark:bg-surface-dark rounded-2xl">
                <Text className="text-secondary dark:text-secondary-dark font-sans-semibold">Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    if (isWeb) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.webOverlay}>
                        <TouchableWithoutFeedback>
                            {sheetContent}
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        {sheetContent}
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    webOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    sheet: {
        maxHeight: height * 0.7,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    webSheet: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        paddingBottom: 24,
    },
});
