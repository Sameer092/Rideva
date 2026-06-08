import React, { useState } from "react";
import { View, Text, Alert, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon, VehicleIcon } from "@/components/ui/Icon";
import { signUpSchema, type SignUpValues } from "@/utils/validation";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { VEHICLE_CLASSES } from "@/constants";
import { GRADIENTS, GRADIENT_DIRECTION } from "@/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", role: "passenger", vehicleClass: "economy" },
  });
  const role = watch("role");
  const vehicleClass = watch("vehicleClass");

  async function onSubmit(values: SignUpValues) {
    setLoading(true);
    try {
      const data = await authService.signUp(values);

      // No session ⇒ the project still requires email confirmation.
      if (!data.session || !data.user) {
        Alert.alert(
          "Confirm your email",
          "We sent a confirmation link to your inbox. Confirm it, then sign in.\n\n(For testing, turn off 'Confirm email' in Supabase → Authentication → Providers → Email.)",
          [{ text: "OK", onPress: () => navigation.navigate("SignIn") }],
        );
        return;
      }

      // Session present ⇒ load the freshly-created profile and enter the app.
      const { setSession, setProfile } = useAuthStore.getState();
      setSession(data.session);
      try {
        setProfile(await authService.fetchProfileWithRetry(data.user.id));
      } catch {
        Alert.alert("Account created", "Please sign in to continue.", [
          { text: "OK", onPress: () => navigation.navigate("SignIn") },
        ]);
      }
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Please try again.";
      Alert.alert("Sign up failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                <Text className="mt-6 text-4xl font-black text-white">Create account</Text>
                <Text className="mt-1 text-base text-white/80">Join Rideva in a few seconds</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View className="gap-5 px-6 pt-6" style={{ paddingBottom: 32 }}>
            {/* Role selector */}
            <View className="flex-row gap-3">
              {([
                { key: "passenger", icon: "person", title: "Ride", sub: "Book rides" },
                { key: "driver", icon: "car-sport", title: "Drive", sub: "Earn money" },
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
                    <Icon name={r.icon} size={28} color={active ? "#6D5EF6" : undefined} />
                    <Text className="mt-1 text-lg font-extrabold text-light-text dark:text-dark-text">{r.title}</Text>
                    <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">{r.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Vehicle type — drivers only */}
            {role === "driver" && (
              <View className="gap-2">
                <Text className="ml-1 text-sm font-semibold text-light-textMuted dark:text-dark-textMuted">
                  What do you drive?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {VEHICLE_CLASSES.map((vc) => {
                    const active = vehicleClass === vc.key;
                    return (
                      <Pressable
                        key={vc.key}
                        onPress={() => setValue("vehicleClass", vc.key)}
                        className={`flex-row items-center gap-1.5 rounded-full border-2 px-3 py-2 ${
                          active ? "border-brand bg-brand-50 dark:bg-brand-700/25" : "border-light-border dark:border-dark-border"
                        }`}
                      >
                        <VehicleIcon vehicle={vc.key} size={18} color={active ? "#6D5EF6" : undefined} />
                        <Text className="font-bold text-light-text dark:text-dark-text">{vc.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Controller control={control} name="vehicleName" render={({ field: { onChange, value } }) => (
                  <Input label="Vehicle" leftIcon={<Icon name="car-outline" muted />} placeholder="White Toyota Corolla" value={value ?? ""} onChangeText={onChange} />
                )} />
                <Controller control={control} name="licensePlate" render={({ field: { onChange, value } }) => (
                  <Input label="Vehicle number (plate)" leftIcon={<Icon name="pricetag-outline" muted />} autoCapitalize="characters" placeholder="ABC-123" value={value ?? ""} onChangeText={onChange} />
                )} />
              </View>
            )}

            <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
              <Input label="Full name" leftIcon={<Icon name="person-outline" muted />} placeholder="Jane Doe" value={value} onChangeText={onChange} error={errors.fullName?.message} />
            )} />
            <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
              <Input label="Email" leftIcon={<Icon name="mail-outline" muted />} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" value={value} onChangeText={onChange} error={errors.email?.message} />
            )} />
            <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
              <Input label="Phone (optional)" leftIcon={<Icon name="call-outline" muted />} keyboardType="phone-pad" placeholder="+1 555 000 0000" value={value} onChangeText={onChange} error={errors.phone?.message} />
            )} />
            <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
              <Input label="Password" leftIcon={<Icon name="lock-closed-outline" muted />} secureTextEntry placeholder="At least 8 characters" value={value} onChangeText={onChange} error={errors.password?.message} />
            )} />

            <Button label="Create account" size="lg" loading={loading} onPress={handleSubmit(onSubmit)} />
            <View className="flex-row justify-center gap-1">
              <Text className="text-light-textMuted dark:text-dark-textMuted">Already have an account?</Text>
              <Text className="font-bold text-brand" onPress={() => navigation.navigate("SignIn")}>Sign in</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
