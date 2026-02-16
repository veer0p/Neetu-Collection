import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { cn } from '../utils/cn';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    className?: string;
    textClassName?: string;
    children: React.ReactNode;
}

export const Button = ({
    children,
    variant = 'primary',
    className,
    textClassName,
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
            className={cn(
                "rounded-2xl px-6 flex-row items-center justify-center border transition-all active:scale-95",
                variantClasses[variant as keyof typeof variantClasses],
                className
            )}
            {...props}
        >
            {renderChildren(children, textClasses[variant as keyof typeof textClasses])}
        </TouchableOpacity>
    );
};
