import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface CardProps extends ViewProps {
    className?: string;
    children: React.ReactNode;
}

export const Card = ({ children, className = '', style, ...props }: CardProps) => {
    // Destructure and ignore any shadow props that might bleed through from NativeWind
    const {
        shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation,
        ...otherProps
    } = props as any;

    return (
        <View
            className={cn('bg-surface dark:bg-surface-dark border border-divider/50 dark:border-divider-dark/20 rounded-[32px] p-5', className)}
            style={[{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }, style]}
            {...otherProps}
        >
            {children}
        </View>
    );
};
