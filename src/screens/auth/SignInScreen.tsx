import React, { useState } from "react";
import { View, Text, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
      // RootNavigator swaps stacks automatically on the auth state change.
    } catch (e) {
      Alert.alert("Sign in failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="flex-1 justify-center gap-5 p-6">
          <Text className="text-3xl font-extrabold text-light-text dark:text-dark-text">Welcome back</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
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
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Button label="Sign in" loading={loading} onPress={handleSubmit(onSubmit)} />
          <Button label="Forgot password?" variant="ghost" onPress={() => navigation.navigate("ForgotPassword")} />

          <View className="flex-row justify-center gap-1">
            <Text className="text-light-textMuted dark:text-dark-textMuted">No account?</Text>
            <Text className="font-semibold text-brand" onPress={() => navigation.navigate("SignUp")}>
              Sign up
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
