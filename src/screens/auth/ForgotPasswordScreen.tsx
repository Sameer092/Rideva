import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
      <View className="flex-1 justify-center gap-5 p-6">
        <Text className="text-3xl font-extrabold text-light-text dark:text-dark-text">Reset password</Text>
        <Text className="text-light-textMuted dark:text-dark-textMuted">
          Enter your email and we'll send you a reset link.
        </Text>
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
        )} />
        <Button label="Send reset link" loading={loading} onPress={handleSubmit(onSubmit)} />
        <Button label="Back to sign in" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}
