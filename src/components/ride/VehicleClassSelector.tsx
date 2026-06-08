import React from "react";
import { Pressable, Text, View } from "react-native";
import { VEHICLE_CLASSES } from "@/constants";
import { VehicleIcon } from "@/components/ui/Icon";
import { formatMoney } from "@/utils/format";
import type { VehicleClass, FareBreakdown } from "@/types";

interface Props {
  selected: VehicleClass;
  onSelect: (vc: VehicleClass) => void;
  fares?: Partial<Record<VehicleClass, FareBreakdown>>;
}

/**
 * Vertical list of vehicle tiers — each a full-width row with icon, name,
 * capacity/ETA and live fare. The selected row is highlighted with a brand
 * tint + ring, matching the Uber/Bolt ride-picker pattern.
 */
export function VehicleClassSelector({ selected, onSelect, fares }: Props) {
  return (
    <View className="gap-2.5">
      {VEHICLE_CLASSES.map((vc) => {
        const active = vc.key === selected;
        const fare = fares?.[vc.key];
        return (
          <Pressable
            key={vc.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(vc.key)}
            className={`flex-row items-center gap-3 rounded-2xl border-2 p-3 ${
              active
                ? "border-brand bg-brand-50 dark:bg-brand-700/25"
                : "border-transparent bg-light-border/40 dark:bg-elevated-dark"
            }`}
          >
            <View className={`h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-brand" : "bg-surface-light dark:bg-surface-dark"}`}>
              <VehicleIcon vehicle={vc.key} size={26} color={active ? "#ffffff" : undefined} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-light-text dark:text-dark-text">{vc.label}</Text>
              <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">
                {vc.seats} seats · {vc.eta} away
              </Text>
            </View>
            <Text className="text-lg font-extrabold text-light-text dark:text-dark-text">
              {fare ? formatMoney(fare.totalAmount, fare.currency) : "—"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
