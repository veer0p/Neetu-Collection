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
import { useEffect, useState } from "react";
import { AppNavigation } from "./src/components/Navigation";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from "./src/context/ThemeContext";
import { SplashScreenView } from "./src/components/SplashScreenView";

// Hide native splash screen immediately — our custom one takes over
SplashScreen.hideAsync().catch(() => { });

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
  const [splashDone, setSplashDone] = useState(false);

  // Fonts must load before we allow the splash to finish
  const appReady = fontsLoaded || !!fontError;

  const handleSplashFinish = () => {
    if (appReady) {
      setSplashDone(true);
    } else {
      // If fonts aren't ready yet, wait for them
      const check = setInterval(() => {
        // appReady will be updated via closure on next render,
        // so we just hide once fonts are done
      }, 100);
      setTimeout(() => clearInterval(check), 10000);
    }
  };

  useEffect(() => {
    if (appReady && !showCustomSplash) {
      setSplashDone(true);
    }
  }, [appReady]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigation />
          <StatusBar style="auto" translucent backgroundColor="transparent" />

          {/* Custom splash screen renders on top */}
          {showCustomSplash && (
            <SplashScreenView
              onFinish={() => {
                setShowCustomSplash(false);
                setSplashDone(true);
              }}
            />
          )}
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
