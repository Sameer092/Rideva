import React, { useState } from "react";
import { View, Text, Alert, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { signInSchema, type SignInValues } from "@/utils/validation";
import { authService } from "@/services/auth";

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
      await authService.signIn(values);
    } catch (e) {
      Alert.alert("Sign in failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="px-5 pt-2">
          <ScreenHeader onBack={() => navigation.goBack()} />
        </View>

        <View className="flex-1 justify-center gap-6 px-6">
          <View className="gap-2">
            <Text className="text-4xl font-black text-light-text dark:text-dark-text">Welcome back 👋</Text>
            <Text className="text-base text-light-textMuted dark:text-dark-textMuted">
              Sign in to continue your journey
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  leftIcon={<Text className="text-base">✉️</Text>}
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
                  leftIcon={<Text className="text-base">🔒</Text>}
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
          </View>

          <Button label="Sign in" size="lg" loading={loading} onPress={handleSubmit(onSubmit)} />

          <View className="flex-row justify-center gap-1">
            <Text className="text-light-textMuted dark:text-dark-textMuted">No account?</Text>
            <Text className="font-bold text-brand" onPress={() => navigation.navigate("SignUp")}>
              Sign up
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
