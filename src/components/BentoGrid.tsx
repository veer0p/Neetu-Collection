import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GlassCard } from './GlassCard';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BentoGridProps extends ViewProps {
    className?: string;
    children: React.ReactNode;
}

export const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
    return (
        <View
            className={cn(
                "flex-row flex-wrap gap-4",
                className
            )}
            {...props}
        >
            {children}
        </View>
    );
};

interface BentoItemProps extends ViewProps {
    className?: string;
    title?: string;
    value?: string;
    icon?: React.ReactNode;
    description?: string;
    trend?: string;
    size?: 'sm' | 'md' | 'lg' | 'full';
    children?: React.ReactNode;
}

export const BentoItem = ({
    children,
    className,
    title,
    value,
    icon,
    description,
    trend,
    size = 'md',
    ...props
}: BentoItemProps) => {
    const sizeClasses = {
        sm: "flex-[1_0_40%]",
        md: "flex-[1_0_45%]",
        lg: "flex-[1_0_60%]",
        full: "w-full",
    };

    return (
        <View
            className={cn(
                sizeClasses[size],
                className
            )}
            {...props}
        >
            <GlassCard className="bg-white/5 border-white/5 p-4 h-full">
                {icon && <View className="mb-3">{icon}</View>}
                {title && <Text className="text-gray-500 font-sans-bold text-[10px] uppercase tracking-wider mb-1">{title}</Text>}
                {value && (
                    <View className="flex-row items-baseline">
                        <Text className="text-white font-sans-bold text-xl">{value}</Text>
                        {trend && <Text className="text-emerald-400 font-sans-bold text-[10px] ml-2">{trend}</Text>}
                    </View>
                )}
                {description && <Text className="text-gray-500 font-sans text-[10px] mt-1">{description}</Text>}
                {children}
            </GlassCard>
        </View>
    );
};
