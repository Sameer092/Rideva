import React, { useState } from "react";
import { View, Text, Alert, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
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
      const data = await authService.signUp(values);
      // If a session came back, the auth listener will switch to the main app
      // automatically — nothing else to do here. If there's no session, the
      // project still requires email confirmation.
      if (!data.session) {
        Alert.alert(
          "Confirm your email",
          "We sent a confirmation link to your inbox. Confirm it, then sign in.\n\n(For testing, you can turn off 'Confirm email' in Supabase → Authentication → Providers → Email.)",
          [{ text: "OK", onPress: () => navigation.navigate("SignIn") }],
        );
      }
    } catch (e) {
      Alert.alert("Sign up failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="px-5 pt-2">
        <ScreenHeader onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 22 }} keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text className="text-4xl font-black text-light-text dark:text-dark-text">Create account</Text>
          <Text className="text-base text-light-textMuted dark:text-dark-textMuted">
            Join Rideva in a few seconds
          </Text>
        </View>

        {/* Role selector — choose your experience */}
        <View className="flex-row gap-3">
          {([
            { key: "passenger", emoji: "🧍", title: "Ride", sub: "Book trips" },
            { key: "driver", emoji: "🚗", title: "Drive", sub: "Earn money" },
          ] as const).map((r) => {
            const active = role === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setValue("role", r.key)}
                className={`flex-1 gap-1 rounded-3xl border-2 p-4 ${
                  active ? "border-brand bg-brand-50 dark:bg-brand-700/25" : "border-light-border dark:border-dark-border"
                }`}
              >
                <Text className="text-3xl">{r.emoji}</Text>
                <Text className="text-lg font-extrabold text-light-text dark:text-dark-text">{r.title}</Text>
                <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">{r.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-4">
          <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
            <Input label="Full name" leftIcon={<Text>👤</Text>} placeholder="Jane Doe" value={value} onChangeText={onChange} error={errors.fullName?.message} />
          )} />
          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <Input label="Email" leftIcon={<Text>✉️</Text>} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" value={value} onChangeText={onChange} error={errors.email?.message} />
          )} />
          <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
            <Input label="Phone (optional)" leftIcon={<Text>📱</Text>} keyboardType="phone-pad" placeholder="+1 555 000 0000" value={value} onChangeText={onChange} error={errors.phone?.message} />
          )} />
          <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
            <Input label="Password" leftIcon={<Text>🔒</Text>} secureTextEntry placeholder="At least 8 characters" value={value} onChangeText={onChange} error={errors.password?.message} />
          )} />
        </View>

        <Button label="Create account" size="lg" loading={loading} onPress={handleSubmit(onSubmit)} />
        <View className="flex-row justify-center gap-1">
          <Text className="text-light-textMuted dark:text-dark-textMuted">Already have an account?</Text>
          <Text className="font-bold text-brand" onPress={() => navigation.navigate("SignIn")}>Sign in</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
