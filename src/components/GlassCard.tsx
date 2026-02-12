import React from 'react';
import { View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { cn } from '../utils/cn';

interface GlassCardProps extends ViewProps {
    className?: string;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    blur?: boolean;
    children: React.ReactNode;
}

export const GlassCard = ({
    children,
    className,
    intensity = 40,
    tint = 'dark',
    blur = true,
    ...props
}: GlassCardProps) => {
    const cardContent = (
        <View className="p-4">
            {children}
        </View>
    );

    return (
        <View
            className={cn(
                "overflow-hidden rounded-3xl border border-white/20",
                blur ? "bg-slate-900/60" : "bg-slate-900/90",
                className
            )}
            {...props}
        >
            {blur ? (
                <BlurView
                    intensity={intensity}
                    tint={tint}
                >
                    {cardContent}
                </BlurView>
            ) : (
                cardContent
            )}
        </View>
    );
};
