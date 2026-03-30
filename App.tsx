import 'react-native-url-polyfill/auto';
import "./global.css";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import { AppNavigation } from "./src/components/Navigation";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from "./src/context/ThemeContext";
import { SplashScreenView } from "./src/components/SplashScreenView";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  // Fonts or error indicates we are ready to proceed
  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  // EMERGENCY FIX: Force app ready after 3 seconds even if fonts hang
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Hide the native splash screen ONLY once our JS is running and fonts are handled
  useEffect(() => {
    if (appIsReady) {
      // Hide native splash after a tiny delay to ensure custom splash is rendered
      const timer = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn(e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [appIsReady]);

  // Safety net: Force show app after 10 seconds if anything hangs
  useEffect(() => {
    const backupTimer = setTimeout(() => {
      setShowCustomSplash(false);
    }, 10000);
    return () => clearTimeout(backupTimer);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigation />
          <StatusBar style="auto" translucent backgroundColor="transparent" />

          {/* Custom splash screen renders on top */}
          {showCustomSplash && (
            <SplashScreenView
              onFinish={() => setShowCustomSplash(false)}
            />
          )}
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
