import React from "react";
import { View, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

/** Landing screen: brand intro + entry points to auth flows and social login. */
export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-canvas-dark">
      <View className="flex-1 justify-between p-6">
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-6xl">🚕</Text>
          <Text className="text-4xl font-extrabold text-white">Rideva</Text>
          <Text className="text-center text-base text-dark-textMuted">
            Your ride, in minutes. Anywhere, anytime.
          </Text>
        </View>

        <View className="gap-3">
          <Button label="Continue with email" onPress={() => navigation.navigate("SignIn")} />
          <Button
            label="Continue with Google"
            variant="outline"
            onPress={() => authService.signInWithGoogle().catch(() => {})}
          />
          {Platform.OS === "ios" && (
            <Button
              label="Continue with Apple"
              variant="secondary"
              onPress={() => authService.signInWithApple().catch(() => {})}
            />
          )}
          <Button label="Create an account" variant="ghost" onPress={() => navigation.navigate("SignUp")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
