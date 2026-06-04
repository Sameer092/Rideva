import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/utils/validation";
import { authService } from "@/services/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: ForgotPasswordValues) {
    setLoading(true);
    try {
      await authService.resetPassword(email);
      Alert.alert("Check your inbox", "We've sent a password reset link.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="px-5 pt-2">
        <ScreenHeader onBack={() => navigation.goBack()} />
      </View>
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 dark:bg-brand-700/25">
          <Text className="text-3xl">🔑</Text>
        </View>
        <View className="gap-2">
          <Text className="text-4xl font-black text-light-text dark:text-dark-text">Reset password</Text>
          <Text className="text-base text-light-textMuted dark:text-dark-textMuted">
            Enter your email and we'll send you a secure reset link.
          </Text>
        </View>
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <Input label="Email" leftIcon={<Text>✉️</Text>} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" value={value} onChangeText={onChange} error={errors.email?.message} />
        )} />
        <Button label="Send reset link" size="lg" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}
