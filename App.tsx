import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

import { queryClient } from "@/lib/queryClient";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { useAuthBootstrap } from "@/hooks/useAuth";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { RootNavigator } from "@/navigation/RootNavigator";

/**
 * App shell. Provider order matters:
 *   GestureHandler → SafeArea → Theme → ReactQuery → BottomSheet → Navigation
 * Auth + push bootstrap run as effects once everything is mounted.
 */
function AppInner() {
  const { scheme } = useTheme();
  useAuthBootstrap();
  usePushRegistration();

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <AppInner />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
