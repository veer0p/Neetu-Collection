import React from 'react';
import { View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps extends ViewProps {
    className?: string;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    children: React.ReactNode;
}

export const GlassCard = ({
    children,
    className,
    intensity = 40,
    tint = 'dark',
    ...props
}: GlassCardProps) => {
    return (
        <View
            className={cn(
                "overflow-hidden rounded-3xl border border-white/20 bg-slate-900/60",
                className
            )}
            {...props}
        >
            <BlurView
                intensity={intensity}
                tint={tint}
                className="flex-1 p-4"
            >
                {children}
            </BlurView>
        </View>
    );
};
