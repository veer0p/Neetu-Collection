import React from 'react';
import { View } from 'react-native';

export const Background = ({ children }: { children: React.ReactNode }) => {
    return (
        <View className="flex-1 bg-background dark:bg-background-dark">
            <View className="flex-1">
                {children}
            </View>
        </View>
    );
};
