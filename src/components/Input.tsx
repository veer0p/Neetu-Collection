import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends TextInputProps {
    label?: string;
    containerClassName?: string;
    className?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
    label,
    containerClassName,
    className,
    error,
    leftIcon,
    ...props
}, ref) => {
    return (
        <View className={cn("mb-4", containerClassName)}>
            {label && (
                <Text className="text-gray-400 font-sans-medium mb-2 ml-1 text-sm">
                    {label}
                </Text>
            )}
            <View
                className={cn(
                    "flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 h-14",
                    error && "border-red-500",
                    className
                )}
            >
                {leftIcon && <View className="mr-3">{leftIcon}</View>}
                <TextInput
                    ref={ref}
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-white font-sans text-base"
                    {...props}
                />
            </View>
            {error && (
                <Text className="text-red-500 font-sans text-xs mt-1 ml-1">
                    {error}
                </Text>
            )}
        </View>
    );
});
