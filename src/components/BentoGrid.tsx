import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
                "flex flex-row flex-wrap gap-4 px-4",
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
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'full';
}

export const BentoItem = ({ children, className, size = 'md', ...props }: BentoItemProps) => {
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
            {children}
        </View>
    );
};
