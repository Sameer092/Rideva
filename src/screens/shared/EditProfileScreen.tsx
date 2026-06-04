import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuthStore } from "@/store/authStore";
import { profileService } from "@/services/profile";
import { supabase } from "@/services/supabase";
import { VEHICLE_CLASSES } from "@/constants";
import type { VehicleClass } from "@/types";

/** Edit profile: avatar, name, phone (email is read-only) + driver vehicle. */
export function EditProfileScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const isDriver = profile?.role === "driver";

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [avatarB64, setAvatarB64] = useState<string | null>(null);
  const [avatarExt, setAvatarExt] = useState("jpg");

  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("economy");
  const [vehicleMake, setVehicleMake] = useState("");
  const [plate, setPlate] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDriver || !userId) return;
    supabase.from("drivers").select("vehicle_class, vehicle_make, license_plate").eq("id", userId).single()
      .then(({ data }) => {
        if (data) {
          setVehicleClass(data.vehicle_class);
          setVehicleMake(data.vehicle_make ?? "");
          setPlate(data.license_plate ?? "");
        }
      });
  }, [isDriver, userId]);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to change your picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setLocalAvatar(a.uri);
    setAvatarB64(a.base64 ?? null);
    setAvatarExt(a.uri.endsWith(".png") ? "png" : "jpg");
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarB64) avatarUrl = await profileService.uploadAvatar(userId, avatarB64, avatarExt);
      const updated = await profileService.updateProfile(userId, { fullName: fullName.trim(), phone, avatarUrl });
      if (isDriver) {
        await profileService.updateDriver(userId, { vehicleClass, vehicleMake: vehicleMake.trim(), licensePlate: plate.trim() });
      }
      useAuthStore.getState().setProfile(updated);
      Alert.alert("Saved", "Your profile has been updated.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't save", (e as { message?: string })?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="px-5 pt-2">
        <ScreenHeader title="Edit profile" onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View className="items-center gap-3">
          <Avatar name={fullName || profile?.fullName} uri={localAvatar ?? profile?.avatarUrl} size={104} />
          <Pressable onPress={pickPhoto} className="rounded-full bg-brand-50 dark:bg-brand-700/25 px-4 py-2">
            <Text className="font-bold text-brand">Change photo</Text>
          </Pressable>
        </View>

        <Input label="Full name" leftIcon={<Text>👤</Text>} value={fullName} onChangeText={setFullName} />
        <Input label="Phone" leftIcon={<Text>📱</Text>} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" />

        {/* Email — read only */}
        <View className="gap-2">
          <Text className="ml-1 text-sm font-semibold text-light-textMuted dark:text-dark-textMuted">Email (can't be changed)</Text>
          <View className="flex-row items-center gap-3 rounded-2xl border-2 border-light-border dark:border-dark-border px-4 h-[56px] opacity-60">
            <Text>✉️</Text>
            <Text className="flex-1 text-base font-medium text-light-text dark:text-dark-text">{profile?.email}</Text>
            <Text>🔒</Text>
          </View>
        </View>

        {isDriver && (
          <View className="gap-4">
            <View className="gap-2">
              <Text className="ml-1 text-sm font-semibold text-light-textMuted dark:text-dark-textMuted">Vehicle type</Text>
              <View className="flex-row flex-wrap gap-2">
                {VEHICLE_CLASSES.map((vc) => {
                  const active = vehicleClass === vc.key;
                  return (
                    <Pressable
                      key={vc.key}
                      onPress={() => setVehicleClass(vc.key)}
                      className={`flex-row items-center gap-1.5 rounded-full border-2 px-3 py-2 ${
                        active ? "border-brand bg-brand-50 dark:bg-brand-700/25" : "border-light-border dark:border-dark-border"
                      }`}
                    >
                      <Text>{vc.icon}</Text>
                      <Text className="font-bold text-light-text dark:text-dark-text">{vc.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Input label="Vehicle" leftIcon={<Text>🚘</Text>} value={vehicleMake} onChangeText={setVehicleMake} placeholder="White Toyota Corolla" />
            <Input label="Vehicle number (plate)" leftIcon={<Text>🔢</Text>} autoCapitalize="characters" value={plate} onChangeText={setPlate} placeholder="ABC-123" />
          </View>
        )}

        <Button label={saving ? "Saving…" : "Save changes"} size="lg" loading={saving} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}
