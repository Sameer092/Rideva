import React from "react";
import { View, Text, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { GoogleLogo, AppleLogo } from "@/components/ui/BrandLogos";
import { authService } from "@/services/auth";
import { GRADIENTS, GRADIENT_DIRECTION } from "@/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

/** Landing screen — full-bleed gradient hero, brand mark, and entry points. */
export function WelcomeScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-canvas-dark">
      <LinearGradient colors={[...GRADIENTS.hero]} {...GRADIENT_DIRECTION.topToBottom} style={{ flex: 1 }}>
        {/* decorative glow */}
        <View className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-brand/30" />
        <View className="absolute top-32 -left-20 h-56 w-56 rounded-full bg-brand-700/30" />

        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-between p-7">
            <View className="flex-1 justify-center">
              <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand mb-7">
                <Text className="text-4xl">🚕</Text>
              </View>
              <Text className="text-6xl font-black tracking-tight text-white">Rideva</Text>
              <Text className="mt-3 text-xl leading-7 text-white/70">
                Premium rides, in minutes.{"\n"}Anywhere, anytime.
              </Text>
            </View>

            <View className="gap-3">
              <Button label="Continue with email" onPress={() => navigation.navigate("SignIn")} size="lg" />

              <View className="flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                  onPress={() => authService.signInWithGoogle().catch(() => {})}
                  className="h-[54px] flex-1 items-center justify-center rounded-full bg-white active:opacity-80"
                >
                  <GoogleLogo size={26} />
                </Pressable>
                {Platform.OS === "ios" && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Apple"
                    onPress={() => authService.signInWithApple().catch(() => {})}
                    className="h-[54px] flex-1 items-center justify-center rounded-full bg-white active:opacity-80"
                  >
                    <AppleLogo size={26} color="#000" />
                  </Pressable>
                )}
              </View>

              <Button label="Create an account" variant="ghost" onPress={() => navigation.navigate("SignUp")} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
