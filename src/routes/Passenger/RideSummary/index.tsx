import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp, currency, formatDistance } from '@utils/utilities';
import { Button, StatusBadge } from '@components/common';
import { getRide } from '@store/Ride/api';

function RideSummary({ navigation, route }) {
  const { rideId } = route.params;
  const [ride, setRide] = useState(null);

  useEffect(() => {
    getRide(rideId).then(setRide).catch(() => {});
  }, [rideId]);

  if (!ride) return <SafeAreaView style={styles.safe} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.check}>
          <Icon name="checkmark-circle" size={wp(16)} color={colors.success} />
        </View>
        <Text style={styles.title}>Ride completed</Text>
        <Text style={styles.subtitle}>Thanks for riding with Rideva</Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.total}>{currency(ride.fare_final || ride.fare_estimate)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.locRow}>
            <View style={styles.dot} />
            <Text numberOfLines={1} style={styles.locText}>{ride.pickup_address}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.locRow}>
            <View style={styles.square} />
            <Text numberOfLines={1} style={styles.locText}>{ride.dropoff_address}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatDistance(ride.distance_m)}</Text>
            <StatusBadge label="paid" tone="success" />
          </View>
        </View>

        {ride.driver_id ? (
          <Button label="Rate your driver" onPress={() => navigation.replace('Rate', { rideId, rateeId: ride.driver_id })} buttonStyle={styles.btn} />
        ) : null}
        <Button label="Done" variant="outline" onPress={() => navigation.popToTop()} buttonStyle={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default RideSummary;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  check: {
    alignItems: 'center',
    marginTop: hp(2)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.txtDark,
    textAlign: 'center',
    marginTop: hp(1)
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary,
    textAlign: 'center',
    marginBottom: hp(3)
  },
  totalCard: {
    backgroundColor: colors.dark100,
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: hp(2)
  },
  totalLabel: {
    fontWeight: SemiBold,
    fontSize: wp(3),
    color: colors.txtTertiary
  },
  total: {
    fontWeight: Bold,
    fontSize: wp(8),
    color: colors.txtDark
  },
  card: {
    backgroundColor: colors.dark100,
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2)
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(1)
  },
  dot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(2),
    backgroundColor: colors.primary
  },
  square: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: 2,
    backgroundColor: colors.txtDark
  },
  line: {
    marginLeft: wp(1),
    width: 1,
    height: hp(1.4),
    backgroundColor: colors.border
  },
  locText: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1)
  },
  meta: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary
  },
  btn: {
    marginTop: hp(1.2)
  }
});
