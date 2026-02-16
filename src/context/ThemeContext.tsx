import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@neetu_collection_theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
            setThemeState(storedTheme as Theme);
            setColorScheme(storedTheme as Theme);
        } else {
            // Default to light as per current design
            setThemeState('light');
            setColorScheme('light');
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        setColorScheme(newTheme);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
