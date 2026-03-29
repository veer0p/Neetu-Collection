import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View, ActivityIndicator } from 'react-native';
import { cn } from '../utils/cn';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    className?: string;
    textClassName?: string;
    loading?: boolean;
    children: React.ReactNode;
}

export const Button = ({
    children,
    variant = 'primary',
    className,
    textClassName,
    loading,
    ...props
}: ButtonProps) => {

    const renderChildren = (childContent: React.ReactNode, defaultClassName: string) => {
        if (typeof childContent === 'string') {
            return <Text className={cn(defaultClassName, textClassName)}>{childContent}</Text>;
        }
        if (Array.isArray(childContent)) {
            return childContent.map((child, index) => {
                if (typeof child === 'string') {
                    return <Text key={index} className={cn(defaultClassName, textClassName)}>{child}</Text>;
                }
                return child;
            });
        }
        if (React.isValidElement(childContent)) return childContent;
        return <Text className={cn(defaultClassName, textClassName)}>{childContent}</Text>;
    };

    const variantClasses = {
        primary: "bg-accent dark:bg-accent border-accent",
        secondary: "bg-white dark:bg-surface-dark border-divider dark:border-divider-dark",
        ghost: "bg-transparent border-transparent",
        danger: "bg-danger border-danger",
    };

    const textClasses = {
        primary: "text-white font-sans-bold text-base", // Added text-base
        secondary: "text-primary dark:text-primary-dark font-sans-semibold text-base", // Added text-base
        ghost: "text-secondary dark:text-secondary-dark font-sans-medium text-base", // Added text-base
        danger: "text-white font-sans-bold text-base", // Added text-base
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={loading || props.disabled}
            className={cn(
                "rounded-2xl px-8 h-14 flex-row items-center justify-center border transition-all active:scale-95",
                variantClasses[variant as keyof typeof variantClasses],
                (loading || props.disabled) && "opacity-50",
                className
            )}
            {...props}
        >
            {loading ? (
                <View className="flex-row items-center">
                    <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'ghost' ? '#4F46E5' : 'white'} />
                    <Text className={cn("ml-2", textClasses[variant as keyof typeof textClasses])}>Processing...</Text>
                </View>
            ) : (
                renderChildren(children, textClasses[variant as keyof typeof textClasses])
            )}
        </TouchableOpacity>
    );
};
