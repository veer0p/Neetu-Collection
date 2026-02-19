import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X, Minus, Plus, Equal, Delete,
    Divide, Percent, Delete as Backspace
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_GAP = 12;
const PADDING = 24;
const BUTTON_SIZE = (SCREEN_WIDTH - (PADDING * 2) - (BUTTON_GAP * 3)) / 4;

type ButtonType = 'num' | 'op' | 'special' | 'equal';

const CalcButton = ({
    label,
    icon: Icon,
    type = 'num',
    onPress,
    isDark
}: {
    label?: string,
    icon?: any,
    type?: ButtonType,
    onPress: () => void,
    isDark: boolean
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
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                borderRadius: BUTTON_SIZE / 2.5,
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
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');

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
            // Basic sanitization and evaluation
            const sanitized = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/%/g, '/100');

            // Note: simple eval for now, can use mathjs for more precision
            const evalResult = eval(sanitized);
            setResult(evalResult.toString());
        } catch (e) {
            setResult('Error');
        }
    };

    return (
        <View className="flex-1 bg-surface dark:bg-surface-dark">
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
                    className="bg-white dark:bg-slate-900 rounded-t-[40px] px-6 pt-10 pb-32 shadow-2xl border-t border-black/5 dark:border-white/5"
                    style={{ gap: BUTTON_GAP }}
                >
                    <View className="flex-row justify-between">
                        <CalcButton label="C" type="special" onPress={clear} isDark={isDark} />
                        <CalcButton icon={Backspace} type="op" onPress={deleteLast} isDark={isDark} />
                        <CalcButton label="%" type="op" onPress={() => handlePress('%')} isDark={isDark} />
                        <CalcButton icon={Divide} type="op" onPress={() => handlePress('÷')} isDark={isDark} />
                    </View>
                    <View className="flex-row justify-between">
                        <CalcButton label="7" onPress={() => handlePress('7')} isDark={isDark} />
                        <CalcButton label="8" onPress={() => handlePress('8')} isDark={isDark} />
                        <CalcButton label="9" onPress={() => handlePress('9')} isDark={isDark} />
                        <CalcButton icon={X} type="op" onPress={() => handlePress('×')} isDark={isDark} />
                    </View>
                    <View className="flex-row justify-between">
                        <CalcButton label="4" onPress={() => handlePress('4')} isDark={isDark} />
                        <CalcButton label="5" onPress={() => handlePress('5')} isDark={isDark} />
                        <CalcButton label="6" onPress={() => handlePress('6')} isDark={isDark} />
                        <CalcButton icon={Minus} type="op" onPress={() => handlePress('-')} isDark={isDark} />
                    </View>
                    <View className="flex-row justify-between">
                        <CalcButton label="1" onPress={() => handlePress('1')} isDark={isDark} />
                        <CalcButton label="2" onPress={() => handlePress('2')} isDark={isDark} />
                        <CalcButton label="3" onPress={() => handlePress('3')} isDark={isDark} />
                        <CalcButton icon={Plus} type="op" onPress={() => handlePress('+')} isDark={isDark} />
                    </View>
                    <View className="flex-row justify-between">
                        <CalcButton label="(" onPress={() => handlePress('(')} isDark={isDark} />
                        <CalcButton label="0" onPress={() => handlePress('0')} isDark={isDark} />
                        <CalcButton label=")" onPress={() => handlePress(')')} isDark={isDark} />
                        <CalcButton icon={Equal} type="equal" onPress={calculate} isDark={isDark} />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
