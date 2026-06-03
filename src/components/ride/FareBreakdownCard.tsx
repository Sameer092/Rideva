import React from "react";
import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/utils/format";
import type { FareBreakdown } from "@/types";

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={`${bold ? "font-bold text-base" : "text-sm"} text-light-text dark:text-dark-text`}>
        {label}
      </Text>
      <Text className={`${bold ? "font-bold text-base" : "text-sm"} text-light-text dark:text-dark-text`}>
        {value}
      </Text>
    </View>
  );
}

/** Itemised fare breakdown: base, distance, time, surge, fees, total. */
export function FareBreakdownCard({ fare }: { fare: FareBreakdown }) {
  const c = fare.currency;
  return (
    <Card>
      <Text className="mb-2 font-bold text-light-text dark:text-dark-text">Fare breakdown</Text>
      <Row label="Base fare" value={formatMoney(fare.baseFare, c)} />
      <Row label="Distance" value={formatMoney(fare.distanceFare, c)} />
      <Row label="Time" value={formatMoney(fare.timeFare, c)} />
      {fare.surgeAmount > 0 && <Row label="Surge" value={formatMoney(fare.surgeAmount, c)} />}
      {fare.bookingFee > 0 && <Row label="Booking fee" value={formatMoney(fare.bookingFee, c)} />}
      <View className="my-2 h-px bg-light-border dark:bg-dark-border" />
      <Row label="Total" value={formatMoney(fare.totalAmount, c)} bold />
    </Card>
  );
}
