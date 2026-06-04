import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, Keyboard, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { PassengerStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { OSMMap, type OSMMapHandle } from "@/components/map/OSMMap";
import { useRideStore } from "@/store/rideStore";
import { useTheme } from "@/hooks/useTheme";
import { locationService } from "@/services/location";
import type { LatLng } from "@/types";

type Props = NativeStackScreenProps<PassengerStackParamList, "LocationPicker">;

/**
 * inDrive-style picker on a free OpenStreetMap. A fixed centre pin marks the
 * chosen point; panning the map reverse-geocodes the centre. The search box
 * queries Nominatim (free) and flies the map to a chosen result.
 */
export function LocationPickerScreen({ navigation, route }: Props) {
  const { field } = route.params;
  const mapRef = useRef<OSMMapHandle>(null);
  const { scheme } = useTheme();
  const { pickup, dropoff, setPickup, setDropoff } = useRideStore();

  const existing = field === "pickup" ? pickup : dropoff;
  const [center, setCenter] = useState<LatLng | null>(existing?.point ?? null);
  const [address, setAddress] = useState(existing?.address ?? "");
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ label: string; point: LatLng }>>([]);
  const [searching, setSearching] = useState(false);
  const [initialCenter, setInitialCenter] = useState<LatLng | null>(existing?.point ?? null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If no starting point, center on the device location.
  useEffect(() => {
    if (initialCenter) return;
    locationService.getCurrent().then(setInitialCenter).catch(() => setInitialCenter(null));
  }, [initialCenter]);

  // Reverse-geocode the centre whenever the map settles.
  function onRegionChange(c: LatLng) {
    setCenter(c);
    setResults([]);
    if (debounce.current) clearTimeout(debounce.current);
    setResolving(true);
    debounce.current = setTimeout(async () => {
      try {
        setAddress(await locationService.reverseGeocode(c));
      } finally {
        setResolving(false);
      }
    }, 400);
  }

  async function runSearch() {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      // Bias results to where the user currently is, so "Blue Bell Tower" etc.
      // returns the nearby one rather than a same-named place across the world.
      setResults(await locationService.search(query.trim(), 6, center ?? initialCenter));
    } finally {
      setSearching(false);
    }
  }

  /** Recenter the map on the device's GPS location. */
  async function useMyLocation() {
    try {
      const point = await locationService.getCurrent();
      mapRef.current?.animateToRegion({ ...point, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      /* ignore */
    }
  }

  function pickResult(r: { label: string; point: LatLng }) {
    setResults([]);
    setQuery("");
    Keyboard.dismiss();
    mapRef.current?.animateToRegion({ ...r.point, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  }

  function confirm() {
    if (!center) return;
    const place = { address: address || "Selected location", point: center };
    if (field === "pickup") setPickup(place);
    else setDropoff(place);
    navigation.goBack();
  }

  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <OSMMap ref={mapRef} center={initialCenter} zoom={15} dark={scheme === "dark"} onRegionChange={onRegionChange} />

      {/* Fixed center pin */}
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <View className="items-center" style={{ marginTop: -30 }}>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-brand">
            <View className="h-2.5 w-2.5 rounded-full bg-white" />
          </View>
          <View className="h-4 w-0.5 bg-brand" />
        </View>
      </View>

      {/* Search bar + results */}
      <SafeAreaView edges={["top"]} className="absolute inset-x-0 top-0">
        <View className="flex-row items-center gap-2 px-4 pt-2">
          <Pressable onPress={() => navigation.goBack()} className="h-12 w-12 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark" style={{ elevation: 4 }}>
            <Text className="text-2xl text-light-text dark:text-dark-text">‹</Text>
          </Pressable>
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-surface-light dark:bg-surface-dark px-4 h-12" style={{ elevation: 4 }}>
            <Text>🔍</Text>
            <TextInput
              placeholder={`Search ${field === "pickup" ? "pickup" : "destination"}`}
              placeholderTextColor="#9AA0AD"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
              returnKeyType="search"
              style={{ paddingVertical: 0, fontSize: 15 }}
              className="flex-1 text-light-text dark:text-dark-text"
            />
            {searching && <ActivityIndicator size="small" color="#6D5EF6" />}
          </View>
        </View>

        {results.length > 0 && (
          <View className="mx-4 mt-2 overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark" style={{ elevation: 6 }}>
            <FlatList
              data={results}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Pressable onPress={() => pickResult(item)} className="border-b border-light-border dark:border-dark-border px-4 py-3 active:opacity-60">
                  <Text numberOfLines={2} className="text-light-text dark:text-dark-text">{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </SafeAreaView>

      {/* Floating "locate me" button */}
      <View className="absolute right-5" style={{ bottom: 220 }}>
        <Pressable
          onPress={useMyLocation}
          accessibilityLabel="Use my current location"
          className="h-14 w-14 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
          style={{ elevation: 6 }}
        >
          <Text className="text-2xl">🎯</Text>
        </Pressable>
      </View>

      {/* Confirm card */}
      <SafeAreaView edges={["bottom"]} className="absolute inset-x-0 bottom-0">
        <View className="m-4 gap-3 rounded-3xl bg-surface-light dark:bg-surface-dark p-5" style={{ elevation: 8 }}>
          <View className="flex-row items-center gap-3">
            <View className={`h-3 w-3 ${field === "pickup" ? "rounded-full bg-brand" : "rounded-sm bg-light-text dark:bg-white"}`} />
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wide text-light-textMuted dark:text-dark-textMuted">
                {field === "pickup" ? "Pickup" : "Destination"}
              </Text>
              <Text className="font-bold text-light-text dark:text-dark-text" numberOfLines={2}>
                {resolving ? "Locating…" : address || "Move the map to choose"}
              </Text>
            </View>
          </View>
          <Pressable onPress={useMyLocation} className="flex-row items-center gap-2 self-start">
            <Text>📍</Text>
            <Text className="font-bold text-brand">Use my current location</Text>
          </Pressable>
          <Button label={field === "pickup" ? "Confirm pickup" : "Confirm destination"} size="lg" disabled={!center || resolving} onPress={confirm} />
        </View>
      </SafeAreaView>
    </View>
  );
}
