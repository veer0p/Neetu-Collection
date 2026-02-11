import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const Background = ({ children }: { children: React.ReactNode }) => {
    return (
        <View className="flex-1 bg-background">
            {/* Fixed Background Elements */}
            <View style={StyleSheet.absoluteFill}>
                {/* Fixed Glow 1 */}
                <View
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        width: 300,
                        height: 300,
                        borderRadius: 150,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    }}
                />
                {/* Fixed Glow 2 */}
                <View
                    style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '5%',
                        width: 400,
                        height: 400,
                        borderRadius: 200,
                        backgroundColor: 'rgba(168, 85, 247, 0.08)',
                    }}
                />
            </View>
            <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
                className="flex-1"
            >
                {children}
            </LinearGradient>
        </View>
    );
};
