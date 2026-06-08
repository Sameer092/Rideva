import React, { useState } from "react";
import { View, Text, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { signInSchema, type SignInValues } from "@/utils/validation";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { GRADIENTS, GRADIENT_DIRECTION } from "@/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setLoading(true);
    try {
      const data = await authService.signIn(values);
      // Populate the store deterministically so the navigator switches now,
      // rather than waiting on the background auth listener.
      if (data.session && data.user) {
        const { setSession, setProfile } = useAuthStore.getState();
        setSession(data.session);
        setProfile(await authService.fetchProfileWithRetry(data.user.id));
      }
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Please try again.";
      Alert.alert("Sign in failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Gradient header */}
          <LinearGradient
            colors={[...GRADIENTS.brand]}
            {...GRADIENT_DIRECTION.diagonal}
            style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}
          >
            <SafeAreaView edges={["top"]}>
              <View className="px-6 pb-9 pt-2">
                <Pressable
                  onPress={() => navigation.goBack()}
                  className="h-11 w-11 items-center justify-center rounded-full bg-white/20"
                >
                  <Text className="text-2xl text-white">‹</Text>
                </Pressable>
                <View className="mt-6 h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
                  <Text className="text-3xl">🚕</Text>
                </View>
                <Text className="mt-4 text-4xl font-black text-white">Welcome back 👋</Text>
                <Text className="mt-1 text-base text-white/80">Sign in to continue your journey</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View className="gap-5 px-6 pt-7">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  leftIcon={<Icon name="mail-outline" muted />}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  leftIcon={<Icon name="lock-closed-outline" muted />}
                  secureTextEntry
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />
            <Pressable className="self-end" onPress={() => navigation.navigate("ForgotPassword")}>
              <Text className="font-bold text-brand">Forgot password?</Text>
            </Pressable>

            <Button label="Sign in" size="lg" loading={loading} onPress={handleSubmit(onSubmit)} />

            <View className="flex-row justify-center gap-1 pb-6">
              <Text className="text-light-textMuted dark:text-dark-textMuted">No account?</Text>
              <Text className="font-bold text-brand" onPress={() => navigation.navigate("SignUp")}>
                Sign up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
