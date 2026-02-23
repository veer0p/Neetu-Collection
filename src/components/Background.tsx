import React from 'react';
import { View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

export const Background = ({ children }: { children: React.ReactNode }) => {
    const { isWeb, containerStyle } = useResponsive();

    if (isWeb) {
        return (
            <View className="flex-1 bg-background dark:bg-background-dark items-center">
                <View style={[{ flex: 1, width: '100%' }, containerStyle]}>
                    {children}
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background dark:bg-background-dark">
            <View className="flex-1">
                {children}
            </View>
        </View>
    );
};
