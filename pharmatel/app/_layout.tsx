import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/notificationTasks";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DoseAlertModal } from "@/components/DoseAlertModal";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="dose/[id]"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Dose Detail",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="medicine/[id]"
        options={{
          headerShown: true,
          title: "Medication Detail",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="observation/[doseId]"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Symptom Diary",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="pharmacies/[medicineId]"
        options={{
          headerShown: true,
          title: "Find Pharmacies",
          headerBackTitle: "Search",
        }}
      />
      <Stack.Screen
        name="diary/new"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "New Diary Entry",
          headerBackTitle: "Diary",
        }}
      />
      <Stack.Screen
        name="prescription/new"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Add Prescription",
          headerBackTitle: "Schedule",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
                <DoseAlertModal />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
