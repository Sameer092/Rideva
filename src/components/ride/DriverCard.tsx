import React from "react";
import { View, Text, Image, Pressable, Linking } from "react-native";
import { Card } from "@/components/ui/Card";
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
      <View className="flex-row items-center gap-3">
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} className="h-14 w-14 rounded-full" />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-700">
            <Text className="text-xl font-bold text-brand-700 dark:text-white">
              {profile.fullName.charAt(0)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="font-bold text-light-text dark:text-dark-text">{profile.fullName}</Text>
          <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
            ⭐ {profile.ratingAvg.toFixed(2)} · {driver.totalTrips} trips
          </Text>
          <Text className="text-sm text-light-textMuted dark:text-dark-textMuted">
            {driver.vehicleColor} {driver.vehicleMake} {driver.vehicleModel} · {driver.licensePlate}
          </Text>
        </View>

        {profile.phone && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call driver"
            onPress={() => Linking.openURL(`tel:${profile.phone}`)}
            className="h-11 w-11 items-center justify-center rounded-full bg-brand"
          >
            <Text className="text-lg">📞</Text>
          </Pressable>
        )}
      </View>

      {etaLabel && (
        <View className="mt-3 rounded-xl bg-brand-50 dark:bg-brand-700 p-2">
          <Text className="text-center font-semibold text-brand-700 dark:text-white">{etaLabel}</Text>
        </View>
      )}
    </Card>
  );
}
