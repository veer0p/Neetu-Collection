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
            className={cn('bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-2xl p-4', className)}
            {...props}
        >
            {children}
        </View>
    );
};
