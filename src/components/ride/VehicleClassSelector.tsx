import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { VEHICLE_CLASSES } from "@/constants";
import { formatMoney } from "@/utils/format";
import type { VehicleClass, FareBreakdown } from "@/types";

interface Props {
  selected: VehicleClass;
  onSelect: (vc: VehicleClass) => void;
  /** Per-class fare estimates keyed by class, if computed. */
  fares?: Partial<Record<VehicleClass, FareBreakdown>>;
}

/** Horizontal selector of vehicle tiers with live fare per option. */
export function VehicleClassSelector({ selected, onSelect, fares }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
    >
      {VEHICLE_CLASSES.map((vc) => {
        const active = vc.key === selected;
        const fare = fares?.[vc.key];
        return (
          <Pressable
            key={vc.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(vc.key)}
            className={`w-32 rounded-2xl border p-3 ${
              active
                ? "border-brand bg-brand-50 dark:bg-brand-700"
                : "border-light-border dark:border-dark-border bg-surface-light dark:bg-surface-dark"
            }`}
          >
            <Text className="text-2xl">{vc.icon}</Text>
            <Text className="mt-1 font-bold text-light-text dark:text-dark-text">{vc.label}</Text>
            <Text className="text-xs text-light-textMuted dark:text-dark-textMuted">
              {vc.seats} seats · {vc.eta}
            </Text>
            <Text className="mt-1 font-semibold text-brand">
              {fare ? formatMoney(fare.totalAmount, fare.currency) : "—"}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
