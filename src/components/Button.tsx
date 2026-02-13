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

    const renderChildren = (childContent: React.ReactNode, defaultClassName: string) => {
        if (typeof childContent === 'string') {
            return (
                <Text className={cn(defaultClassName, textClassName)}>
                    {childContent}
                </Text>
            );
        }

        if (Array.isArray(childContent)) {
            return childContent.map((child, index) => {
                if (typeof child === 'string') {
                    return (
                        <Text key={index} className={cn(defaultClassName, textClassName)}>
                            {child}
                        </Text>
                    );
                }
                return child;
            });
        }

        if (React.isValidElement(childContent)) {
            return childContent;
        }

        return (
            <Text className={cn(defaultClassName, textClassName)}>
                {childContent}
            </Text>
        );
    };

    // Primary with Gradient
    if (variant === 'primary') {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                className={cn("h-14 active:scale-95 transition-transform overflow-hidden", className)}
                {...props}
            >
                <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        borderRadius: 16,
                        width: '100%',
                        height: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {renderChildren(children, "text-white font-sans-bold text-lg")}
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
                "rounded-2xl h-14 px-6 flex-row items-center justify-center border active:scale-95 transition-transform",
                variantClasses[variant as 'secondary' | 'glass'],
                className
            )}
            {...props}
        >
            {renderChildren(children, "text-white font-sans-medium text-lg")}
        </TouchableOpacity>
    );
};
