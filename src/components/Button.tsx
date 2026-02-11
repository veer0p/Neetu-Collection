import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'glass';
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
    if (variant === 'primary') {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                className={cn("active:scale-95 transition-transform", className)}
                {...props}
            >
                <LinearGradient
                    colors={['#6366f1', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className={cn("rounded-2xl px-6 py-4 items-center justify-center shadow-lg shadow-indigo-500/20", className)}
                >
                    <Text className={cn("text-white font-sans-bold text-lg", textClassName)}>
                        {children}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantClasses = {
        secondary: "bg-white/20 border border-white/30",
        glass: "bg-white/15 border border-white/20 backdrop-blur-md",
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            className={cn(
                "rounded-2xl px-6 py-4 items-center justify-center border active:scale-95 transition-transform",
                variantClasses[variant as 'secondary' | 'glass'],
                className
            )}
            {...props}
        >
            <Text className={cn("text-white font-sans-medium text-lg", textClassName)}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};
