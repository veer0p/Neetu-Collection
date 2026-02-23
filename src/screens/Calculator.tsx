import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X, Minus, Plus, Equal, Delete,
    Divide, Percent, Delete as Backspace
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { useResponsive } from '../hooks/useResponsive';

const BUTTON_GAP = 12;

type ButtonType = 'num' | 'op' | 'special' | 'equal';

const CalcButton = ({
    label,
    icon: Icon,
    type = 'num',
    onPress,
    isDark,
    size,
}: {
    label?: string,
    icon?: any,
    type?: ButtonType,
    onPress: () => void,
    isDark: boolean,
    size: number,
}) => {

    const getBgColor = () => {
        if (type === 'equal') return isDark ? '#818CF8' : '#4F46E5';
        if (type === 'op') return isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(79, 70, 229, 0.08)';
        if (type === 'special') return isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.08)';
        return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    };

    const getTextColor = () => {
        if (type === 'equal') return '#FFFFFF';
        if (type === 'op') return isDark ? '#A5B4FC' : '#4F46E5';
        if (type === 'special') return isDark ? '#FCA5A5' : '#EF4444';
        return isDark ? '#E2E8F0' : '#1E293B';
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                width: size,
                height: size,
                borderRadius: size / 2.5,
                backgroundColor: getBgColor(),
                justifyContent: 'center',
                alignItems: 'center',
            }}
            className="shadow-sm"
        >
            {Icon ? (
                <Icon size={24} color={getTextColor()} strokeWidth={2.5} />
            ) : (
                <Text
                    className="font-sans-bold text-xl"
                    style={{ color: getTextColor() }}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
};

export default function Calculator() {
    const { isDark } = useTheme();
    const { isWeb, CONTENT_MAX_WIDTH, windowWidth } = useResponsive();
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');

    // Compute button size dynamically based on available content width
    const PADDING = 24;
    const effectiveWidth = isWeb ? Math.min(windowWidth, CONTENT_MAX_WIDTH) : windowWidth;
    const BUTTON_SIZE = (effectiveWidth - (PADDING * 2) - (BUTTON_GAP * 3)) / 4;

    const handlePress = (val: string) => {
        setExpression(prev => prev + val);
    };

    const clear = () => {
        setExpression('');
        setResult('');
    };

    const deleteLast = () => {
        setExpression(prev => prev.slice(0, -1));
    };

    const calculate = () => {
        try {
            const sanitized = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/%/g, '/100');
            const evalResult = eval(sanitized);
            setResult(evalResult.toString());
        } catch (e) {
            setResult('Error');
        }
    };

    const btn = (props: Omit<Parameters<typeof CalcButton>[0], 'isDark' | 'size'>) => (
        <CalcButton {...props} isDark={isDark} size={BUTTON_SIZE} />
    );

    return (
        <View className="flex-1 bg-surface dark:bg-surface-dark items-center">
            <View style={[{ flex: 1, width: '100%' }, isWeb ? { maxWidth: CONTENT_MAX_WIDTH } : {}]}>
                <SafeAreaView className="flex-1" edges={['top']}>
                    {/* Display Area */}
                    <View className="flex-1 justify-end px-8 pb-8">
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            className="items-end"
                        >
                            <Text
                                className="text-secondary dark:text-secondary-dark font-sans-medium text-2xl mb-2"
                                numberOfLines={2}
                            >
                                {expression || '0'}
                            </Text>
                            <Text
                                className="text-primary dark:text-primary-dark font-sans-bold text-5xl"
                                numberOfLines={1}
                            >
                                {result || ' '}
                            </Text>
                        </MotiView>
                    </View>

                    {/* Keypad */}
                    <View
                        className="bg-white dark:bg-slate-900 rounded-t-[40px] px-6 pt-10 pb-12 shadow-2xl border-t border-black/5 dark:border-white/5"
                        style={{ gap: BUTTON_GAP, paddingBottom: isWeb ? 48 : 128 }}
                    >
                        <View className="flex-row justify-between">
                            {btn({ label: 'C', type: 'special', onPress: clear })}
                            {btn({ icon: Backspace, type: 'op', onPress: deleteLast })}
                            {btn({ label: '%', type: 'op', onPress: () => handlePress('%') })}
                            {btn({ icon: Divide, type: 'op', onPress: () => handlePress('÷') })}
                        </View>
                        <View className="flex-row justify-between">
                            {btn({ label: '7', onPress: () => handlePress('7') })}
                            {btn({ label: '8', onPress: () => handlePress('8') })}
                            {btn({ label: '9', onPress: () => handlePress('9') })}
                            {btn({ icon: X, type: 'op', onPress: () => handlePress('×') })}
                        </View>
                        <View className="flex-row justify-between">
                            {btn({ label: '4', onPress: () => handlePress('4') })}
                            {btn({ label: '5', onPress: () => handlePress('5') })}
                            {btn({ label: '6', onPress: () => handlePress('6') })}
                            {btn({ icon: Minus, type: 'op', onPress: () => handlePress('-') })}
                        </View>
                        <View className="flex-row justify-between">
                            {btn({ label: '1', onPress: () => handlePress('1') })}
                            {btn({ label: '2', onPress: () => handlePress('2') })}
                            {btn({ label: '3', onPress: () => handlePress('3') })}
                            {btn({ icon: Plus, type: 'op', onPress: () => handlePress('+') })}
                        </View>
                        <View className="flex-row justify-between">
                            {btn({ label: '(', onPress: () => handlePress('(') })}
                            {btn({ label: '0', onPress: () => handlePress('0') })}
                            {btn({ label: ')', onPress: () => handlePress(')') })}
                            {btn({ icon: Equal, type: 'equal', onPress: calculate })}
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}
