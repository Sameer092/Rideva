import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { Button } from '@components/common';
import RideMap from '@components/map/RideMap';
import { toLatLng } from '@library/location';
import * as DriverActions from '@store/Driver/actions';
import * as RideActions from '@store/Ride/actions';

const NEXT = {
  accepted: { label: "I've arrived", status: 'arrived' },
  arriving: { label: "I've arrived", status: 'arrived' },
  arrived: { label: 'Start ride', status: 'in_progress' },
};

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  activeRide: state.Ride.ride.get('activeRide'),
});

let enhancer = connect(connectState, { ...DriverActions, ...RideActions });

function ActiveTrip({ navigation, user, activeRide, updateRideStatus, completeRide, loadActiveRide }) {
  const [busy, setBusy] = useState(false);
  const rideId = activeRide && activeRide.id;
  const status = activeRide && activeRide.status;
  const toDropoff = status === 'in_progress';

  useEffect(() => {
    if (!rideId) return;
    const t = setInterval(() => user && loadActiveRide(user.id), 5000);
    return () => clearInterval(t);
  }, [rideId]);

  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') navigation.goBack();
  }, [status]);

  if (!activeRide) return null;

  const pickup = toLatLng(activeRide.pickup_point);
  const dropoff = toLatLng(activeRide.dropoff_point);
  const target = toDropoff ? dropoff : pickup;

  const openNav = () => {
    if (!target) return;
    const url = Platform.select({
      ios: `maps://?daddr=${target.latitude},${target.longitude}`,
      android: `google.navigation:q=${target.latitude},${target.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const advance = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = NEXT[status];
      if (next) {
        await updateRideStatus(rideId, next.status);
        if (user) await loadActiveRide(user.id);
      } else if (status === 'in_progress') {
        await completeRide(rideId, activeRide.distance_m || 0, activeRide.duration_s || 0);
        const fare = activeRide.fare_final || activeRide.offered_fare || 0;
        Alert.alert('Ride complete', `${currency(fare)} added to your earnings.`, [
          { text: 'Rate passenger', onPress: () => navigation.replace('Rate', { rideId, rateeId: activeRide.passenger_id }) },
        ]);
      }
    } catch (e) {
      Alert.alert("Couldn't complete", e.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const cta = NEXT[status] ? NEXT[status].label : toDropoff ? 'Complete ride' : 'Waiting…';

  return (
    <View style={styles.flex}>
      <RideMap pickup={pickup} dropoff={dropoff} />

      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <View style={styles.card}>
          <View style={styles.head}>
            <View style={styles.iconBox}>
              <Icon name={toDropoff ? 'flag' : 'location'} size={wp(5.5)} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>{toDropoff ? 'DRIVE TO DESTINATION' : 'DRIVE TO PICKUP'}</Text>
              <Text numberOfLines={2} style={styles.address}>{toDropoff ? activeRide.dropoff_address : activeRide.pickup_address}</Text>
            </View>
          </View>
        </View>

        <Button label="Open navigation" variant="outline" onPress={openNav} buttonStyle={styles.btn} />
        <Button label={cta} onPress={advance} loading={busy} buttonStyle={styles.btn} />
        {status === 'accepted' || status === 'arriving' ? (
          <TouchableOpacity style={styles.cancel} onPress={() => Alert.alert('Cancel ride?', '', [{ text: 'No' }, { text: 'Yes', style: 'destructive', onPress: () => navigation.goBack() }])}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

export default enhancer(ActiveTrip);

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: wp(4)
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(5),
    padding: wp(4),
    marginBottom: hp(1.5),
    elevation: 4
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3)
  },
  iconBox: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(3.5),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontWeight: Bold,
    fontSize: wp(2.8),
    color: colors.primary,
    letterSpacing: 0.5
  },
  address: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  btn: {
    marginBottom: hp(1.2)
  },
  cancel: {
    alignSelf: 'center',
    marginTop: hp(0.5)
  },
  cancelText: {
    fontWeight: SemiBold,
    fontSize: wp(3.6),
    color: colors.primary
  }
});
