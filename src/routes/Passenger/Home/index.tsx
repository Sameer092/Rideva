import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import MCIcon from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { Button, NameAvatar } from '@components/common';
import RideMap from '@components/map/RideMap';
import { VEHICLE_CLASSES } from '@config/constant';
import { getCurrentLocation, requestPermission, reverseGeocode } from '@library/location';
import * as CommonActions from '@store/Common/actions';
import * as RideActions from '@store/Ride/actions';

function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(x)));
}

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  pickup: state.Common.common.get('pickup'),
  dropoff: state.Common.common.get('dropoff'),
  nearby: state.Ride.ride.get('nearby'),
  activeRide: state.Ride.ride.get('activeRide'),
});

let enhancer = connect(connectState, { ...CommonActions, ...RideActions });

function Home({ navigation, user, pickup, dropoff, nearby, activeRide, setPickup, loadNearby, estimateFare, createRide, loadActiveRide, setActiveRide }) {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [vehicleClass, setVehicleClass] = useState('economy');
  const [fares, setFares] = useState({});
  const [offer, setOffer] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ok = await requestPermission();
      if (!ok) return;
      try {
        const point = await getCurrentLocation();
        mapRef.current && mapRef.current.setCenter(point, 15);
        const address = await reverseGeocode(point);
        setPickup({ address, point });
      } catch (e) {}
      if (user) loadActiveRide(user.id);
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (activeRide && !['completed', 'cancelled', 'no_drivers'].includes(activeRide.status)) {
        navigation.navigate('RideTracking');
      }
    }, [activeRide]),
  );

  useEffect(() => {
    if (pickup) loadNearby(pickup.point, vehicleClass);
  }, [pickup && pickup.address, vehicleClass]);

  useEffect(() => {
    if (pickup && dropoff) {
      runEstimate();
      mapRef.current && mapRef.current.fitTwo(pickup.point, dropoff.point);
    }
  }, [pickup && pickup.address, dropoff && dropoff.address]);

  useEffect(() => {
    if (fares[vehicleClass]) setOffer(fares[vehicleClass].total_amount);
  }, [fares, vehicleClass]);

  const runEstimate = async () => {
    const distance = Math.round(haversine(pickup.point, dropoff.point) * 1.3);
    const duration = Math.round(distance / 8.33);
    const results = await Promise.allSettled(VEHICLE_CLASSES.map((vc) => estimateFare(vc.key, distance, duration)));
    const next = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') next[VEHICLE_CLASSES[i].key] = r.value;
    });
    setFares(next);
  };

  const adjust = (pct) => {
    setOffer((prev) => {
      const base = prev || (fares[vehicleClass] && fares[vehicleClass].total_amount) || 0;
      const step = Math.max(50, Math.round((base * pct) / 100 / 50) * 50);
      return Math.max(50, base + (pct > 0 ? step : -step));
    });
  };

  const book = async () => {
    if (!offer) return;
    setBusy(true);
    try {
      const distance = Math.round(haversine(pickup.point, dropoff.point) * 1.3);
      const duration = Math.round(distance / 8.33);
      const ride = await createRide({
        passenger_id: user.id,
        pickup,
        dropoff,
        vehicle_class: vehicleClass,
        distance_m: distance,
        duration_s: duration,
        offered_fare: offer,
      });
      setActiveRide(ride);
      navigation.navigate('RideTracking');
    } catch (e) {
      Alert.alert("Couldn't book ride", e.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.flex}>
      <RideMap ref={mapRef} pickup={pickup && pickup.point} dropoff={dropoff && dropoff.point} vehicles={nearby} />

      <View style={[styles.topBar, { paddingTop: insets.top + hp(1) }]}>
        <View style={styles.welcome}>
          <NameAvatar name={user && user.full_name} uri={user && user.avatar_url} size={wp(9)} />
          <View style={styles.welcomeText}>
            <Text style={styles.hi}>Welcome back</Text>
            <Text style={styles.name}>{user ? user.full_name.split(' ')[0] : 'Rider'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.starBtn} onPress={() => navigation.navigate('SavedLocations')}>
          <Icon name="bookmark" size={wp(5)} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <View style={styles.grabber} />
        <Text style={styles.panelTitle}>{dropoff ? 'Confirm your ride' : 'Where to?'}</Text>

        <View style={styles.stepper}>
          <TouchableOpacity style={styles.locRow} onPress={() => navigation.navigate('LocationPicker', { field: 'pickup' })}>
            <View style={styles.dot} />
            <Text numberOfLines={1} style={styles.locText}>{pickup ? pickup.address : 'Set pickup location'}</Text>
            <Icon name="create-outline" size={wp(4.5)} color={colors.txtTertiary} />
          </TouchableOpacity>
          <View style={styles.line} />
          <TouchableOpacity style={styles.locRow} onPress={() => navigation.navigate('LocationPicker', { field: 'dropoff' })}>
            <View style={styles.square} />
            <Text numberOfLines={1} style={styles.locText}>{dropoff ? dropoff.address : 'Where are you going?'}</Text>
            <Icon name="create-outline" size={wp(4.5)} color={colors.txtTertiary} />
          </TouchableOpacity>
        </View>

        {dropoff ? (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {VEHICLE_CLASSES.map((vc) => {
              const active = vehicleClass === vc.key;
              const fare = fares[vc.key];
              return (
                <TouchableOpacity key={vc.key} style={[styles.vehicle, active && styles.vehicleActive]} onPress={() => setVehicleClass(vc.key)}>
                  <View style={[styles.vehicleIcon, active && styles.vehicleIconActive]}>
                    <MCIcon name={vc.icon} size={wp(6)} color={active ? colors.ink : colors.txtDark} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.vehicleLabel}>{vc.label}</Text>
                    <Text style={styles.vehicleSub}>{vc.seats} seats</Text>
                  </View>
                  <Text style={styles.vehicleFare}>{fare ? currency(fare.total_amount) : '—'}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.offer}>
              <Text style={styles.offerLabel}>Your offer</Text>
              <View style={styles.offerRow}>
                <TouchableOpacity style={styles.offerBtn} onPress={() => adjust(-10)}>
                  <Icon name="remove" size={wp(6)} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.offerValue}>{offer ? currency(offer) : '—'}</Text>
                <TouchableOpacity style={styles.offerBtn} onPress={() => adjust(10)}>
                  <Icon name="add" size={wp(6)} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.offerHint}>Suggested {fares[vehicleClass] ? currency(fares[vehicleClass].total_amount) : '—'} · pay Cash</Text>
            </View>

            <Button label="Find a driver" onPress={book} loading={busy} disabled={!offer} buttonStyle={styles.findBtn} />
          </ScrollView>
        ) : (
          <View style={styles.chips}>
            <TouchableOpacity style={styles.chip} onPress={() => navigation.navigate('LocationPicker', { field: 'dropoff' })}>
              <Icon name="location-outline" size={wp(4)} color={colors.primary} />
              <Text style={styles.chipText}>Choose on map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => navigation.navigate('SavedLocations')}>
              <Icon name="bookmark-outline" size={wp(4)} color={colors.primary} />
              <Text style={styles.chipText}>Saved</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default enhancer(Home);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5)
  },
  welcome: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: wp(2.5),
    paddingVertical: wp(1.5),
    gap: wp(2)
  },
  welcomeText: {
    paddingRight: wp(2)
  },
  hi: {
    fontWeight: Regular,
    fontSize: wp(2.8),
    color: colors.txtSecondary
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  starBtn: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(6),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: wp(7),
    borderTopRightRadius: wp(7),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    paddingTop: hp(1),
    maxHeight: hp(66)
  },
  grabber: {
    alignSelf: 'center',
    width: wp(11),
    height: wp(1.2),
    borderRadius: wp(1),
    backgroundColor: colors.border,
    marginBottom: hp(1.5)
  },
  panelTitle: {
    fontWeight: Bold,
    fontSize: wp(5.6),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  stepper: {
    backgroundColor: colors.elevated,
    borderRadius: wp(4),
    padding: wp(1)
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.7)
  },
  dot: {
    width: wp(2.6),
    height: wp(2.6),
    borderRadius: wp(2),
    backgroundColor: colors.primary
  },
  square: {
    width: wp(2.6),
    height: wp(2.6),
    borderRadius: 2,
    backgroundColor: colors.white
  },
  line: {
    marginLeft: wp(5.2),
    width: 1,
    height: hp(1.6),
    backgroundColor: colors.border
  },
  locText: {
    flex: 1,
    fontWeight: SemiBold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  scroll: {
    marginTop: hp(2)
  },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    borderRadius: wp(4),
    borderWidth: 1.5,
    borderColor: colors.transparent,
    backgroundColor: colors.elevated,
    padding: wp(2.5),
    marginBottom: hp(1)
  },
  vehicleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  vehicleIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(3.5),
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  vehicleIconActive: {
    backgroundColor: colors.primary
  },
  vehicleLabel: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  vehicleSub: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  vehicleFare: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark
  },
  offer: {
    backgroundColor: colors.elevated,
    borderRadius: wp(4),
    padding: wp(4),
    marginTop: hp(1)
  },
  offerLabel: {
    fontWeight: SemiBold,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    textAlign: 'center'
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: hp(0.5)
  },
  offerBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  offerValue: {
    fontWeight: Bold,
    fontSize: wp(7.5),
    color: colors.txtDark
  },
  offerHint: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: colors.txtSecondary,
    textAlign: 'center'
  },
  findBtn: {
    marginTop: hp(2),
    marginBottom: hp(1)
  },
  chips: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(1)
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: colors.elevated,
    borderRadius: wp(8),
    paddingHorizontal: wp(4),
    height: hp(5.5)
  },
  chipText: {
    fontWeight: SemiBold,
    fontSize: wp(3.4),
    color: colors.txtDark
  }
});
