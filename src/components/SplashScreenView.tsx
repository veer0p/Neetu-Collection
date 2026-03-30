import React, { useEffect, useRef } from 'react';
import {
    View,
    Image,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    useColorScheme,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenViewProps {
    onFinish: () => void;
}

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({ onFinish }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Animation values
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const glowScale = useRef(new Animated.Value(0.8)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const footerOpacity = useRef(new Animated.Value(0)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Glow pulse loop
        const glowPulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(glowScale, {
                        toValue: 1.15,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowOpacity, {
                        toValue: 0.35,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(glowScale, {
                        toValue: 0.9,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowOpacity, {
                        toValue: 0.12,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        // Entry animation sequence
        Animated.sequence([
            // 1. Logo fades + scales in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Footer fades in slightly after
            Animated.timing(footerOpacity, {
                toValue: 1,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
            }),
            // 3. Hold for a beat
            Animated.delay(1400),
            // 4. Fade out whole screen
            Animated.timing(screenOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            glowPulse.stop();
            onFinish();
        });

        // Start glow immediately
        glowPulse.start();

        return () => {
            glowPulse.stop();
        };
    }, []);

    const colors = {
        bg: isDark ? '#0F0F14' : '#FFFFFF',
        logoGlow: isDark ? '#7C3AED' : '#A78BFA',
        footerText: isDark ? '#94A3B8' : '#64748B',
        footerBrand: isDark ? '#C4B5FD' : '#7C3AED',
        heartColor: isDark ? '#F43F5E' : '#E11D48',
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor: colors.bg, opacity: screenOpacity }]}>
            {/* Center content */}
            <View style={styles.centerContent}>
                {/* Glow ring behind logo */}
                <Animated.View
                    style={[
                        styles.glowRing,
                        {
                            backgroundColor: colors.logoGlow,
                            transform: [{ scale: glowScale }],
                            opacity: glowOpacity,
                        },
                    ]}
                />

                {/* Logo */}
                <Animated.View
                    style={[
                        styles.logoWrapper,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
                <Text style={[styles.footerText, { color: colors.footerText }]}>
                    Made with{' '}
                    <Text style={{ color: colors.heartColor }}>💖</Text>
                    <Text>by </Text>
                    <Text style={[styles.brandName, { color: colors.footerBrand }]}>
                        Viransi Technololabs
                    </Text>
                </Text>
            </Animated.View>
        </Animated.View>
    );
};

const LOGO_SIZE = width * 0.52;
const GLOW_SIZE = LOGO_SIZE * 1.55;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        borderRadius: GLOW_SIZE / 2,
    },
    logoWrapper: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    footer: {
        paddingBottom: 44,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13.5,
        letterSpacing: 0.3,
    },
    brandName: {
        fontWeight: '600',
    },
});
