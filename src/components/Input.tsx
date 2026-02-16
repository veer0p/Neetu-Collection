import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
    label?: string;
    className?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
    label,
    className,
    error,
    leftIcon,
    ...props
}, ref) => {
    const { isDark } = useTheme();

    return (
        <View className={cn("mb-4", className)}>
            {label && <Text className="text-secondary dark:text-secondary-dark font-sans-medium text-sm mb-1.5 ml-1">{label}</Text>}
            <View
                className={cn(
                    "flex-row items-center bg-white dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl px-4 h-12",
                    error && "border-red-500",
                )}
            >
                {leftIcon && <View className="mr-3">{leftIcon}</View>}
                <TextInput
                    ref={ref}
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"} // slate-500 : slate-400
                    className="flex-1 text-primary dark:text-primary-dark font-sans text-base"
                    {...props}
                />
            </View>
            {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
        </View>
    );
});
