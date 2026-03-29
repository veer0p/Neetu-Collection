import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface CardProps extends ViewProps {
    className?: string;
    children: React.ReactNode;
}

export const Card = ({ children, className = '', ...props }: CardProps) => {
    return (
        <View
            className={cn('bg-surface dark:bg-surface-dark border border-divider/50 dark:border-divider-dark/20 rounded-[32px] p-5 shadow-sm shadow-black/5 dark:shadow-none', className)}
            {...props}
        >
            {children}
        </View>
    );
};
