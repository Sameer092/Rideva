import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { Driver, Profile } from "@/types";

interface Props {
  driver: Driver;
  profile: Profile;
  etaLabel?: string;
}

/** Driver summary shown to the passenger once a ride is accepted. */
export function DriverCard({ driver, profile, etaLabel }: Props) {
  return (
    <Card>
      <View className="flex-row items-center gap-3.5">
        <Avatar name={profile.fullName} uri={profile.avatarUrl} size={56} />

        <View className="flex-1">
          <Text className="text-base font-extrabold text-light-text dark:text-dark-text">{profile.fullName}</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-bold text-warning">
              {profile.ratingCount > 0 ? `★ ${profile.ratingAvg.toFixed(1)}` : "New"}
            </Text>
            <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">· {driver.totalTrips} rides</Text>
          </View>
          <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
            {driver.vehicleColor} {driver.vehicleMake} {driver.vehicleModel}
          </Text>
        </View>

        <View className="items-end gap-2">
          {driver.licensePlate && (
            <View className="rounded-lg border-2 border-light-border dark:border-dark-border px-2.5 py-1">
              <Text className="font-black tracking-widest text-light-text dark:text-dark-text">{driver.licensePlate}</Text>
            </View>
          )}
          {profile.phone && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call driver"
              onPress={() => Linking.openURL(`tel:${profile.phone}`)}
              className="h-11 w-11 items-center justify-center rounded-full bg-brand"
            >
              <Icon name="call" size={18} color="#ffffff" />
            </Pressable>
          )}
        </View>
      </View>

      {etaLabel && (
        <View className="mt-4 rounded-2xl bg-brand-50 dark:bg-brand-700/25 px-4 py-3">
          <Text className="text-center font-bold text-brand-700 dark:text-brand-200">{etaLabel}</Text>
        </View>
      )}
    </Card>
  );
}
