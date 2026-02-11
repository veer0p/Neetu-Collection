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
import { useEffect } from "react";
import { AppNavigation } from "./src/components/Navigation";
import { View, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    console.log("App booting...", { loaded, error });
    if (loaded || error) {
      console.log("Hiding splash...");
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [loaded, error]);

  // Don't wait for fonts to render, just to see if we move beyond splash
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigation />
        {!loaded && (
          <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: 'white' }}>Loading fonts...</Text>
          </View>
        )}
        <StatusBar style="light" translucent backgroundColor="transparent" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
