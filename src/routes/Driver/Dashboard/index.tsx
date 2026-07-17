import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp, currency, formatDistance, formatEta } from '@utils/utilities';
import RideMap from '@components/map/RideMap';
import { watchLocation, requestPermission } from '@library/location';
import { pushLocation } from '@store/Driver/api';
import * as DriverActions from '@store/Driver/actions';
import * as RideActions from '@store/Ride/actions';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  online: state.Driver.driver.get('online'),
  requests: state.Driver.driver.get('requests'),
  activeRide: state.Ride.ride.get('activeRide'),
});

let enhancer = connect(connectState, { ...DriverActions, ...RideActions });

function Dashboard({ navigation, user, online, requests, activeRide, setOnline, loadRequests, submitBid, loadActiveRide }) {
  const subRef = useRef(null);
  const [counterFor, setCounterFor] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');

  useEffect(() => {
    if (!online) return;
    const tick = () => {
      loadRequests();
      if (user) loadActiveRide(user.id);
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [online]);

  useEffect(() => {
    if (activeRide && ['accepted', 'arriving', 'arrived', 'in_progress'].includes(activeRide.status)) {
      navigation.navigate('ActiveTrip');
    }
  }, [activeRide]);

  useEffect(() => {
    let active = online || !!activeRide;
    if (!active) {
      if (subRef.current) subRef.current.remove();
      subRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const ok = await requestPermission();
      if (!ok || cancelled) return;
      subRef.current = await watchLocation(
        (point, heading, speed) => pushLocation(point, heading, speed, activeRide && activeRide.id),
        4000,
        15,
      );
    })();
    return () => {
      cancelled = true;
      if (subRef.current) subRef.current.remove();
      subRef.current = null;
    };
  }, [online, activeRide && activeRide.id]);

  const toggle = async (next) => {
    try {
      await setOnline(user.id, next);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update status');
    }
  };

  const bid = async (req, amount) => {
    try {
      await submitBid(req.ride_id, amount);
      setCounterFor(null);
      setCounterAmount('');
      Alert.alert('Offer sent', "We'll notify you if the passenger accepts.");
      loadRequests();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not send offer');
    }
  };

  return (
    <View style={styles.flex}>
      <RideMap />

      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.txtTertiary }]} />
            <View>
              <Text style={styles.bannerTitle}>{online ? "You're online" : "You're offline"}</Text>
              <Text style={styles.bannerSub}>{online ? 'Browse requests and send offers' : 'Go online to see ride requests'}</Text>
            </View>
          </View>
          <Switch value={online} onValueChange={toggle} trackColor={{ true: colors.primary }} thumbColor={colors.white} />
        </View>
      </SafeAreaView>

      {online ? (
        <SafeAreaView edges={['bottom']} style={styles.bottom}>
          <View style={styles.feed}>
            <Text style={styles.feedTitle}>Nearby requests {requests.length ? `(${requests.length})` : ''}</Text>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {requests.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="radio-outline" size={wp(8)} color={colors.txtTertiary} />
                  <Text style={styles.emptyText}>Waiting for ride requests near you…</Text>
                </View>
              ) : (
                requests.map((r) => (
                  <View key={r.ride_id} style={styles.req}>
                    <View style={styles.reqHead}>
                      <View style={styles.flex}>
                        <Text numberOfLines={1} style={styles.reqAddr}>📍 {r.pickup_address}</Text>
                        <Text numberOfLines={1} style={styles.reqAddrSub}>🏁 {r.dropoff_address}</Text>
                        <Text style={styles.reqMeta}>{formatDistance(r.pickup_distance_m)} away · {formatEta(r.eta_s)}</Text>
                      </View>
                      <Text style={styles.reqFare}>{currency(r.offered_fare)}</Text>
                    </View>
                    {counterFor === r.ride_id ? (
                      <View style={styles.counterRow}>
                        <View style={styles.counterInput}>
                          <Text style={styles.dollar}>$</Text>
                          <TextInput value={counterAmount} onChangeText={setCounterAmount} keyboardType="number-pad" placeholder={String(Math.round(r.offered_fare / 100))} placeholderTextColor={colors.placeholder} style={styles.counterText} />
                        </View>
                        <TouchableOpacity style={styles.sendBtn} onPress={() => { const n = parseInt(counterAmount || '0', 10); if (n > 0) bid(r, n * 100); }}>
                          <Text style={styles.sendText}>Send</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.actions}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => { setCounterFor(r.ride_id); setCounterAmount(''); }}>
                          <Text style={styles.counterBtnText}>Counter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => bid(r, r.offered_fare)}>
                          <Text style={styles.acceptText}>Accept {currency(r.offered_fare)}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

export default enhancer(Dashboard);

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(5),
    margin: wp(4),
    padding: wp(4),
    elevation: 4
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3)
  },
  dot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2)
  },
  bannerTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark
  },
  bannerSub: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  },
  feed: {
    backgroundColor: colors.card,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    padding: wp(4),
    maxHeight: hp(60)
  },
  feedTitle: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark,
    marginBottom: hp(1)
  },
  scroll: {
    maxHeight: hp(48)
  },
  empty: {
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: hp(1)
  },
  emptyText: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary
  },
  req: {
    backgroundColor: colors.elevated,
    borderRadius: wp(4),
    padding: wp(3.5),
    marginBottom: hp(1.2)
  },
  reqHead: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  reqAddr: {
    fontWeight: SemiBold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  reqAddrSub: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary
  },
  reqMeta: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtTertiary,
    marginTop: hp(0.4)
  },
  reqFare: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.primary
  },
  actions: {
    flexDirection: 'row',
    gap: wp(2.5),
    marginTop: hp(1.5)
  },
  counterBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(5.2)
  },
  counterBtnText: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  acceptBtn: {
    flex: 1.4,
    backgroundColor: colors.primary,
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(5.2)
  },
  acceptText: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.ink
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    marginTop: hp(1.5)
  },
  counterInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    height: hp(5.2)
  },
  dollar: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  counterText: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(4),
    color: colors.txtDark
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(6),
    paddingHorizontal: wp(5),
    height: hp(5.2),
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendText: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.ink
  }
});
