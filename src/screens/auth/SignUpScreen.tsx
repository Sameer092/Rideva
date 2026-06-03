import React, { useState } from "react";
import { View, Text, Alert, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUpSchema, type SignUpValues } from "@/utils/validation";
import { authService } from "@/services/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", role: "passenger" },
  });
  const role = watch("role");

  async function onSubmit(values: SignUpValues) {
    setLoading(true);
    try {
      await authService.signUp(values);
      Alert.alert("Account created", "You're all set — signing you in.");
    } catch (e) {
      Alert.alert("Sign up failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-extrabold text-light-text dark:text-dark-text">Create account</Text>

        {/* Role toggle — chooses which app experience you sign up for. */}
        <View className="flex-row gap-3">
          {(["passenger", "driver"] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setValue("role", r)}
              className={`flex-1 items-center rounded-2xl border p-3 ${
                role === r ? "border-brand bg-brand-50 dark:bg-brand-700" : "border-light-border dark:border-dark-border"
              }`}
            >
              <Text className="text-2xl">{r === "passenger" ? "🧍" : "🚗"}</Text>
              <Text className="font-semibold capitalize text-light-text dark:text-dark-text">{r}</Text>
            </Pressable>
          ))}
        </View>

        <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
          <Input label="Full name" value={value} onChangeText={onChange} error={errors.fullName?.message} />
        )} />
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
        )} />
        <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
          <Input label="Phone (optional)" keyboardType="phone-pad" value={value} onChangeText={onChange} error={errors.phone?.message} />
        )} />
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <Input label="Password" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
        )} />

        <Button label="Create account" loading={loading} onPress={handleSubmit(onSubmit)} />
        <Button label="I already have an account" variant="ghost" onPress={() => navigation.navigate("SignIn")} />
      </ScrollView>
    </SafeAreaView>
  );
}
