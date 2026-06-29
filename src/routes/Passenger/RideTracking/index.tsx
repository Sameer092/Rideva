import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp, currency, formatDistance, formatEta, ratingText } from '@utils/utilities';
import { Button, NameAvatar } from '@components/common';
import RideMap from '@components/map/RideMap';
import { RIDE_STATUS_COPY } from '@config/constant';
import { getDriverInfo, getDriverLocation, getRide } from '@store/Ride/api';
import { toLatLng } from '@library/location';
import * as RideActions from '@store/Ride/actions';
import * as CommonActions from '@store/Common/actions';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  activeRide: state.Ride.ride.get('activeRide'),
  bids: state.Ride.ride.get('bids'),
});

let enhancer = connect(connectState, { ...RideActions, ...CommonActions });

function RideTracking({ navigation, user, activeRide, bids, loadActiveRide, loadBids, acceptBid, cancelRide, resetBooking, setActiveRide }) {
  const [driver, setDriver] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const rideId = activeRide && activeRide.id;
  const status = activeRide && activeRide.status;
  const matching = status === 'requested' || status === 'matching';

  useEffect(() => {
    if (!rideId) return;
    const tick = async () => {
      if (user) await loadActiveRide(user.id);
      if (matching) loadBids(rideId);
      else {
        const loc = await getDriverLocation(rideId);
        if (loc) setDriverLoc(toLatLng(loc.point));
      }
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [rideId, matching]);

  useEffect(() => {
    if (activeRide && activeRide.driver_id && !driver) {
      getDriverInfo(activeRide.driver_id).then(setDriver);
    }
  }, [activeRide && activeRide.driver_id]);

  useEffect(() => {
    if (!status) return;
    if (status === 'completed') {
      const id = rideId;
      resetBooking();
      navigation.replace('RideSummary', { rideId: id });
    } else if (status === 'cancelled' || status === 'no_drivers') {
      resetBooking();
      setActiveRide(null);
      Alert.alert(RIDE_STATUS_COPY[status].title, RIDE_STATUS_COPY[status].subtitle);
      navigation.goBack();
    }
  }, [status]);

  const accept = async (offerId) => {
    setAccepting(offerId);
    try {
      const won = await acceptBid(offerId);
      if (!won) Alert.alert('Unavailable', 'That offer is no longer available.');
      else if (user) await loadActiveRide(user.id);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not accept offer');
    } finally {
      setAccepting(null);
    }
  };

  const cancel = () => {
    Alert.alert('Cancel ride?', 'Are you sure?', [
      { text: 'Keep ride', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelRide(rideId, 'passenger') },
    ]);
  };

  if (!activeRide) return null;
  const copy = RIDE_STATUS_COPY[status] || { title: status, subtitle: '' };

  return (
    <View style={styles.flex}>
      <RideMap pickup={toPoint(activeRide.pickup_point)} dropoff={toPoint(activeRide.dropoff_point)} driver={driverLoc} />

      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {matching ? (
          <View style={styles.card}>
            <View style={styles.matchHead}>
              <View style={styles.flex}>
                <Text style={styles.title}>Choosing your driver</Text>
                <Text style={styles.subtitle}>{bids.length ? `${bids.length} offer${bids.length > 1 ? 's' : ''} — pick one` : 'Waiting for driver offers…'}</Text>
              </View>
              <View style={styles.offerCol}>
                <Text style={styles.offerLabel}>Your offer</Text>
                <Text style={styles.offerValue}>{currency(activeRide.offered_fare || activeRide.fare_estimate)}</Text>
              </View>
            </View>

            <ScrollView style={styles.bidScroll} showsVerticalScrollIndicator={false}>
              {bids.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="search" size={wp(8)} color={colors.txtTertiary} />
                  <Text style={styles.emptyText}>Drivers nearby are reviewing your request…</Text>
                </View>
              ) : (
                bids.map((b) => (
                  <View key={b.offer_id} style={styles.bid}>
                    <NameAvatar name={b.driver_name} size={wp(11)} />
                    <View style={styles.flex}>
                      <Text style={styles.bidName}>{b.driver_name}</Text>
                      <Text style={styles.bidMeta}>
                        {b.rating > 0 ? `★ ${ratingText(b.rating)}` : 'New'} · {formatDistance(b.distance_m)} · {formatEta(b.eta_s)}
                      </Text>
                      <Text numberOfLines={1} style={styles.bidVehicle}>
                        {[b.vehicle_color, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' ') || 'Vehicle'}
                        {b.license_plate ? `  ·  ${b.license_plate}` : ''}
                      </Text>
                    </View>
                    <View style={styles.bidRight}>
                      <Text style={styles.bidPrice}>{currency(b.bid_amount)}</Text>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => accept(b.offer_id)} disabled={accepting === b.offer_id}>
                        <Text style={styles.acceptText}>{accepting === b.offer_id ? '…' : 'Accept'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity onPress={cancel} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancel request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            {activeRide.fare_final != null ? <Text style={styles.agreed}>Agreed fare {currency(activeRide.fare_final)}</Text> : null}

            {driver && driver.profile ? (
              <View style={styles.driverRow}>
                <NameAvatar name={driver.profile.full_name} uri={driver.profile.avatar_url} size={wp(13)} />
                <View style={styles.flex}>
                  <Text style={styles.bidName}>{driver.profile.full_name}</Text>
                  <Text style={styles.bidMeta}>{driver.profile.rating_count > 0 ? `★ ${ratingText(driver.profile.rating_avg)}` : 'New'}</Text>
                  {driver.driver ? <Text style={styles.bidVehicle}>{[driver.driver.vehicle_color, driver.driver.vehicle_make, driver.driver.vehicle_model].filter(Boolean).join(' ')}</Text> : null}
                </View>
                {driver.driver && driver.driver.license_plate ? (
                  <View style={styles.plate}>
                    <Text style={styles.plateText}>{driver.driver.license_plate}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {(status === 'accepted' || status === 'arriving') ? (
              <Button label="Cancel ride" variant="danger" onPress={cancel} buttonStyle={styles.cancelBtn} />
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function toPoint(geo) {
  return toLatLng(geo);
}

export default enhancer(RideTracking);

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
    padding: wp(5),
    maxHeight: hp(64)
  },
  matchHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary
  },
  offerCol: {
    alignItems: 'flex-end'
  },
  offerLabel: {
    fontWeight: Regular,
    fontSize: wp(2.8),
    color: colors.txtTertiary
  },
  offerValue: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.primary
  },
  bidScroll: {
    maxHeight: hp(38)
  },
  empty: {
    alignItems: 'center',
    paddingVertical: hp(3),
    gap: hp(1)
  },
  emptyText: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary,
    textAlign: 'center'
  },
  bid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: colors.dark100,
    borderRadius: wp(3.5),
    padding: wp(3),
    marginBottom: hp(1)
  },
  bidName: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  bidMeta: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: colors.txtSecondary
  },
  bidVehicle: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: colors.txtSecondary
  },
  bidRight: {
    alignItems: 'flex-end',
    gap: hp(0.6)
  },
  bidPrice: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(6),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8)
  },
  acceptText: {
    fontWeight: Bold,
    fontSize: wp(3.2),
    color: colors.white
  },
  cancelLink: {
    alignSelf: 'center',
    marginTop: hp(1)
  },
  cancelText: {
    fontWeight: SemiBold,
    fontSize: wp(3.6),
    color: colors.primary
  },
  agreed: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.primary,
    marginTop: hp(0.5)
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(2)
  },
  plate: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: wp(2),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4)
  },
  plateText: {
    fontWeight: Bold,
    fontSize: wp(3.2),
    color: colors.txtDark,
    letterSpacing: 1
  },
  cancelBtn: {
    marginTop: hp(2)
  }
});
